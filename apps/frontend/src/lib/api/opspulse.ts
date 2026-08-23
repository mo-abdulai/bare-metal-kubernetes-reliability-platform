import type { ActiveAlert, Incident, IncidentCandidate, IncidentSeverity, IncidentStatus, Signal } from "@/types/incidents";
import type { Runbook, RunbookDetail } from "@/types/runbooks";

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
    cpuCapacity: string;
    cpuAllocatable: string;
    memoryCapacity: string;
    memoryAllocatable: string;
    storageCapacity: string;
    storageAllocatable: string;
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

export interface MetricsSummary {
  status: "connected";
  nodes: Array<{
    name: string;
    cpuPercent: number;
    memoryPercent: number;
    filesystemPercent: number;
  }>;
  deployments: Array<{
    namespace: string;
    name: string;
    desired: number;
    available: number;
    unavailable: number;
  }>;
  podRestarts: Array<{
    namespace: string;
    pod: string;
    container: string;
    restarts: number;
  }>;
  podPhases: Array<{
    phase: string;
    count: number;
  }>;
  api: {
    up: boolean;
    requestRatePerSecond: number;
    errorRatePerSecond: number;
    p95DurationSeconds: number | null;
  };
}

export interface RecentOperationalLog {
  timestamp: string;
  service: string;
  level: string;
  namespace: string | null;
  pod: string | null;
  container: string | null;
  node: string | null;
  message: string;
}

