import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ClusterTopology } from "@/components/dashboard/cluster-topology";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RelativeTime } from "@/components/ui/relative-time";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getClusterInventoryResult,
  getMetricsSummaryResult,
  getPlatformStatusResult,
  getRecentEventsResult,
  getRecentLogsResult,
} from "@/lib/api/opspulse";
import { clusterNodes, platformActivity, platformCapabilities, platformSummary } from "@/lib/data/infrastructure";
import type { ClusterNode, NodeRole, NodeStatus, PlatformActivity } from "@/types/infrastructure";

export const dynamic = "force-dynamic";

function normalizeNodeRole(role: string): NodeRole {
  return role === "control-plane" ? "control-plane" : "worker";
}

function normalizeNodeStatus(status: string): NodeStatus {
  return status === "Ready" ? "ready" : status === "NotReady" ? "not-ready" : "unknown";
}

function liveNodesToTopologyNodes(nodes: Array<{
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
}>): ClusterNode[] {
  return nodes.map((node) => ({
    id: node.name,
    hostname: node.name,
    role: normalizeNodeRole(node.role),
    architecture: node.architecture,
    operatingSystem: node.osImage,
    cpu: `${node.cpuCapacity} / ${node.cpuAllocatable} allocatable`,
    memory: `${node.memoryCapacity} / ${node.memoryAllocatable} allocatable`,
    storage: `${node.storageCapacity} / ${node.storageAllocatable} allocatable`,
    k3sVersion: node.kubeletVersion,
    networkAddress: node.internalIp,
    status: normalizeNodeStatus(node.status),
    notes: `${node.kernelVersion} · ${node.containerRuntime}`,
  }));
}

