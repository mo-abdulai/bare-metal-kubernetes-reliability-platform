import json
import re
import urllib.error
import urllib.parse
import urllib.request
from datetime import UTC, datetime, timedelta
from typing import Any

from app.config import get_settings
from app.schemas.logs import RecentLogEntry, RecentLogsResponse


class LokiUnavailableError(RuntimeError):
    pass


SENSITIVE_PATTERNS = [
    re.compile(pattern, re.IGNORECASE)
    for pattern in (
        r"(authorization=)[^\s]+",
        r"(bearer\s+)[A-Za-z0-9._~+/=-]+",
        r"(token=)[^\s]+",
        r"(password=)[^\s]+",
        r"(secret=)[^\s]+",
        r"(kubeconfig=)[^\s]+",
    )
]


def _sanitize_message(message: str) -> str:
    sanitized = message.replace("\n", " ").replace("\r", " ").strip()
    for pattern in SENSITIVE_PATTERNS:
        sanitized = pattern.sub(r"\1[redacted]", sanitized)
    return sanitized[:500]


def _timestamp_from_ns(raw: str) -> str:
    try:
        seconds = int(raw) / 1_000_000_000
    except ValueError:
        return raw
    return datetime.fromtimestamp(seconds, tz=UTC).isoformat()


def _field_from_logfmt(line: str, key: str) -> str | None:
    match = re.search(rf"(?:^|\s){re.escape(key)}=([^\s]+)", line)
    return match.group(1) if match else None


def _message_from_line(line: str) -> str:
    message = _field_from_logfmt(line, "message")
    return message if message else line


class LokiClient:
    def __init__(self) -> None:
        self.base_url = get_settings().loki_url.rstrip("/")

    def query_recent_operational_logs(self, limit: int = 20) -> RecentLogsResponse:
        bounded_limit = min(max(limit, 1), 20)
        end = datetime.now(tz=UTC)
        start = end - timedelta(hours=6)
        query = (
            '{namespace="opspulse", app=~"opspulse-api|opspulse-web"} '
            '|~ "(?i)(error|failed|failure|timeout|unavailable|exception)"'
        )
        body = self._query_range(query=query, start=start, end=end, limit=bounded_limit)
        entries: list[RecentLogEntry] = []

        for stream in body.get("data", {}).get("result", []):
            labels = stream.get("stream", {})
            for raw_timestamp, line in stream.get("values", []):
                if not isinstance(line, str):
                    continue
                entries.append(
                    RecentLogEntry(
                        timestamp=_timestamp_from_ns(str(raw_timestamp)),
                        service=labels.get("app") or labels.get("service") or labels.get("container") or "unknown",
                        level=(_field_from_logfmt(line, "level") or "error").lower(),
                        namespace=labels.get("namespace"),
                        pod=labels.get("pod"),
                        container=labels.get("container"),
                        node=labels.get("node"),
                        message=_sanitize_message(_message_from_line(line)),
                    )
                )

        entries.sort(key=lambda entry: entry.timestamp, reverse=True)
        return RecentLogsResponse(status="ok", entries=entries[:bounded_limit])

    def _query_range(self, query: str, start: datetime, end: datetime, limit: int) -> dict[str, Any]:
        params = urllib.parse.urlencode(
            {
                "query": query,
                "start": str(int(start.timestamp() * 1_000_000_000)),
                "end": str(int(end.timestamp() * 1_000_000_000)),
                "limit": str(limit),
                "direction": "backward",
            }
        )
        request = urllib.request.Request(
            f"{self.base_url}/loki/api/v1/query_range?{params}",
            headers={"Accept": "application/json"},
        )

        try:
            with urllib.request.urlopen(request, timeout=5) as response:
                body = json.loads(response.read().decode("utf-8"))
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            raise LokiUnavailableError("Loki query failed.") from exc

        if body.get("status") != "success":
            raise LokiUnavailableError("Loki returned an unsuccessful query response.")
        return body
