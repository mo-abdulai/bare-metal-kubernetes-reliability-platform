from fastapi import APIRouter, HTTPException

from app.kubernetes_client import KubernetesUnavailableError, get_live_cluster_inventory
from app.schemas.cluster import LiveClusterInventory

router = APIRouter(prefix="/api/cluster", tags=["cluster"])


@router.get("/inventory", response_model=LiveClusterInventory)
def cluster_inventory() -> LiveClusterInventory:
    try:
        return get_live_cluster_inventory()
    except KubernetesUnavailableError as exc:
        raise HTTPException(status_code=503, detail="Kubernetes inventory is unavailable.") from exc
