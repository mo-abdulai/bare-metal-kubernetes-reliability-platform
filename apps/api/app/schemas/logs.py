from pydantic import BaseModel


class RecentLogEntry(BaseModel):
    timestamp: str
    service: str
    level: str
    namespace: str | None = None
    pod: str | None = None
    container: str | None = None
    node: str | None = None
    message: str


class RecentLogsResponse(BaseModel):
    status: str
    entries: list[RecentLogEntry]


class RecentEvent(BaseModel):
    timestamp: str
    type: str
    reason: str
    object_kind: str
    object_name: str
    namespace: str | None = None
    node: str | None = None
    message: str


class RecentEventsResponse(BaseModel):
    status: str
    events: list[RecentEvent]
