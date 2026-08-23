from fastapi import APIRouter, HTTPException, Query

from app.alertmanager_client import AlertmanagerUnavailableError
from app.incident_signals import active_alerts, aggregate_signals, incident_candidates, signals_by_ids
from app.incident_store import (
    IncidentNotFoundError,
    add_timeline_entry,
    create_incident,
    get_incident,
    list_incidents,
    resolve_incident,
    update_incident,
)
from app.runbook_repository import RunbookNotFoundError, get_runbook, list_runbooks
from app.schemas.incidents import (
    ActiveAlert,
    Incident,
    IncidentCandidate,
    IncidentCreateRequest,
    IncidentUpdateRequest,
    ResolveIncidentRequest,
    RunbookDetail,
    RunbookSummary,
    Signal,
    TimelineCreateRequest,
)

router = APIRouter(tags=["incidents"])


@router.get("/api/alerts/active", response_model=list[ActiveAlert])
def alerts_active() -> list[ActiveAlert]:
    try:
        return active_alerts()
    except AlertmanagerUnavailableError as exc:
        raise HTTPException(status_code=503, detail="Alertmanager is currently unavailable.") from exc


@router.get("/api/signals/recent", response_model=list[Signal])
def recent_signals(limit: int = Query(default=30, ge=1, le=50)) -> list[Signal]:
    return aggregate_signals(limit=limit)


@router.get("/api/incidents/candidates", response_model=list[IncidentCandidate])
def candidates() -> list[IncidentCandidate]:
    return incident_candidates()


@router.get("/api/incidents", response_model=list[Incident])
def incidents() -> list[Incident]:
    return list_incidents()


@router.get("/api/incidents/{incident_id}", response_model=Incident)
def incident_detail(incident_id: str) -> Incident:
    try:
        return get_incident(incident_id)
    except IncidentNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Incident not found.") from exc


@router.post("/api/incidents", response_model=Incident, status_code=201)
def incident_create(request: IncidentCreateRequest) -> Incident:
    return create_incident(request, signals_by_ids(request.signal_ids, request.candidate_id))


@router.patch("/api/incidents/{incident_id}", response_model=Incident)
def incident_update(incident_id: str, request: IncidentUpdateRequest) -> Incident:
    try:
        return update_incident(incident_id, request)
    except IncidentNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Incident not found.") from exc


@router.post("/api/incidents/{incident_id}/timeline", response_model=Incident)
def incident_timeline(incident_id: str, request: TimelineCreateRequest) -> Incident:
    try:
        return add_timeline_entry(incident_id, request)
    except IncidentNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Incident not found.") from exc


@router.post("/api/incidents/{incident_id}/resolve", response_model=Incident)
def incident_resolve(incident_id: str, request: ResolveIncidentRequest) -> Incident:
    try:
        return resolve_incident(incident_id, request)
    except IncidentNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Incident not found.") from exc


@router.get("/api/runbooks", response_model=list[RunbookSummary])
def runbooks() -> list[RunbookSummary]:
    return list_runbooks()


@router.get("/api/runbooks/{runbook_id}", response_model=RunbookDetail)
def runbook_detail(runbook_id: str) -> RunbookDetail:
    try:
        return get_runbook(runbook_id)
    except RunbookNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Runbook not found.") from exc
