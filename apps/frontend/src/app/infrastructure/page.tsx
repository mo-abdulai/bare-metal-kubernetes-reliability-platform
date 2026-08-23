import { LanTopology } from "@/components/infrastructure/lan-topology";
import { NodeCard } from "@/components/infrastructure/node-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getClusterInventoryResult, getMetricsSummaryResult } from "@/lib/api/opspulse";
import { clusterNodes } from "@/lib/data/infrastructure";
import type { ClusterNode, NodeRole, NodeStatus } from "@/types/infrastructure";

export const dynamic = "force-dynamic";

function toNodeRole(role: string): NodeRole {
  return role === "control-plane" ? "control-plane" : "worker";
}

function toNodeStatus(status: string): NodeStatus {
  return status === "Ready" ? "ready" : status === "NotReady" ? "not-ready" : "unknown";
}

export default async function InfrastructurePage() {
  const [clusterInventory, metricsSummary] = await Promise.all([getClusterInventoryResult(), getMetricsSummaryResult()]);
  const metricsByNode = new Map(
    metricsSummary.status === "connected"
      ? metricsSummary.data.nodes.map((node) => [node.name, node])
      : [],
  );
  const nodes: ClusterNode[] =
    clusterInventory.status === "connected"
      ? clusterInventory.data.nodes.map((node) => {
          const usage = metricsByNode.get(node.name);
          return {
            id: node.name,
            hostname: node.name,
            role: toNodeRole(node.role),
            architecture: node.architecture,
            operatingSystem: node.osImage,
            cpu: usage ? `${usage.cpuPercent}% used; ${node.cpuCapacity} capacity` : `${node.cpuCapacity} / ${node.cpuAllocatable} allocatable`,
            memory: usage ? `${usage.memoryPercent}% used; ${node.memoryCapacity} capacity` : `${node.memoryCapacity} / ${node.memoryAllocatable} allocatable`,
            storage: usage ? `${usage.filesystemPercent}% used; ${node.storageCapacity} capacity` : `${node.storageCapacity} / ${node.storageAllocatable} allocatable`,
            k3sVersion: node.kubeletVersion,
            networkAddress: node.internalIp,
            status: toNodeStatus(node.status),
            notes: usage
              ? `${node.containerRuntime}; kernel ${node.kernelVersion}. Usage is from Prometheus, capacity is from Kubernetes node status.`
              : `${node.containerRuntime}; kernel ${node.kernelVersion}.`,
          };
        })
      : clusterNodes;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950 dark:text-slate-50">Physical Kubernetes Infrastructure</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Node inventory is read from the live Kubernetes API through the internal OpsPulse API, with documented repository data as fallback.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={clusterInventory.status === "connected" ? "connected" : "unavailable"} label={clusterInventory.status === "connected" ? "Live Kubernetes API" : "Repository fallback"} />
          <StatusBadge status={metricsSummary.status === "connected" ? "connected" : "unavailable"} label={metricsSummary.status === "connected" ? "Metrics Live" : "Metrics Unavailable"} />
        </div>
      </section>

      <section aria-label="Node inventory" className="grid gap-4 xl:grid-cols-2">
        {nodes.map((node) => (
          <NodeCard key={node.id} node={node} />
        ))}
      </section>

      <LanTopology nodes={nodes} />
    </div>
  );
}
