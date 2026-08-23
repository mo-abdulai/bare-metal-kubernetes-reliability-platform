import logging

from fastapi import APIRouter, HTTPException, Query

from app.kubernetes_client import KubernetesUnavailableError, get_recent_kubernetes_events
from app.loki_client import LokiClient, LokiUnavailableError
from app.schemas.logs import RecentEventsResponse, RecentLogsResponse

router = APIRouter(tags=["logs"])
logger = logging.getLogger(__name__)


@router.get("/api/logs/recent", response_model=RecentLogsResponse)
def recent_logs(limit: int = Query(default=20, ge=1, le=20)) -> RecentLogsResponse:
    try:
        return LokiClient().query_recent_operational_logs(limit=limit)
    except LokiUnavailableError as exc:
        logger.warning("Loki recent log query failed route=/api/logs/recent")
        raise HTTPException(status_code=503, detail="Logs service is currently unavailable.") from exc


@router.get("/api/events/recent", response_model=RecentEventsResponse)
def recent_events(limit: int = Query(default=10, ge=1, le=20)) -> RecentEventsResponse:
    try:
        return get_recent_kubernetes_events(limit=limit)
    except KubernetesUnavailableError as exc:
        logger.warning("Kubernetes event query failed route=/api/events/recent")
        raise HTTPException(status_code=503, detail="Kubernetes events are currently unavailable.") from exc
