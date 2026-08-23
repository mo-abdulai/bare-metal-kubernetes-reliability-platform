export interface OpsPulsePlatformStatus {
  platform: {
    name: string;
    environment: string;
    orchestrator: string;
    architecture: string;
  };
  service: {
    name: string;
    version: string;
    status: string;
  };
}

export interface LiveClusterInventory {
  status: "connected";
  namespace: string;
  summary: {
    nodes: number;
    readyNodes: number;
    deployments: number;
    readyDeployments: number;
    pods: number;
    readyPods: number;
    services: number;
  };
  nodes: Array<{
    name: string;
    role: string;
    status: string;
    architecture: string;
    osImage: string;
    kernelVersion: string;
    kubeletVersion: string;
    containerRuntime: string;
    internalIp: string;
  }>;
  deployments: Array<{
    name: string;
    namespace: string;
    desired: number;
    ready: number;
    available: number;
    status: "available" | "pending" | "unknown";
    image: string;
  }>;
  pods: Array<{
    name: string;
    namespace: string;
    nodeName: string;
    phase: string;
    ready: boolean;
    restarts: number;
    podIp: string;
  }>;
  services: Array<{
    name: string;
    namespace: string;
    type: string;
    ports: string[];
    readyEndpoints: number;
  }>;
}

export type OpsPulseApiResult =
  | {
      status: "connected";
      data: OpsPulsePlatformStatus;
    }
  | {
      status: "unavailable";
      message: string;
    };

export type LiveClusterResult =
  | {
      status: "connected";
      data: LiveClusterInventory;
    }
  | {
      status: "unavailable";
      message: string;
    };

export class OpsPulseApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpsPulseApiError";
  }
}

function getApiBaseUrl(): string {
  return process.env.OPSPULSE_API_URL || "http://localhost:8000";
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 3000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function getPlatformStatus(): Promise<OpsPulsePlatformStatus> {
  const baseUrl = getApiBaseUrl();
  const response = await fetchWithTimeout(`${baseUrl}/api/status`, {
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new OpsPulseApiError(`OpsPulse API returned HTTP ${response.status}.`);
  }

  return (await response.json()) as OpsPulsePlatformStatus;
}

export async function getPlatformStatusResult(): Promise<OpsPulseApiResult> {
  try {
    return {
      status: "connected",
      data: await getPlatformStatus(),
    };
  } catch {
    return {
      status: "unavailable",
      message: "OpsPulse API is currently unavailable.",
    };
  }
}

function normalizeClusterInventory(body: any): LiveClusterInventory {
  return {
    status: "connected",
    namespace: body.namespace,
    summary: {
      nodes: body.summary.nodes,
      readyNodes: body.summary.ready_nodes,
      deployments: body.summary.deployments,
      readyDeployments: body.summary.ready_deployments,
      pods: body.summary.pods,
      readyPods: body.summary.ready_pods,
      services: body.summary.services,
    },
    nodes: body.nodes.map((node: any) => ({
      name: node.name,
      role: node.role,
      status: node.status,
      architecture: node.architecture,
      osImage: node.os_image,
      kernelVersion: node.kernel_version,
      kubeletVersion: node.kubelet_version,
      containerRuntime: node.container_runtime,
      internalIp: node.internal_ip,
    })),
    deployments: body.deployments,
    pods: body.pods.map((pod: any) => ({
      name: pod.name,
      namespace: pod.namespace,
      nodeName: pod.node_name,
      phase: pod.phase,
      ready: pod.ready,
      restarts: pod.restarts,
      podIp: pod.pod_ip,
    })),
    services: body.services.map((service: any) => ({
      name: service.name,
      namespace: service.namespace,
      type: service.type,
      ports: service.ports,
      readyEndpoints: service.ready_endpoints,
    })),
  };
}

export async function getClusterInventory(): Promise<LiveClusterInventory> {
  const baseUrl = getApiBaseUrl();
  const response = await fetchWithTimeout(`${baseUrl}/api/cluster/inventory`, {
    headers: {
      accept: "application/json",
    },
  }, 10000);

  if (!response.ok) {
    throw new OpsPulseApiError(`OpsPulse API returned HTTP ${response.status}.`);
  }

  return normalizeClusterInventory(await response.json());
}

export async function getClusterInventoryResult(): Promise<LiveClusterResult> {
  try {
    return {
      status: "connected",
      data: await getClusterInventory(),
    };
  } catch {
    return {
      status: "unavailable",
      message: "Kubernetes inventory is currently unavailable.",
    };
  }
}
