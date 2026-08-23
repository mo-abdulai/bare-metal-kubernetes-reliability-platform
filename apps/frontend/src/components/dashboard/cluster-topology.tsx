import { ArrowRightLeft, Cpu } from "lucide-react";

import { StatusBadge } from "@/components/ui/status-badge";
import { nodeStatusLabel } from "@/lib/utils/styles";
import type { ClusterNode } from "@/types/infrastructure";

export function ClusterTopology({ nodes }: { nodes: ClusterNode[] }) {
  const [controlPlane, worker] = nodes;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface-900">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Infrastructure Topology</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">K3s Cluster · static architecture model</p>
        </div>
        <StatusBadge status="Documented" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <TopologyNode node={controlPlane} />
        <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 lg:flex-col">
          <ArrowRightLeft aria-hidden="true" className="h-5 w-5 text-blue-600 dark:text-blue-300" />
          <span>cluster communication</span>
        </div>
        <TopologyNode node={worker} />
      </div>
    </section>
  );
}

function TopologyNode({ node }: { node: ClusterNode }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-surface-850">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-blue-700 dark:border-slate-700 dark:bg-surface-900 dark:text-blue-300">
            <Cpu aria-hidden="true" className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-950 dark:text-slate-50">{node.hostname}</h3>
            <p className="text-sm capitalize text-slate-600 dark:text-slate-400">{node.role.replace("-", " ")}</p>
          </div>
        </div>
        <StatusBadge status={node.status} label={nodeStatusLabel(node.status)} />
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Architecture</dt>
          <dd className="font-medium text-slate-800 dark:text-slate-200">{node.architecture}</dd>
        </div>
        <div>
          <dt className="text-slate-500 dark:text-slate-400">OS</dt>
          <dd className="font-medium text-slate-800 dark:text-slate-200">{node.operatingSystem}</dd>
        </div>
      </dl>
    </article>
  );
}
