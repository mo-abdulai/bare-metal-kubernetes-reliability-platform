import re
from pathlib import Path

from app.config import get_settings
from app.schemas.incidents import RunbookDetail, RunbookSummary


class RunbookNotFoundError(RuntimeError):
    pass


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def _runbook_dir() -> Path:
    configured = Path(get_settings().runbook_dir)
    if configured.is_absolute():
        return configured
    candidates = [
        Path.cwd() / configured,
        _repo_root() / configured,
        Path("/app") / configured,
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return candidates[0]


def _extract_section(content: str, heading: str) -> str:
    pattern = rf"^## {re.escape(heading)}\n(?P<body>.*?)(?=^## |\Z)"
    match = re.search(pattern, content, re.MULTILINE | re.DOTALL)
    return match.group("body").strip() if match else ""


def _title(content: str, fallback: str) -> str:
    match = re.search(r"^# Runbook:\s*(.+)$", content, re.MULTILINE)
    return match.group(1).strip() if match else fallback.replace("-", " ").title()


def _metadata(content: str, key: str) -> str:
    match = re.search(rf"^<!--\s*{re.escape(key)}:\s*(.*?)\s*-->\s*$", content, re.MULTILINE)
    return match.group(1).strip() if match else ""


def _summary(path: Path) -> RunbookSummary:
    content = path.read_text(encoding="utf-8")
    runbook_id = path.stem
    linked = [item.strip() for item in _metadata(content, "signals").split(",") if item.strip()]
    return RunbookSummary(
        id=runbook_id,
        title=_title(content, runbook_id),
        category=_metadata(content, "category") or "Infrastructure",
        linked_signals=linked,
        last_updated=_metadata(content, "last_updated") or "unknown",
        purpose=_extract_section(content, "Purpose").splitlines()[0] if _extract_section(content, "Purpose") else "",
    )


def list_runbooks() -> list[RunbookSummary]:
    directory = _runbook_dir()
    if not directory.exists():
        return []
    return sorted([_summary(path) for path in directory.glob("*.md")], key=lambda item: item.title)


def get_runbook(runbook_id: str) -> RunbookDetail:
    path = _runbook_dir() / f"{runbook_id}.md"
    if not path.exists():
        raise RunbookNotFoundError(f"Runbook not found: {runbook_id}")
    summary = _summary(path)
    return RunbookDetail(**summary.model_dump(), content=path.read_text(encoding="utf-8"))


RUNBOOK_MAPPINGS = {
    "NodeNotReady": "node-not-ready",
    "node notready": "node-not-ready",
    "CrashLoopBackOff": "crashloopbackoff",
    "BackOff": "crashloopbackoff",
    "OOMKilled": "oomkilled",
    "DeploymentUnavailable": "deployment-unavailable",
    "Deployment unavailable": "deployment-unavailable",
    "FailedScheduling": "pod-pending",
    "service-no-endpoints": "service-no-endpoints",
    "no endpoints": "service-no-endpoints",
    "API unavailable": "api-unavailable",
    "opspulse-api": "api-unavailable",
    "DNSConfigForming": "dns-resolution",
}


def suggested_runbook(title: str, component: str, message: str = "") -> str | None:
    haystack = f"{title} {component} {message}".lower()
    for key, runbook_id in RUNBOOK_MAPPINGS.items():
        if key.lower() in haystack:
            return runbook_id
    return None
