from pydantic import BaseModel


class LiveNode(BaseModel):
    name: str
    role: str
    status: str
    architecture: str
    os_image: str
    kernel_version: str
    kubelet_version: str
    container_runtime: str
    internal_ip: str
    cpu_capacity: str
    cpu_allocatable: str
    memory_capacity: str
    memory_allocatable: str
    storage_capacity: str
    storage_allocatable: str


class LiveDeployment(BaseModel):
    name: str
    namespace: str
    desired: int
    ready: int
    available: int
    status: str
    image: str


class LivePod(BaseModel):
    name: str
    namespace: str
    node_name: str
    phase: str
    ready: bool
    restarts: int
    pod_ip: str


class LiveService(BaseModel):
    name: str
    namespace: str
    type: str
    ports: list[str]
    ready_endpoints: int


class LiveClusterSummary(BaseModel):
    nodes: int
    ready_nodes: int
    deployments: int
    ready_deployments: int
    pods: int
    ready_pods: int
    services: int


class LiveClusterInventory(BaseModel):
    status: str
    namespace: str
    summary: LiveClusterSummary
    nodes: list[LiveNode]
    deployments: list[LiveDeployment]
    pods: list[LivePod]
    services: list[LiveService]
