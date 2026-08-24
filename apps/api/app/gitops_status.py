from typing import Any

from app.kubernetes_client import KubernetesClient, KubernetesUnavailableError
from app.schemas.gitops import GitOpsApplicationStatus, GitOpsStatusResponse

ARGOCD_NAMESPACE = "argocd"


class GitOpsUnavailableError(RuntimeError):
    pass


def _nested(data: dict[str, Any], *keys: str) -> Any:
    value: Any = data
    for key in keys:
        if not isinstance(value, dict):
            return None
        value = value.get(key)
    return value


def _current_images(application: dict[str, Any]) -> list[str]:
    images = _nested(application, "status", "summary", "images")
    if not isinstance(images, list):
        return []
    return [str(image) for image in images if image]


def _operation_phase(application: dict[str, Any]) -> str | None:
    phase = _nested(application, "status", "operationState", "phase")
    return str(phase) if phase else None


def _application_status(application: dict[str, Any]) -> GitOpsApplicationStatus:
    metadata = application.get("metadata", {})
    spec = application.get("spec", {})
    status = application.get("status", {})
    destination = spec.get("destination", {})
    sync = status.get("sync", {})
    health = status.get("health", {})

    return GitOpsApplicationStatus(
        name=str(metadata.get("name", "unknown")),
        sync_status=str(sync.get("status", "Unknown")),
        health_status=str(health.get("status", "Unknown")),
        revision=sync.get("revision"),
        target_revision=spec.get("targetRevision") or _nested(spec, "source", "targetRevision"),
        destination_namespace=destination.get("namespace"),
        last_operation_phase=_operation_phase(application),
        last_reconciled_at=status.get("reconciledAt"),
        current_images=_current_images(application),
    )


def get_gitops_status() -> GitOpsStatusResponse:
    try:
        body = KubernetesClient().get_json(f"/apis/argoproj.io/v1alpha1/namespaces/{ARGOCD_NAMESPACE}/applications")
    except KubernetesUnavailableError as exc:
        raise GitOpsUnavailableError("Argo CD Application status is unavailable.") from exc

    items = body.get("items", [])
    if not isinstance(items, list):
        raise GitOpsUnavailableError("Argo CD Application response is invalid.")

    applications = [_application_status(item) for item in items if isinstance(item, dict)]
    applications.sort(key=lambda item: item.name)
    return GitOpsStatusResponse(status="ok", applications=applications)
