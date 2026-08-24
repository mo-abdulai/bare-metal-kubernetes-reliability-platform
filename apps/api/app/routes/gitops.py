from fastapi import APIRouter, HTTPException

from app.gitops_status import GitOpsUnavailableError, get_gitops_status
from app.schemas.gitops import GitOpsStatusResponse

router = APIRouter(prefix="/api/gitops", tags=["gitops"])


@router.get("/status", response_model=GitOpsStatusResponse)
def gitops_status() -> GitOpsStatusResponse:
    try:
        return get_gitops_status()
    except GitOpsUnavailableError as exc:
        raise HTTPException(status_code=503, detail="GitOps status is unavailable.") from exc
