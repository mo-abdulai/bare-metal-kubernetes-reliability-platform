import hashlib
import os
from collections import defaultdict
from datetime import UTC, datetime, timedelta

from app.alertmanager_client import AlertmanagerClient, AlertmanagerUnavailableError
from app.gitops_status import GitOpsUnavailableError, get_gitops_status
from app.kubernetes_client import KubernetesUnavailableError, get_recent_kubernetes_events
from app.loki_client import LokiClient, LokiUnavailableError
from app.prometheus_client import MetricsUnavailableError, get_metrics_summary
from app.runbook_repository import suggested_runbook
from app.schemas.incidents import ActiveAlert, IncidentCandidate, Signal

SIGNAL_RETENTION_MINUTES = int(os.getenv("OPSPULSE_SIGNAL_RETENTION_MINUTES", "240"))
_SIGNAL_CACHE: dict[str, Signal] = {}


def _signal_id(source: str, timestamp: str, component: str, title: str) -> str:
    raw = f"{source}|{timestamp}|{component}|{title}"
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()[:16]


def _component(*values: str | None) -> str:
    for value in values:
        if value and value != "unknown":
            return value
    return "platform"


def _severity_from_alert(value: str | None) -> str:
    severity = (value or "").lower()
    if severity in {"critical", "sev-1", "sev1"}:
        return "SEV-1"
    if severity in {"warning", "major", "sev-2", "sev2"}:
        return "SEV-2"
    return "SEV-3"


def _severity_from_text(text: str) -> str:
    lower = text.lower()
    if "notready" in lower or "unavailable" in lower or "down" in lower:
        return "SEV-2"
    if "oom" in lower or "crashloop" in lower or "failed" in lower or "warning" in lower:
        return "SEV-3"
    return "SEV-4"


def active_alerts() -> list[ActiveAlert]:
    try:
        return AlertmanagerClient().active_alerts()
    except AlertmanagerUnavailableError:
        return []


def _parse_timestamp(value: str) -> datetime:
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return datetime.now(tz=UTC)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=UTC)
    return parsed.astimezone(UTC)


def _signals_from_cache() -> list[Signal]:
    now = datetime.now(tz=UTC)
    cutoff = now - timedelta(minutes=SIGNAL_RETENTION_MINUTES)
    expired = [signal_id for signal_id, signal in _SIGNAL_CACHE.items() if _parse_timestamp(signal.timestamp) < cutoff]
    for signal_id in expired:
        _SIGNAL_CACHE.pop(signal_id, None)
    return list(_SIGNAL_CACHE.values())


def _remember_signals(signals: list[Signal]) -> list[Signal]:
    for signal in signals:
        _SIGNAL_CACHE[signal.id] = signal
    return _signals_from_cache()


