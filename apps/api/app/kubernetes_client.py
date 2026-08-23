import json
import logging
import os
import shlex
import ssl
import subprocess
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app.schemas.cluster import LiveClusterInventory, LiveClusterSummary, LiveDeployment, LiveNode, LivePod, LiveService
from app.schemas.logs import RecentEvent, RecentEventsResponse

SERVICE_ACCOUNT_DIR = Path("/var/run/secrets/kubernetes.io/serviceaccount")
logger = logging.getLogger(__name__)


class KubernetesUnavailableError(RuntimeError):
    pass


@dataclass(frozen=True)
class KubernetesConfig:
    base_url: str
    token: str | None
    namespace: str
    ca_path: Path | None
    kubectl: str | None = None


def _load_config() -> KubernetesConfig:
    host = os.getenv("KUBERNETES_SERVICE_HOST")
    port = os.getenv("KUBERNETES_SERVICE_PORT", "443")
    token_path = SERVICE_ACCOUNT_DIR / "token"
    namespace_path = SERVICE_ACCOUNT_DIR / "namespace"
    ca_path = SERVICE_ACCOUNT_DIR / "ca.crt"

    if host and token_path.exists() and namespace_path.exists() and ca_path.exists():
        return KubernetesConfig(
            base_url=f"https://{host}:{port}",
            token=token_path.read_text(encoding="utf-8").strip(),
            namespace=namespace_path.read_text(encoding="utf-8").strip(),
            ca_path=ca_path,
        )

    kubectl = os.getenv("OPSPULSE_KUBECTL")
    namespace = os.getenv("OPSPULSE_KUBERNETES_NAMESPACE", "opspulse")
    if not kubectl:
        raise KubernetesUnavailableError("Kubernetes service account or OPSPULSE_KUBECTL is not available.")

    return KubernetesConfig(
        base_url="",
        token=None,
        namespace=namespace,
        ca_path=None,
        kubectl=kubectl,
    )


class KubernetesClient:
    def __init__(self) -> None:
        self.config = _load_config()
        self.context = ssl.create_default_context(cafile=str(self.config.ca_path)) if self.config.ca_path else None

    def get_json(self, path: str) -> dict[str, Any]:
        if self.config.kubectl:
            return self._get_json_with_kubectl(path)

        if not self.config.token or not self.context:
            raise KubernetesUnavailableError("Kubernetes API credentials are unavailable.")

        request = urllib.request.Request(
            f"{self.config.base_url}{path}",
            headers={"Authorization": f"Bearer {self.config.token}", "Accept": "application/json"},
        )

        try:
            with urllib.request.urlopen(request, context=self.context, timeout=5) as response:
                return json.loads(response.read().decode("utf-8"))
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            logger.warning("Kubernetes API request failed path=%s error=%s", path, exc.__class__.__name__)
            raise KubernetesUnavailableError("Kubernetes API request failed.") from exc

    def _get_json_with_kubectl(self, path: str) -> dict[str, Any]:
        namespace = self.config.namespace
        resource: str | None = None
        namespaced = False

        if path == "/api/v1/nodes":
            resource = "nodes"
        elif path == f"/apis/apps/v1/namespaces/{namespace}/deployments":
            resource = "deployments"
            namespaced = True
        elif path == f"/api/v1/namespaces/{namespace}/pods":
            resource = "pods"
            namespaced = True
        elif path == f"/api/v1/namespaces/{namespace}/services":
            resource = "services"
            namespaced = True
        elif path == f"/api/v1/namespaces/{namespace}/endpoints":
            resource = "endpoints"
            namespaced = True
        elif path == "/api/v1/events":
            resource = "events"

        if not resource:
            raise KubernetesUnavailableError(f"Unsupported Kubernetes inventory path: {path}")

        command = [*shlex.split(self.config.kubectl or ""), "get", resource]
        if namespaced:
            command.extend(["-n", namespace])
        command.extend(["-o", "json"])

        try:
            result = subprocess.run(command, check=True, capture_output=True, text=True, timeout=10)
            return json.loads(result.stdout)
        except (OSError, subprocess.SubprocessError, json.JSONDecodeError) as exc:
            logger.warning("kubectl inventory request failed resource=%s error=%s", resource, exc.__class__.__name__)
            raise KubernetesUnavailableError("kubectl inventory request failed.") from exc


