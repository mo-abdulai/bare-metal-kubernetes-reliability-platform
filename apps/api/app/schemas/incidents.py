from typing import Literal

from pydantic import BaseModel, Field

IncidentSeverity = Literal["SEV-1", "SEV-2", "SEV-3", "SEV-4"]
IncidentStatus = Literal["Open", "Investigating", "Mitigated", "Monitoring", "Resolved"]
SignalSource = Literal["prometheus", "kubernetes", "loki", "workload", "gitops"]


class Signal(BaseModel):
    id: str
    timestamp: str
    source: SignalSource
    severity_hint: IncidentSeverity
    component: str
    title: str
    message: str
    metadata: dict[str, str] = Field(default_factory=dict)


class ActiveAlert(BaseModel):
    id: str
    name: str
    state: str
    severity: str | None = None
    instance: str | None = None
    namespace: str | None = None
    pod: str | None = None
    node: str | None = None
    summary: str | None = None
    started_at: str | None = None
    labels: dict[str, str] = Field(default_factory=dict)


class IncidentCandidate(BaseModel):
    candidate_id: str
    title: str
    component: str
    first_seen: str
    last_seen: str
    signal_count: int
    severity_suggestion: IncidentSeverity
    runbook_id: str | None = None
    signals: list[Signal]


class IncidentTimelineEntry(BaseModel):
    timestamp: str
    event_type: str
    message: str


class IncidentResolution(BaseModel):
    summary: str
    root_cause: str | None = None
    remediation: str | None = None
    prevention: str | None = None


class Incident(BaseModel):
    id: str
    title: str
    severity: IncidentSeverity
    status: IncidentStatus
    component: str
    summary: str | None = None
    source: str = "manual"
    created_at: str
    updated_at: str
    detected_at: str
    resolved_at: str | None = None
    signals: list[Signal] = Field(default_factory=list)
    runbook_id: str | None = None
    timeline: list[IncidentTimelineEntry] = Field(default_factory=list)
    resolution: IncidentResolution | None = None


class IncidentCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    severity: IncidentSeverity
    component: str = Field(min_length=1, max_length=120)
    summary: str | None = Field(default=None, max_length=1000)
    runbook_id: str | None = Field(default=None, max_length=120)
    signal_ids: list[str] = Field(default_factory=list)
    candidate_id: str | None = Field(default=None, max_length=160)


class IncidentUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=160)
    severity: IncidentSeverity | None = None
    status: IncidentStatus | None = None
    component: str | None = Field(default=None, min_length=1, max_length=120)
    summary: str | None = Field(default=None, max_length=1000)
    runbook_id: str | None = Field(default=None, max_length=120)


class TimelineCreateRequest(BaseModel):
    event_type: str = Field(min_length=1, max_length=80)
    message: str = Field(min_length=1, max_length=500)


class ResolveIncidentRequest(BaseModel):
    summary: str = Field(min_length=1, max_length=1000)
    root_cause: str | None = Field(default=None, max_length=1000)
    remediation: str | None = Field(default=None, max_length=1000)
    prevention: str | None = Field(default=None, max_length=1000)


class RunbookSummary(BaseModel):
    id: str
    title: str
    category: str
    linked_signals: list[str]
    last_updated: str
    purpose: str
    reproducible: bool = False
    reproduction_command: str | None = None
    cleanup_command: str | None = None
    expected_signals: list[str] = Field(default_factory=list)


class RunbookDetail(RunbookSummary):
    content: str