export default async function OverviewPage() {
  const [apiStatus, clusterInventory, metricsSummary, recentLogs, recentEvents] = await Promise.all([
    getPlatformStatusResult(),
    getClusterInventoryResult(),
    getMetricsSummaryResult(),
    getRecentLogsResult(),
    getRecentEventsResult(),
  ]);
  const platform =
    apiStatus.status === "connected"
      ? {
          ...apiStatus.data.platform,
          environment: "bare-metal",
        }
      : {
          name: "Bare-Metal Kubernetes Reliability & Operations Platform",
          environment: "bare-metal",
          orchestrator: "K3s",
          architecture: "ARM64",
        };
  const apiVersion = apiStatus.status === "connected" ? apiStatus.data.service.version : "Unavailable";
  const liveSummary =
    clusterInventory.status === "connected"
      ? [
          {
            label: "Nodes",
            value: `${clusterInventory.data.summary.readyNodes}/${clusterInventory.data.summary.nodes}`,
            state: "Ready" as const,
            description: "Ready Kubernetes nodes reported by the live cluster API.",
          },
          {
            label: "Deployments",
            value: `${clusterInventory.data.summary.readyDeployments}/${clusterInventory.data.summary.deployments}`,
            state: "Ready" as const,
            description: "Available Deployments in the OpsPulse namespace.",
          },
          {
            label: "Pods",
            value: `${clusterInventory.data.summary.readyPods}/${clusterInventory.data.summary.pods}`,
            state: "Ready" as const,
            description: "Ready Pods in the OpsPulse namespace.",
          },
          {
            label: "Services",
            value: `${clusterInventory.data.summary.services}`,
            state: "Ready" as const,
            description: "Kubernetes Services in the OpsPulse namespace.",
          },
        ]
      : platformSummary;
  const topologyNodes = clusterInventory.status === "connected" ? liveNodesToTopologyNodes(clusterInventory.data.nodes) : clusterNodes;
  const liveDeployments = clusterInventory.status === "connected" ? clusterInventory.data.deployments : [];
  const livePods = clusterInventory.status === "connected" ? clusterInventory.data.pods : [];
  const liveServices = clusterInventory.status === "connected" ? clusterInventory.data.services : [];
  const metricsUpdatedAt = metricsSummary.status === "connected" ? new Date().toISOString() : null;
  const metricNodes = metricsSummary.status === "connected" ? metricsSummary.data.nodes : [];
  const apiMetrics = metricsSummary.status === "connected" ? metricsSummary.data.api : null;
  const liveEvents: PlatformActivity[] =
    clusterInventory.status === "connected"
      ? [
          ...liveDeployments.map((deployment) => ({
            id: `deployment-${deployment.name}`,
            title: `${deployment.name} deployment available`,
            detail: `${deployment.ready}/${deployment.desired} replicas ready using ${deployment.image}.`,
            status: "completed" as const,
          })),
          ...livePods.slice(0, 4).map((pod) => ({
            id: `pod-${pod.name}`,
            title: `${pod.name} running on ${pod.nodeName}`,
            detail: `${pod.phase} pod at ${pod.podIp} with ${pod.restarts} restarts.`,
            status: "completed" as const,
          })),
        ]
      : [];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">OpsPulse Infrastructure Console</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">
              {platform.name}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Live operations view for the two-node ARM64 K3s platform. Node inventory, workloads, pod placement, Services, and readiness are read
              from the Kubernetes API through the internal OpsPulse backend.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status="Documented" label={`bare-metal · ${platform.architecture} · ${platform.orchestrator}`} />
            <StatusBadge status={apiStatus.status === "connected" ? "connected" : "unavailable"} label={apiStatus.status === "connected" ? "Backend Connected" : "Backend Unavailable"} />
            <StatusBadge status={clusterInventory.status === "connected" ? "connected" : "unavailable"} label={clusterInventory.status === "connected" ? "Live Kubernetes API" : "Inventory Unavailable"} />
            <StatusBadge status={metricsSummary.status === "connected" ? "connected" : "unavailable"} label={metricsSummary.status === "connected" ? "Prometheus Connected" : "Metrics Unavailable"} />
            <StatusBadge status={recentLogs.status === "connected" ? "connected" : "unavailable"} label={recentLogs.status === "connected" ? "Logs Live" : "Logs Unavailable"} />
          </div>
        </div>
      </section>

      {apiStatus.status === "unavailable" ? (
        <section className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-800 dark:text-red-100">
          OpsPulse API is currently unavailable. Static infrastructure information remains available while backend communication recovers.
        </section>
      ) : null}

      {clusterInventory.status === "unavailable" ? (
        <section className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-100">
          Kubernetes inventory is currently unavailable. Documented repository data remains visible as a fallback.
        </section>
      ) : null}

      <section aria-label="Platform summary" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {liveSummary.map((item) => (
          <MetricCard key={item.label} item={item} />
        ))}
      </section>

      <section aria-label="API platform metadata" className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ["Environment", platform.environment],
          ["Orchestrator", platform.orchestrator],
          ["Architecture", platform.architecture],
          ["API Version", apiVersion],
          ["Backend", apiStatus.status === "connected" ? "Connected" : "Unavailable"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-surface-900">
            <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-50">{value}</p>
          </div>
        ))}
      </section>

      <ClusterTopology
        nodes={topologyNodes}
        sourceLabel={clusterInventory.status === "connected" ? `K3s Cluster · live ${clusterInventory.data.namespace} inventory` : "K3s Cluster · repository fallback"}
        sourceStatus={clusterInventory.status === "connected" ? "connected" : "Documented"}
      />

      <section aria-label="Prometheus node utilization" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface-900">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Live Resource Utilization</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Usage percentages come from Prometheus node-exporter metrics. Capacity remains listed in node details.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <StatusBadge status={metricsSummary.status === "connected" ? "connected" : "unavailable"} label={metricsSummary.status === "connected" ? "Metrics Live" : "Metrics Unavailable"} />
            {metricsUpdatedAt ? <RelativeTime value={metricsUpdatedAt} /> : null}
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {metricNodes.length > 0 ? (
            metricNodes.map((node) => (
              <article key={node.name} className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-surface-850">
                <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-50">{node.name}</h3>
                <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <dt className="text-xs uppercase text-slate-500 dark:text-slate-400">CPU used</dt>
                    <dd className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-50">{node.cpuPercent}%</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-slate-500 dark:text-slate-400">Memory used</dt>
                    <dd className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-50">{node.memoryPercent}%</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-slate-500 dark:text-slate-400">Filesystem used</dt>
                    <dd className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-50">{node.filesystemPercent}%</dd>
                  </div>
                </dl>
              </article>
            ))
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-400">Prometheus utilization metrics are unavailable.</p>
          )}
        </div>
      </section>

      <section aria-label="Live operational snapshot" className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface-900">
          <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Deployments</h2>
          <div className="mt-4 space-y-3">
            {liveDeployments.length > 0 ? (
              liveDeployments.map((deployment) => (
                <div key={deployment.name} className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-surface-850">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{deployment.name}</p>
                      <p className="mt-1 break-all text-xs text-slate-600 dark:text-slate-400">{deployment.image}</p>
                    </div>
                    <StatusBadge status={deployment.status === "available" ? "connected" : "unknown"} label={`${deployment.ready}/${deployment.desired}`} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">Live deployment data is unavailable.</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface-900">
          <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Pod Placement</h2>
          <div className="mt-4 space-y-3">
            {livePods.length > 0 ? (
              livePods.map((pod) => (
                <div key={pod.name} className="flex items-start justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-surface-850">
                  <div>
                    <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{pod.name}</p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{pod.nodeName} · {pod.podIp}</p>
                  </div>
                  <StatusBadge status={pod.ready ? "connected" : "unknown"} label={pod.phase} />
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">Live pod data is unavailable.</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface-900">
          <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Services</h2>
          <div className="mt-4 space-y-3">
            {liveServices.length > 0 ? (
              liveServices.map((service) => (
                <div key={service.name} className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-surface-850">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{service.name}</p>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{service.type} · {service.ports.join(", ")}</p>
                    </div>
                    <StatusBadge status={service.readyEndpoints > 0 ? "connected" : "unknown"} label={`${service.readyEndpoints} endpoints`} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">Live service data is unavailable.</p>
            )}
          </div>
        </div>
      </section>

      <section aria-label="OpsPulse API metrics" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">OpsPulse API Metrics</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Request telemetry from the FastAPI `/metrics` endpoint scraped by Prometheus.</p>
          </div>
          <StatusBadge status={apiMetrics?.up ? "connected" : "unavailable"} label={apiMetrics?.up ? "Scrape Up" : "Scrape Unavailable"} />
        </div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-surface-850">
            <dt className="text-xs uppercase text-slate-500 dark:text-slate-400">Request rate</dt>
            <dd className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-50">{apiMetrics ? `${apiMetrics.requestRatePerSecond}/s` : "Unavailable"}</dd>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-surface-850">
            <dt className="text-xs uppercase text-slate-500 dark:text-slate-400">5xx rate</dt>
            <dd className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-50">{apiMetrics ? `${apiMetrics.errorRatePerSecond}/s` : "Unavailable"}</dd>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-surface-850">
            <dt className="text-xs uppercase text-slate-500 dark:text-slate-400">p95 duration</dt>
            <dd className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-50">{apiMetrics?.p95DurationSeconds != null ? `${apiMetrics.p95DurationSeconds}s` : "Unavailable"}</dd>
          </div>
        </dl>
      </section>

      <section aria-label="Recent operational events" className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface-900">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Recent Operational Events</h2>
            <StatusBadge status={recentEvents.status === "connected" ? "connected" : "unavailable"} label={recentEvents.status === "connected" ? "Events Live" : "Events Unavailable"} />
          </div>
          <div className="mt-4 space-y-3">
            {recentEvents.status === "connected" && recentEvents.data.length > 0 ? (
              recentEvents.data.slice(0, 5).map((event) => (
                <div key={`${event.timestamp}-${event.reason}-${event.objectName}`} className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-surface-850">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    <StatusBadge status={event.type === "Warning" ? "unavailable" : "Documented"} label={event.type} />
                    <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{event.reason}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{event.objectKind} {event.objectName}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{event.message}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {recentEvents.status === "connected" ? "No recent Kubernetes events returned." : "Kubernetes events are currently unavailable."}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface-900">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Recent Log Signals</h2>
            <StatusBadge status={recentLogs.status === "connected" ? "connected" : "unavailable"} label={recentLogs.status === "connected" ? "Loki Connected" : "Logs Unavailable"} />
          </div>
          <div className="mt-4 space-y-3">
            {recentLogs.status === "connected" && recentLogs.data.length > 0 ? (
              recentLogs.data.slice(0, 5).map((entry) => (
                <div key={`${entry.timestamp}-${entry.pod}-${entry.message}`} className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-surface-850">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    <StatusBadge status={entry.level === "error" ? "unavailable" : "Documented"} label={entry.level.toUpperCase()} />
                    <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{entry.service}</p>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{entry.message}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{entry.pod || "unknown pod"} · {entry.node || "unknown node"}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {recentLogs.status === "connected" ? "No recent error-level log signals returned." : "Loki is currently unavailable."}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface-900">
          <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Current Platform Capabilities</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {clusterInventory.status === "connected" ? "Capabilities currently verified by live Kubernetes inventory." : "Capabilities verified from repository architecture documentation."}
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {platformCapabilities.map((capability) => (
              <li key={capability} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 dark:border-slate-800 dark:bg-surface-850 dark:text-slate-200">
                {capability}
              </li>
            ))}
          </ul>
        </section>

        <div className="grid gap-6">
          <ActivityFeed
            activity={liveEvents}
            title="Live Events"
            description={clusterInventory.status === "connected" ? "Current deployment and pod readiness from the Kubernetes API." : "Live Kubernetes events are unavailable while inventory is disconnected."}
          />
          <ActivityFeed
            activity={platformActivity}
            title="Project Milestones"
            description="Repository-backed implementation milestones and validation history."
          />
        </div>
      </div>
    </div>
  );
}