def _node_role(node: dict[str, Any]) -> str:
    labels = node.get("metadata", {}).get("labels", {})
    if "node-role.kubernetes.io/control-plane" in labels:
        return "control-plane"
    if "node-role.kubernetes.io/master" in labels:
        return "control-plane"
    return "worker"


def _node_ready(node: dict[str, Any]) -> str:
    for condition in node.get("status", {}).get("conditions", []):
        if condition.get("type") == "Ready":
            return "Ready" if condition.get("status") == "True" else "NotReady"
    return "Unknown"


def _internal_ip(node: dict[str, Any]) -> str:
    for address in node.get("status", {}).get("addresses", []):
        if address.get("type") == "InternalIP":
            return address.get("address", "unknown")
    return "unknown"


def _format_cpu(quantity: str | None) -> str:
    if not quantity:
        return "unknown"
    if quantity.endswith("m"):
        try:
            millicores = int(quantity[:-1])
        except ValueError:
            return quantity
        return f"{millicores / 1000:g} cores" if millicores >= 1000 else f"{millicores}m"
    try:
        cores = float(quantity)
    except ValueError:
        return quantity
    return f"{cores:g} cores"


def _format_binary_bytes(quantity: str | None) -> str:
    if not quantity:
        return "unknown"

    suffixes = {
        "Ki": 1024,
        "Mi": 1024**2,
        "Gi": 1024**3,
        "Ti": 1024**4,
        "K": 1000,
        "M": 1000**2,
        "G": 1000**3,
        "T": 1000**4,
    }
    multiplier = 1
    raw_number = quantity
    for suffix, value in suffixes.items():
        if quantity.endswith(suffix):
            multiplier = value
            raw_number = quantity[: -len(suffix)]
            break

    try:
        bytes_value = float(raw_number) * multiplier
    except ValueError:
        return quantity

    if bytes_value >= 1024**4:
        return f"{bytes_value / 1024**4:.1f} TiB"
    if bytes_value >= 1024**3:
        return f"{bytes_value / 1024**3:.1f} GiB"
    if bytes_value >= 1024**2:
        return f"{bytes_value / 1024**2:.1f} MiB"
    return f"{bytes_value / 1024:.1f} KiB"


def _resource_value(node: dict[str, Any], section: str, key: str) -> str | None:
    return node.get("status", {}).get(section, {}).get(key)


def _pod_ready(pod: dict[str, Any]) -> bool:
    for condition in pod.get("status", {}).get("conditions", []):
        if condition.get("type") == "Ready":
            return condition.get("status") == "True"
    return False


def _pod_restarts(pod: dict[str, Any]) -> int:
    return sum(status.get("restartCount", 0) for status in pod.get("status", {}).get("containerStatuses", []))


def _deployment_image(deployment: dict[str, Any]) -> str:
    containers = deployment.get("spec", {}).get("template", {}).get("spec", {}).get("containers", [])
    if not containers:
        return "unknown"
    return containers[0].get("image", "unknown")


