from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    service: str


class ReadyResponse(BaseModel):
    status: str
    service: str


class RootResponse(BaseModel):
    service: str
    docs: str
    health: str


class PlatformMetadata(BaseModel):
    name: str
    environment: str
    orchestrator: str
    architecture: str


class ServiceMetadata(BaseModel):
    name: str
    version: str
    status: str


class PlatformStatusResponse(BaseModel):
    platform: PlatformMetadata
    service: ServiceMetadata


class ErrorResponse(BaseModel):
    detail: str
