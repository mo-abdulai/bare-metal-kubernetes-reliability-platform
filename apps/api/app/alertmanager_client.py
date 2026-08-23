import hashlib
import json
import logging
import urllib.error
import urllib.request
from typing import Any

from app.config import get_settings
from app.schemas.incidents import ActiveAlert

logger = logging.getLogger(__name__)


class AlertmanagerUnavailableError(RuntimeError):
    pass


SAFE_ANNOTATIONS = ("summary", "description", "message")
SAFE_LABELS = ("alertname", "severity", "instance", "namespace", "pod", "node", "deployment", "service", "job")


def _alert_id(labels: dict[str, str], starts_at: str | None) -> str:
    raw = "|".join(f"{key}={labels.get(key, '')}" for key in SAFE_LABELS) + f"|{starts_at or ''}"
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()[:16]


class AlertmanagerClient:
    def __init__(self) -> None:
        self.base_url = get_settings().alertmanager_url.rstrip("/")

    def active_alerts(self) -> list[ActiveAlert]:
        request = urllib.request.Request(f"{self.base_url}/api/v2/alerts", headers={"Accept": "application/json"})
        try:
            with urllib.request.urlopen(request, timeout=5) as response:
                body = json.loads(response.read().decode("utf-8"))
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            logger.warning("Alertmanager query failed error=%s", exc.__class__.__name__)
            raise AlertmanagerUnavailableError("Alertmanager query failed.") from exc

        if not isinstance(body, list):
            raise AlertmanagerUnavailableError("Alertmanager returned an unexpected response.")
        return [_to_alert(item) for item in body if isinstance(item, dict)]


def _to_alert(item: dict[str, Any]) -> ActiveAlert:
    labels = {key: str(value) for key, value in item.get("labels", {}).items() if key in SAFE_LABELS}
    annotations = {key: str(value) for key, value in item.get("annotations", {}).items() if key in SAFE_ANNOTATIONS}
    status = item.get("status", {})
    starts_at = item.get("startsAt")
    return ActiveAlert(
        id=_alert_id(labels, starts_at),
        name=labels.get("alertname", "UnknownAlert"),
        state=str(status.get("state", "unknown")),
        severity=labels.get("severity"),
        instance=labels.get("instance"),
        namespace=labels.get("namespace"),
        pod=labels.get("pod"),
        node=labels.get("node"),
        summary=annotations.get("summary") or annotations.get("description") or annotations.get("message"),
        started_at=starts_at,
        labels=labels,
    )