def _endpoint_counts(endpoints: dict[str, Any]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for endpoint in endpoints.get("items", []):
        name = endpoint.get("metadata", {}).get("name", "unknown")
        counts[name] = sum(len(subset.get("addresses", [])) for subset in endpoint.get("subsets", []))
    return counts


def _event_timestamp(event: dict[str, Any]) -> str:
    return (
        event.get("eventTime")
        or event.get("lastTimestamp")
        or event.get("firstTimestamp")
        or event.get("metadata", {}).get("creationTimestamp")
        or ""
    )


def _event_object(event: dict[str, Any]) -> dict[str, Any]:
    return event.get("involvedObject", {})


def _event_node(event: dict[str, Any]) -> str | None:
    source = event.get("source", {})
    if source.get("host"):
        return source["host"]
    reporting_instance = event.get("reportingInstance", "")
    return reporting_instance if reporting_instance in {"homepi", "workpi"} else None


def get_live_cluster_inventory() -> LiveClusterInventory:
    client = KubernetesClient()
    namespace = client.config.namespace

    nodes_data = client.get_json("/api/v1/nodes")
    deployments_data = client.get_json(f"/apis/apps/v1/namespaces/{namespace}/deployments")
    pods_data = client.get_json(f"/api/v1/namespaces/{namespace}/pods")
    services_data = client.get_json(f"/api/v1/namespaces/{namespace}/services")
    endpoints_data = client.get_json(f"/api/v1/namespaces/{namespace}/endpoints")
    endpoint_counts = _endpoint_counts(endpoints_data)

    nodes = [
        LiveNode(
            name=node.get("metadata", {}).get("name", "unknown"),
            role=_node_role(node),
            status=_node_ready(node),
            architecture=node.get("status", {}).get("nodeInfo", {}).get("architecture", "unknown"),
            os_image=node.get("status", {}).get("nodeInfo", {}).get("osImage", "unknown"),
            kernel_version=node.get("status", {}).get("nodeInfo", {}).get("kernelVersion", "unknown"),
            kubelet_version=node.get("status", {}).get("nodeInfo", {}).get("kubeletVersion", "unknown"),
            container_runtime=node.get("status", {}).get("nodeInfo", {}).get("containerRuntimeVersion", "unknown"),
            internal_ip=_internal_ip(node),
            cpu_capacity=_format_cpu(_resource_value(node, "capacity", "cpu")),
            cpu_allocatable=_format_cpu(_resource_value(node, "allocatable", "cpu")),
            memory_capacity=_format_binary_bytes(_resource_value(node, "capacity", "memory")),
            memory_allocatable=_format_binary_bytes(_resource_value(node, "allocatable", "memory")),
            storage_capacity=_format_binary_bytes(_resource_value(node, "capacity", "ephemeral-storage")),
            storage_allocatable=_format_binary_bytes(_resource_value(node, "allocatable", "ephemeral-storage")),
        )
        for node in nodes_data.get("items", [])
    ]

    deployments = [
        LiveDeployment(
            name=deployment.get("metadata", {}).get("name", "unknown"),
            namespace=deployment.get("metadata", {}).get("namespace", namespace),
            desired=deployment.get("spec", {}).get("replicas", 0),
            ready=deployment.get("status", {}).get("readyReplicas", 0),
            available=deployment.get("status", {}).get("availableReplicas", 0),
            status="available"
            if deployment.get("status", {}).get("availableReplicas", 0) >= deployment.get("spec", {}).get("replicas", 0)
            else "pending",
            image=_deployment_image(deployment),
        )
        for deployment in deployments_data.get("items", [])
    ]

    pods = [
        LivePod(
            name=pod.get("metadata", {}).get("name", "unknown"),
            namespace=pod.get("metadata", {}).get("namespace", namespace),
            node_name=pod.get("spec", {}).get("nodeName", "unknown"),
            phase=pod.get("status", {}).get("phase", "Unknown"),
            ready=_pod_ready(pod),
            restarts=_pod_restarts(pod),
            pod_ip=pod.get("status", {}).get("podIP", "unknown"),
        )
        for pod in pods_data.get("items", [])
    ]

    services = [
        LiveService(
            name=service.get("metadata", {}).get("name", "unknown"),
            namespace=service.get("metadata", {}).get("namespace", namespace),
            type=service.get("spec", {}).get("type", "unknown"),
            ports=[f"{port.get('port')}/{port.get('protocol', 'TCP')}" for port in service.get("spec", {}).get("ports", [])],
            ready_endpoints=endpoint_counts.get(service.get("metadata", {}).get("name", ""), 0),
        )
        for service in services_data.get("items", [])
    ]

    return LiveClusterInventory(
        status="connected",
        namespace=namespace,
        summary=LiveClusterSummary(
            nodes=len(nodes),
            ready_nodes=sum(1 for node in nodes if node.status == "Ready"),
            deployments=len(deployments),
            ready_deployments=sum(1 for deployment in deployments if deployment.status == "available"),
            pods=len(pods),
            ready_pods=sum(1 for pod in pods if pod.ready),
            services=len(services),
        ),
        nodes=nodes,
        deployments=deployments,
        pods=pods,
        services=services,
    )


def get_recent_kubernetes_events(limit: int = 10) -> RecentEventsResponse:
    client = KubernetesClient()
    events_data = client.get_json("/api/v1/events")
    bounded_limit = min(max(limit, 1), 20)

    events = []
    for event in events_data.get("items", []):
        involved = _event_object(event)
        events.append(
            RecentEvent(
                timestamp=_event_timestamp(event),
                type=event.get("type", "Unknown"),
                reason=event.get("reason", "Unknown"),
                object_kind=involved.get("kind", "Unknown"),
                object_name=involved.get("name", "unknown"),
                namespace=involved.get("namespace") or event.get("metadata", {}).get("namespace"),
                node=_event_node(event),
                message=(event.get("message") or "")[:500],
            )
        )

    events.sort(key=lambda item: item.timestamp, reverse=True)
    return RecentEventsResponse(status="ok", events=events[:bounded_limit])
