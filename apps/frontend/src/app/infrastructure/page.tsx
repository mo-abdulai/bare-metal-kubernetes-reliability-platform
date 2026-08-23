import { LanTopology } from "@/components/infrastructure/lan-topology";
import { NodeCard } from "@/components/infrastructure/node-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getClusterInventoryResult } from "@/lib/api/opspulse";
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
  const clusterInventory = await getClusterInventoryResult();
  const nodes: ClusterNode[] =
    clusterInventory.status === "connected"
      ? clusterInventory.data.nodes.map((node) => ({
          id: node.name,
          hostname: node.name,
          role: toNodeRole(node.role),
          architecture: node.architecture,
          operatingSystem: node.osImage,
          cpu: "Capacity not collected",
          memory: "Capacity not collected",
          storage: "Capacity not collected",
          k3sVersion: node.kubeletVersion,
          networkAddress: node.internalIp,
          status: toNodeStatus(node.status),
          notes: `${node.containerRuntime}; kernel ${node.kernelVersion}.`,
        }))
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
        <StatusBadge status={clusterInventory.status === "connected" ? "connected" : "unavailable"} label={clusterInventory.status === "connected" ? "Live Kubernetes API" : "Repository fallback"} />
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
