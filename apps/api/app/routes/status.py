from fastapi import APIRouter

from app.config import get_settings
from app.schemas.status import PlatformMetadata, PlatformStatusResponse, ServiceMetadata

router = APIRouter(prefix="/api", tags=["status"])


@router.get("/status", response_model=PlatformStatusResponse)
def platform_status() -> PlatformStatusResponse:
    settings = get_settings()
    return PlatformStatusResponse(
        platform=PlatformMetadata(
            name=settings.platform_name,
            environment=settings.environment,
            orchestrator=settings.orchestrator,
            architecture=settings.architecture,
        ),
        service=ServiceMetadata(
            name=settings.service_name,
            version=settings.app_version,
            status="operational",
        ),
    )