export interface RecentKubernetesEvent {
  timestamp: string;
  type: string;
  reason: string;
  objectKind: string;
  objectName: string;
  namespace: string | null;
  node: string | null;
  message: string;
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

export type MetricsResult =
  | {
      status: "connected";
      data: MetricsSummary;
    }
  | {
      status: "unavailable";
      message: string;
    };

export type LogsResult =
  | {
      status: "connected";
      data: RecentOperationalLog[];
    }
  | {
      status: "unavailable";
      message: string;
    };

export type EventsResult =
  | {
      status: "connected";
      data: RecentKubernetesEvent[];
    }
  | {
      status: "unavailable";
      message: string;
    };

export type AlertsResult =
  | {
      status: "connected";
      data: ActiveAlert[];
    }
  | {
      status: "unavailable";
      message: string;
    };

export type IncidentsResult =
  | {
      status: "connected";
      data: Incident[];
    }
  | {
      status: "unavailable";
      message: string;
    };

export type CandidatesResult =
  | {
      status: "connected";
      data: IncidentCandidate[];
    }
  | {
      status: "unavailable";
      message: string;
    };

export type SignalsResult =
  | {
      status: "connected";
      data: Signal[];
    }
  | {
      status: "unavailable";
      message: string;
    };

export type RunbooksResult =
  | {
      status: "connected";
      data: Runbook[];
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

async function requestJson<T>(path: string, init: RequestInit = {}, timeoutMs = 5000): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const response = await fetchWithTimeout(`${baseUrl}${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers,
    },
  }, timeoutMs);

  if (!response.ok) {
    throw new OpsPulseApiError(`OpsPulse API ${path} returned HTTP ${response.status}.`);
  }

  return (await response.json()) as T;
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
  } catch (error) {
    console.error("OpsPulse API connectivity failure", error instanceof Error ? error.message : "unknown");
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
      cpuCapacity: node.cpu_capacity,
      cpuAllocatable: node.cpu_allocatable,
      memoryCapacity: node.memory_capacity,
      memoryAllocatable: node.memory_allocatable,
      storageCapacity: node.storage_capacity,
      storageAllocatable: node.storage_allocatable,
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

function normalizeMetricsSummary(body: any): MetricsSummary {
  return {
    status: "connected",
    nodes: body.nodes.map((node: any) => ({
      name: node.name,
      cpuPercent: node.cpu_percent,
      memoryPercent: node.memory_percent,
      filesystemPercent: node.filesystem_percent,
    })),
    deployments: body.deployments,
    podRestarts: body.pod_restarts.map((restart: any) => ({
      namespace: restart.namespace,
      pod: restart.pod,
      container: restart.container,
      restarts: restart.restarts,
    })),
    podPhases: body.pod_phases.map((phase: any) => ({
      phase: phase.phase,
      count: phase.count,
    })),
    api: {
      up: body.api.up,
      requestRatePerSecond: body.api.request_rate_per_second,
      errorRatePerSecond: body.api.error_rate_per_second,
      p95DurationSeconds: body.api.p95_duration_seconds,
    },
  };
}

export async function getMetricsSummary(): Promise<MetricsSummary> {
  const baseUrl = getApiBaseUrl();
  const response = await fetchWithTimeout(`${baseUrl}/api/metrics/summary`, {
    headers: {
      accept: "application/json",
    },
  }, 5000);

  if (!response.ok) {
    throw new OpsPulseApiError(`Metrics API returned HTTP ${response.status}.`);
  }

  return normalizeMetricsSummary(await response.json());
}

export async function getMetricsSummaryResult(): Promise<MetricsResult> {
  try {
    return {
      status: "connected",
      data: await getMetricsSummary(),
    };
  } catch (error) {
    console.error("Metrics proxy failure", error instanceof Error ? error.message : "unknown");
    return {
      status: "unavailable",
      message: "Metrics service is currently unavailable.",
    };
  }
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
  } catch (error) {
    console.error("Kubernetes inventory proxy failure", error instanceof Error ? error.message : "unknown");
    return {
      status: "unavailable",
      message: "Kubernetes inventory is currently unavailable.",
    };
  }
}

function normalizeRecentLogs(body: any): RecentOperationalLog[] {
  return body.entries.map((entry: any) => ({
    timestamp: entry.timestamp,
    service: entry.service,
    level: entry.level,
    namespace: entry.namespace,
    pod: entry.pod,
    container: entry.container,
    node: entry.node,
    message: entry.message,
  }));
}

function normalizeRecentEvents(body: any): RecentKubernetesEvent[] {
  return body.events.map((event: any) => ({
    timestamp: event.timestamp,
    type: event.type,
    reason: event.reason,
    objectKind: event.object_kind,
    objectName: event.object_name,
    namespace: event.namespace,
    node: event.node,
    message: event.message,
  }));
}

export async function getRecentLogs(): Promise<RecentOperationalLog[]> {
  const baseUrl = getApiBaseUrl();
  const response = await fetchWithTimeout(`${baseUrl}/api/logs/recent?limit=10`, {
    headers: {
      accept: "application/json",
    },
  }, 5000);

  if (!response.ok) {
    throw new OpsPulseApiError(`Logs API returned HTTP ${response.status}.`);
  }

  return normalizeRecentLogs(await response.json());
}

export async function getRecentLogsResult(): Promise<LogsResult> {
  try {
    return {
      status: "connected",
      data: await getRecentLogs(),
    };
  } catch (error) {
    console.error("Loki logs proxy failure", error instanceof Error ? error.message : "unknown");
    return {
      status: "unavailable",
      message: "Logs service is currently unavailable.",
    };
  }
}

export async function getRecentEvents(): Promise<RecentKubernetesEvent[]> {
  const baseUrl = getApiBaseUrl();
  const response = await fetchWithTimeout(`${baseUrl}/api/events/recent?limit=10`, {
    headers: {
      accept: "application/json",
    },
  }, 5000);

  if (!response.ok) {
    throw new OpsPulseApiError(`Events API returned HTTP ${response.status}.`);
  }

  return normalizeRecentEvents(await response.json());
}

export async function getRecentEventsResult(): Promise<EventsResult> {
  try {
    return {
      status: "connected",
      data: await getRecentEvents(),
    };
  } catch (error) {
    console.error("Kubernetes events proxy failure", error instanceof Error ? error.message : "unknown");
    return {
      status: "unavailable",
      message: "Kubernetes events are currently unavailable.",
    };
  }
}

function normalizeSignal(body: any): Signal {
  return {
    id: body.id,
    timestamp: body.timestamp,
    source: body.source,
    severityHint: body.severity_hint,
    component: body.component,
    title: body.title,
    message: body.message,
    metadata: body.metadata || {},
  };
}

function normalizeIncident(body: any): Incident {
  return {
    id: body.id,
    title: body.title,
    severity: body.severity,
    status: body.status,
    component: body.component,
    summary: body.summary,
    source: body.source,
    createdAt: body.created_at,
    updatedAt: body.updated_at,
    detectedAt: body.detected_at,
    resolvedAt: body.resolved_at,
    signals: (body.signals || []).map(normalizeSignal),
    runbookId: body.runbook_id,
    timeline: (body.timeline || []).map((entry: any) => ({
      timestamp: entry.timestamp,
      eventType: entry.event_type,
      message: entry.message,
    })),
    resolution: body.resolution
      ? {
          summary: body.resolution.summary,
          rootCause: body.resolution.root_cause,
          remediation: body.resolution.remediation,
          prevention: body.resolution.prevention,
        }
      : null,
  };
}

function normalizeCandidate(body: any): IncidentCandidate {
  return {
    candidateId: body.candidate_id,
    title: body.title,
    component: body.component,
    firstSeen: body.first_seen,
    lastSeen: body.last_seen,
    signalCount: body.signal_count,
    severitySuggestion: body.severity_suggestion,
    runbookId: body.runbook_id,
    signals: (body.signals || []).map(normalizeSignal),
  };
}

function normalizeAlert(body: any): ActiveAlert {
  return {
    id: body.id,
    name: body.name,
    state: body.state,
    severity: body.severity,
    instance: body.instance,
    namespace: body.namespace,
    pod: body.pod,
    node: body.node,
    summary: body.summary,
    startedAt: body.started_at,
    labels: body.labels || {},
  };
}

function normalizeRunbook(body: any): Runbook {
  return {
    id: body.id,
    title: body.title,
    category: body.category,
    linkedSignals: body.linked_signals || [],
    lastUpdated: body.last_updated,
    purpose: body.purpose,
  };
}

function normalizeRunbookDetail(body: any): RunbookDetail {
  return {
    ...normalizeRunbook(body),
    content: body.content,
  };
}

export async function getActiveAlertsResult(): Promise<AlertsResult> {
  try {
    const body = await requestJson<any[]>("/api/alerts/active", {}, 5000);
    return { status: "connected", data: body.map(normalizeAlert) };
  } catch (error) {
    console.error("Alertmanager proxy failure", error instanceof Error ? error.message : "unknown");
    return { status: "unavailable", message: "Alerts are currently unavailable." };
  }
}

export async function getSignalsResult(): Promise<SignalsResult> {
  try {
    const body = await requestJson<any[]>("/api/signals/recent?limit=30", {}, 7000);
    return { status: "connected", data: body.map(normalizeSignal) };
  } catch (error) {
    console.error("Signal aggregation failure", error instanceof Error ? error.message : "unknown");
    return { status: "unavailable", message: "Signals are currently unavailable." };
  }
}

export async function getIncidentCandidatesResult(): Promise<CandidatesResult> {
  try {
    const body = await requestJson<any[]>("/api/incidents/candidates", {}, 8000);
    return { status: "connected", data: body.map(normalizeCandidate) };
  } catch (error) {
    console.error("Incident candidate failure", error instanceof Error ? error.message : "unknown");
    return { status: "unavailable", message: "Incident candidates are currently unavailable." };
  }
}

export async function getIncidentsResult(): Promise<IncidentsResult> {
  try {
    const body = await requestJson<any[]>("/api/incidents", {}, 5000);
    return { status: "connected", data: body.map(normalizeIncident) };
  } catch (error) {
    console.error("Incident list failure", error instanceof Error ? error.message : "unknown");
    return { status: "unavailable", message: "Incidents are currently unavailable." };
  }
}

export async function getIncident(id: string): Promise<Incident> {
  return normalizeIncident(await requestJson<any>(`/api/incidents/${id}`, {}, 5000));
}

export async function createIncident(input: {
  title: string;
  severity: IncidentSeverity;
  component: string;
  summary?: string;
  runbookId?: string;
  signalIds?: string[];
  candidateId?: string;
}): Promise<Incident> {
  return normalizeIncident(
    await requestJson<any>("/api/incidents", {
      method: "POST",
      body: JSON.stringify({
        title: input.title,
        severity: input.severity,
        component: input.component,
        summary: input.summary || null,
        runbook_id: input.runbookId || null,
        signal_ids: input.signalIds || [],
        candidate_id: input.candidateId || null,
      }),
    }),
  );
}

export async function updateIncident(id: string, input: { status?: IncidentStatus; severity?: IncidentSeverity; runbookId?: string; summary?: string }) {
  return normalizeIncident(
    await requestJson<any>(`/api/incidents/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: input.status,
        severity: input.severity,
        runbook_id: input.runbookId,
        summary: input.summary,
      }),
    }),
  );
}