def aggregate_signals(limit: int = 30) -> list[Signal]:
    signals: list[Signal] = []

    for alert in active_alerts():
        component = _component(alert.pod, alert.node, alert.labels.get("deployment"), alert.labels.get("service"), alert.namespace, alert.name)
        signals.append(
            Signal(
                id=_signal_id("prometheus", alert.started_at or "", component, alert.name),
                timestamp=alert.started_at or datetime.now(tz=UTC).isoformat(),
                source="prometheus",
                severity_hint=_severity_from_alert(alert.severity),  # type: ignore[arg-type]
                component=component,
                title=alert.name,
                message=alert.summary or f"Prometheus alert {alert.name} is {alert.state}.",
                metadata={key: value for key, value in alert.labels.items() if value},
            )
        )

    try:
        events = get_recent_kubernetes_events(limit=20).events
    except KubernetesUnavailableError:
        events = []
    for event in events:
        if event.type != "Warning" and event.reason not in {"Killing", "BackOff", "Unhealthy", "FailedScheduling"}:
            continue
        component = _component(event.object_name, event.node, event.namespace)
        title = f"{event.reason}: {event.object_kind}/{event.object_name}"
        signals.append(
            Signal(
                id=_signal_id("kubernetes", event.timestamp, component, title),
                timestamp=event.timestamp,
                source="kubernetes",
                severity_hint=_severity_from_text(f"{event.type} {event.reason} {event.message}"),  # type: ignore[arg-type]
                component=component,
                title=title,
                message=event.message,
                metadata={
                    "type": event.type,
                    "reason": event.reason,
                    "object_kind": event.object_kind,
                    "object_name": event.object_name,
                    "namespace": event.namespace or "",
                    "node": event.node or "",
                },
            )
        )

    try:
        logs = LokiClient().query_recent_operational_logs(limit=10).entries
    except LokiUnavailableError:
        logs = []
    for entry in logs:
        component = _component(entry.service, entry.pod, entry.node, entry.namespace)
        signals.append(
            Signal(
                id=_signal_id("loki", entry.timestamp, component, entry.message),
                timestamp=entry.timestamp,
                source="loki",
                severity_hint=_severity_from_text(entry.message),  # type: ignore[arg-type]
                component=component,
                title=f"{entry.service} log signal",
                message=entry.message,
                metadata={
                    "level": entry.level,
                    "namespace": entry.namespace or "",
                    "pod": entry.pod or "",
                    "container": entry.container or "",
                    "node": entry.node or "",
                },
            )
        )

    try:
        metrics = get_metrics_summary()
    except MetricsUnavailableError:
        metrics = None
    if metrics:
        for deployment in metrics.deployments:
            if deployment.unavailable <= 0:
                continue
            component = deployment.name
            signals.append(
                Signal(
                    id=_signal_id("workload", deployment.namespace, component, "Deployment unavailable replicas"),
                    timestamp=datetime.now(tz=UTC).isoformat(),
                    source="workload",
                    severity_hint="SEV-3",
                    component=component,
                    title="Deployment unavailable replicas",
                    message=f"{deployment.unavailable:g} unavailable replicas for {deployment.namespace}/{deployment.name}.",
                    metadata={"namespace": deployment.namespace, "deployment": deployment.name},
                )
            )
        for restart in metrics.pod_restarts:
            if restart.restarts <= 0:
                continue
            component = _component(restart.pod, restart.container, restart.namespace)
            signals.append(
                Signal(
                    id=_signal_id("workload", restart.pod, component, "Pod restart observed"),
                    timestamp=datetime.now(tz=UTC).isoformat(),
                    source="workload",
                    severity_hint="SEV-4",
                    component=component,
                    title="Pod restart observed",
                    message=f"{restart.container} in {restart.pod} has {restart.restarts:g} restarts.",
                    metadata={"namespace": restart.namespace, "pod": restart.pod, "container": restart.container},
                )
            )

    try:
        gitops_status = get_gitops_status()
    except GitOpsUnavailableError:
        gitops_status = None
    if gitops_status:
        for application in gitops_status.applications:
            failure_state = application.health_status in {"Degraded", "Missing"} or application.sync_status == "OutOfSync"
            if not failure_state:
                continue
            title = f"Argo CD application {application.name} {application.sync_status}/{application.health_status}"
            signals.append(
                Signal(
                    id=_signal_id("gitops", application.last_reconciled_at or application.revision or "", application.name, title),
                    timestamp=application.last_reconciled_at or datetime.now(tz=UTC).isoformat(),
                    source="gitops",
                    severity_hint="SEV-3",
                    component=application.name,
                    title=title,
                    message=f"Argo CD reports sync={application.sync_status}, health={application.health_status}.",
                    metadata={
                        "application": application.name,
                        "sync_status": application.sync_status,
                        "health_status": application.health_status,
                        "revision": application.revision or "",
                        "namespace": application.destination_namespace or "",
                    },
                )
            )

    retained_signals = _remember_signals(signals)
    retained_signals.sort(key=lambda item: _parse_timestamp(item.timestamp), reverse=True)
    return retained_signals[:limit]


def _correlation_key(signal: Signal) -> str:
    for key in ("pod", "deployment", "node", "service", "object_name", "namespace"):
        value = signal.metadata.get(key)
        if value:
            return f"{key}:{value}"
    return f"component:{signal.component}"


def _severity_rank(severity: str) -> int:
    return {"SEV-1": 1, "SEV-2": 2, "SEV-3": 3, "SEV-4": 4}.get(severity, 4)


def incident_candidates() -> list[IncidentCandidate]:
    grouped: dict[str, list[Signal]] = defaultdict(list)
    for signal in aggregate_signals(limit=50):
        grouped[_correlation_key(signal)].append(signal)

    candidates: list[IncidentCandidate] = []
    for key, signals in grouped.items():
        if not signals:
            continue
        signals.sort(key=lambda item: item.timestamp)
        representative = signals[0]
        severity = sorted((signal.severity_hint for signal in signals), key=_severity_rank)[0]
        title = representative.title if len(signals) == 1 else f"{representative.component} correlated signals"
        candidate_id = hashlib.sha1("|".join(signal.id for signal in signals).encode("utf-8")).hexdigest()[:16]
        candidates.append(
            IncidentCandidate(
                candidate_id=f"CAND-{candidate_id}",
                title=title,
                component=representative.component,
                first_seen=signals[0].timestamp,
                last_seen=signals[-1].timestamp,
                signal_count=len(signals),
                severity_suggestion=severity,  # type: ignore[arg-type]
                runbook_id=suggested_runbook(title, representative.component, representative.message),
                signals=list(reversed(signals))[:10],
            )
        )

    candidates.sort(key=lambda item: (item.last_seen, item.signal_count), reverse=True)
    return candidates[:10]


def signals_by_ids(signal_ids: list[str], candidate_id: str | None = None) -> list[Signal]:
    candidates = incident_candidates()
    all_signals = aggregate_signals(limit=80)
    if candidate_id:
        for candidate in candidates:
            if candidate.candidate_id == candidate_id:
                all_signals.extend(candidate.signals)
                if not signal_ids:
                    return candidate.signals
                break
    index = {signal.id: signal for signal in all_signals}
    return [index[signal_id] for signal_id in signal_ids if signal_id in index]
