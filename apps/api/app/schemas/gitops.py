from pydantic import BaseModel


class GitOpsApplicationStatus(BaseModel):
    name: str
    sync_status: str
    health_status: str
    revision: str | None = None
    target_revision: str | None = None
    destination_namespace: str | None = None
    last_operation_phase: str | None = None
    last_reconciled_at: str | None = None
    current_images: list[str] = []


class GitOpsStatusResponse(BaseModel):
    status: str
    applications: list[GitOpsApplicationStatus]