export async function addIncidentTimeline(id: string, input: { eventType: string; message: string }) {
  return normalizeIncident(
    await requestJson<any>(`/api/incidents/${id}/timeline`, {
      method: "POST",
      body: JSON.stringify({ event_type: input.eventType, message: input.message }),
    }),
  );
}

export async function resolveIncident(id: string, input: { summary: string; rootCause?: string; remediation?: string; prevention?: string }) {
  return normalizeIncident(
    await requestJson<any>(`/api/incidents/${id}/resolve`, {
      method: "POST",
      body: JSON.stringify({
        summary: input.summary,
        root_cause: input.rootCause || null,
        remediation: input.remediation || null,
        prevention: input.prevention || null,
      }),
    }),
  );
}

export async function getRunbooksResult(): Promise<RunbooksResult> {
  try {
    const body = await requestJson<any[]>("/api/runbooks", {}, 5000);
    return { status: "connected", data: body.map(normalizeRunbook) };
  } catch (error) {
    console.error("Runbook directory failure", error instanceof Error ? error.message : "unknown");
    return { status: "unavailable", message: "Runbooks are currently unavailable." };
  }
}

export async function getRunbook(id: string): Promise<RunbookDetail> {
  return normalizeRunbookDetail(await requestJson<any>(`/api/runbooks/${id}`, {}, 5000));
}
