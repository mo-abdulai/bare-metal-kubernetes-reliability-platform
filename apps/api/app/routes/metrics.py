from fastapi import APIRouter, HTTPException

from app.prometheus_client import MetricsUnavailableError, get_metrics_summary
from app.schemas.metrics import MetricsSummary

router = APIRouter(prefix="/api/metrics", tags=["metrics"])


@router.get("/summary", response_model=MetricsSummary)
def metrics_summary() -> MetricsSummary:
    try:
        return get_metrics_summary()
    except MetricsUnavailableError as exc:
        raise HTTPException(status_code=503, detail="Metrics service is currently unavailable.") from exc
