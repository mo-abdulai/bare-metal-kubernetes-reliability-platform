import json
import logging
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Any

from app.config import get_settings
from app.schemas.metrics import MetricsApi, MetricsDeployment, MetricsNode, MetricsPodPhase, MetricsPodRestart, MetricsSummary

logger = logging.getLogger(__name__)


class MetricsUnavailableError(RuntimeError):
    pass


@dataclass(frozen=True)
class PrometheusSample:
    metric: dict[str, str]
    value: float


class PrometheusClient:
    def __init__(self) -> None:
        self.base_url = get_settings().prometheus_url.rstrip("/")

    def query(self, promql: str) -> list[PrometheusSample]:
        params = urllib.parse.urlencode({"query": promql})
        request = urllib.request.Request(f"{self.base_url}/api/v1/query?{params}", headers={"Accept": "application/json"})

        try:
            with urllib.request.urlopen(request, timeout=5) as response:
                body = json.loads(response.read().decode("utf-8"))
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            logger.warning("Prometheus query failed route=/api/metrics/summary error=%s", exc.__class__.__name__)
            raise MetricsUnavailableError("Prometheus query failed.") from exc

        if body.get("status") != "success":
            logger.warning("Prometheus returned unsuccessful response route=/api/metrics/summary")
            raise MetricsUnavailableError("Prometheus returned an unsuccessful query response.")

        result = body.get("data", {}).get("result", [])
        return [self._sample(item) for item in result]

    @staticmethod
    def _sample(item: dict[str, Any]) -> PrometheusSample:
        value = item.get("value", [None, "0"])[1]
        try:
            numeric = float(value)
        except (TypeError, ValueError):
            numeric = 0.0
        return PrometheusSample(metric=item.get("metric", {}), value=numeric)


def _values_by_label(samples: list[PrometheusSample], label: str) -> dict[str, float]:
    return {sample.metric.get(label, "unknown"): sample.value for sample in samples}


def _round(value: float) -> float:
    return round(value, 2)


def get_metrics_summary() -> MetricsSummary:
    client = PrometheusClient()

    cpu_by_node = _values_by_label(
        client.query(
            '(100 * (1 - avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])))) * on(instance) group_left(nodename) node_uname_info'
        ),
        "nodename",
    )
    memory_by_node = _values_by_label(
        client.query(
            "(100 * (1 - ((node_memory_MemAvailable_bytes or node_memory_MemFree_bytes) / node_memory_MemTotal_bytes))) * on(instance) group_left(nodename) node_uname_info"
        ),
        "nodename",
    )
    filesystem_by_node = _values_by_label(
        client.query(
            'max by (instance) (100 * (1 - (node_filesystem_avail_bytes{fstype!~"tmpfs|overlay|squashfs|proc|sysfs|devtmpfs"} / node_filesystem_size_bytes{fstype!~"tmpfs|overlay|squashfs|proc|sysfs|devtmpfs"}))) * on(instance) group_left(nodename) node_uname_info'
        ),
        "nodename",
    )

    node_names = sorted(set(cpu_by_node) | set(memory_by_node) | set(filesystem_by_node))
    nodes = [
        MetricsNode(
            name=name,
            cpu_percent=_round(cpu_by_node.get(name, 0.0)),
            memory_percent=_round(memory_by_node.get(name, 0.0)),
            filesystem_percent=_round(filesystem_by_node.get(name, 0.0)),
        )
        for name in node_names
    ]

    desired = {
        (sample.metric.get("namespace", "unknown"), sample.metric.get("deployment", "unknown")): sample.value
        for sample in client.query('kube_deployment_spec_replicas{namespace="opspulse"}')
    }
    available = {
        (sample.metric.get("namespace", "unknown"), sample.metric.get("deployment", "unknown")): sample.value
        for sample in client.query('kube_deployment_status_replicas_available{namespace="opspulse"}')
    }
    deployments = [
        MetricsDeployment(
            namespace=namespace,
            name=name,
            desired=replicas,
            available=available.get((namespace, name), 0.0),
            unavailable=max(replicas - available.get((namespace, name), 0.0), 0.0),
        )
        for (namespace, name), replicas in sorted(desired.items())
    ]

    pod_restarts = [
        MetricsPodRestart(
            namespace=sample.metric.get("namespace", "unknown"),
            pod=sample.metric.get("pod", "unknown"),
            container=sample.metric.get("container", "unknown"),
            restarts=sample.value,
        )
        for sample in client.query('kube_pod_container_status_restarts_total{namespace="opspulse"}')
    ]
    pod_phases = [
        MetricsPodPhase(phase=sample.metric.get("phase", "unknown"), count=sample.value)
        for sample in client.query('sum by (phase) (kube_pod_status_phase{namespace="opspulse"})')
    ]

    api_up = any(sample.value == 1 for sample in client.query('up{job="opspulse-api"}'))
    request_rate = sum(sample.value for sample in client.query('sum(rate(opspulse_api_http_requests_total[5m]))'))
    error_rate = sum(sample.value for sample in client.query('sum(rate(opspulse_api_http_requests_total{status_code=~"5.."}[5m]))'))
    duration_samples = client.query(
        'histogram_quantile(0.95, sum(rate(opspulse_api_http_request_duration_seconds_bucket[5m])) by (le))'
    )
    p95_duration = duration_samples[0].value if duration_samples else None

    return MetricsSummary(
        status="connected",
        nodes=nodes,
        deployments=deployments,
        pod_restarts=pod_restarts,
        pod_phases=pod_phases,
        api=MetricsApi(
            up=api_up,
            request_rate_per_second=_round(request_rate),
            error_rate_per_second=_round(error_rate),
            p95_duration_seconds=_round(p95_duration) if p95_duration is not None else None,
        ),
    )
