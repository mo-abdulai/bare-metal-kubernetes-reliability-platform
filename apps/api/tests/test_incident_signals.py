from datetime import UTC, datetime

import app.incident_signals as incident_signals
from app.kubernetes_client import KubernetesUnavailableError
from app.loki_client import LokiUnavailableError
from app.prometheus_client import MetricsUnavailableError
from app.schemas.logs import RecentEventsResponse


def test_recent_signals_are_retained_after_live_window_moves_on(monkeypatch) -> None:
    incident_signals._SIGNAL_CACHE.clear()
    timestamp = datetime.now(tz=UTC).isoformat()

    monkeypatch.setattr(incident_signals, "active_alerts", lambda: [])
    monkeypatch.setattr(
        incident_signals,
        "get_recent_kubernetes_events",
        lambda limit=20: RecentEventsResponse(
            status="ok",
            events=[
                {
                    "timestamp": timestamp,
                    "type": "Warning",
                    "reason": "BackOff",
                    "object_kind": "Pod",
                    "object_name": "opspulse-chaos-crashloop",
                    "namespace": "opspulse-chaos",
                    "message": "Back-off restarting failed container.",
                }
            ],
        ),
    )
    monkeypatch.setattr(incident_signals.LokiClient, "query_recent_operational_logs", lambda self, limit=10: (_ for _ in ()).throw(LokiUnavailableError()))
    monkeypatch.setattr(incident_signals, "get_metrics_summary", lambda: (_ for _ in ()).throw(MetricsUnavailableError()))
    monkeypatch.setattr(incident_signals, "get_gitops_status", lambda: (_ for _ in ()).throw(incident_signals.GitOpsUnavailableError()))

    first_signals = incident_signals.aggregate_signals()
    assert first_signals[0].title == "BackOff: Pod/opspulse-chaos-crashloop"

    monkeypatch.setattr(incident_signals, "get_recent_kubernetes_events", lambda limit=20: (_ for _ in ()).throw(KubernetesUnavailableError()))

    retained_signals = incident_signals.aggregate_signals()
    assert [signal.id for signal in retained_signals] == [first_signals[0].id]

    candidates = incident_signals.incident_candidates()
    assert candidates[0].signals[0].id == first_signals[0].id
