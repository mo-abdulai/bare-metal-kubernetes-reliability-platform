import json
from datetime import UTC, datetime
from pathlib import Path

from app.config import get_settings
from app.schemas.incidents import (
    Incident,
    IncidentCreateRequest,
    IncidentResolution,
    IncidentTimelineEntry,
    IncidentUpdateRequest,
    ResolveIncidentRequest,
    Signal,
    TimelineCreateRequest,
)


class IncidentNotFoundError(RuntimeError):
    pass


def now_iso() -> str:
    return datetime.now(tz=UTC).replace(microsecond=0).isoformat()


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def incident_dir() -> Path:
    configured = Path(get_settings().incident_data_dir)
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


def _path(incident_id: str) -> Path:
    return incident_dir() / f"{incident_id}.json"


def list_incidents() -> list[Incident]:
    directory = incident_dir()
    if not directory.exists():
        return []
    incidents = []
    for path in sorted(directory.glob("INC-*.json")):
        incidents.append(Incident.model_validate_json(path.read_text(encoding="utf-8")))
    return sorted(incidents, key=lambda item: item.created_at, reverse=True)


def get_incident(incident_id: str) -> Incident:
    path = _path(incident_id)
    if not path.exists():
        raise IncidentNotFoundError(f"Incident not found: {incident_id}")
    return Incident.model_validate_json(path.read_text(encoding="utf-8"))


def _write(incident: Incident) -> Incident:
    directory = incident_dir()
    directory.mkdir(parents=True, exist_ok=True)
    _path(incident.id).write_text(incident.model_dump_json(indent=2) + "\n", encoding="utf-8")
    return incident


def next_incident_id() -> str:
    existing = []
    for incident in list_incidents():
        try:
            existing.append(int(incident.id.removeprefix("INC-")))
        except ValueError:
            continue
    return f"INC-{(max(existing) if existing else 0) + 1:03d}"


def create_incident(request: IncidentCreateRequest, signals: list[Signal]) -> Incident:
    timestamp = now_iso()
    detected_at = min((signal.timestamp for signal in signals), default=timestamp)
    incident = Incident(
        id=next_incident_id(),
        title=request.title.strip(),
        severity=request.severity,
        status="Open",
        component=request.component.strip(),
        summary=request.summary.strip() if request.summary else None,
        source="candidate" if request.candidate_id else "manual",
        created_at=timestamp,
        updated_at=timestamp,
        detected_at=detected_at,
        signals=signals[:20],
        runbook_id=request.runbook_id,
        timeline=[
            IncidentTimelineEntry(
                timestamp=timestamp,
                event_type="created",
                message="Incident created from reviewed operational signals.",
            )
        ],
    )
    return _write(incident)


def update_incident(incident_id: str, request: IncidentUpdateRequest) -> Incident:
    incident = get_incident(incident_id)
    before = incident.status
    update = request.model_dump(exclude_unset=True)
    for key, value in update.items():
        if value is not None:
            setattr(incident, key, value)
    incident.updated_at = now_iso()
    if request.status and request.status != before:
        incident.timeline.append(
            IncidentTimelineEntry(timestamp=incident.updated_at, event_type="status", message=f"Status changed from {before} to {request.status}.")
        )
    return _write(incident)


def add_timeline_entry(incident_id: str, request: TimelineCreateRequest) -> Incident:
    incident = get_incident(incident_id)
    incident.updated_at = now_iso()
    incident.timeline.append(
        IncidentTimelineEntry(timestamp=incident.updated_at, event_type=request.event_type.strip(), message=request.message.strip())
    )
    return _write(incident)


def resolve_incident(incident_id: str, request: ResolveIncidentRequest) -> Incident:
    incident = get_incident(incident_id)
    timestamp = now_iso()
    incident.status = "Resolved"
    incident.updated_at = timestamp
    incident.resolved_at = timestamp
    incident.resolution = IncidentResolution(**request.model_dump())
    incident.timeline.append(IncidentTimelineEntry(timestamp=timestamp, event_type="resolved", message=request.summary.strip()))
    return _write(incident)
