from pydantic import BaseModel


class MetricsNode(BaseModel):
    name: str
    cpu_percent: float
    memory_percent: float
    filesystem_percent: float


class MetricsDeployment(BaseModel):
    namespace: str
    name: str
    desired: float
    available: float
    unavailable: float


class MetricsPodRestart(BaseModel):
    namespace: str
    pod: str
    container: str
    restarts: float


class MetricsPodPhase(BaseModel):
    phase: str
    count: float


class MetricsApi(BaseModel):
    up: bool
    request_rate_per_second: float
    error_rate_per_second: float
    p95_duration_seconds: float | None


class MetricsSummary(BaseModel):
    status: str
    nodes: list[MetricsNode]
    deployments: list[MetricsDeployment]
    pod_restarts: list[MetricsPodRestart]
    pod_phases: list[MetricsPodPhase]
    api: MetricsApi
