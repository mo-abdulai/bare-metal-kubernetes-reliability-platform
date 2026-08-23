import { Server } from "lucide-react";

import { StatusBadge } from "@/components/ui/status-badge";
import { nodeStatusLabel } from "@/lib/utils/styles";
import type { ClusterNode } from "@/types/infrastructure";

export function InfrastructureProperty({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-surface-850">
      <dt className="text-xs font-medium uppercase text-slate-500 dark:text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{value}</dd>
    </div>
  );
}

export function NodeCard({ node }: { node: ClusterNode }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 text-blue-700 dark:border-slate-700 dark:text-blue-300">
            <Server aria-hidden="true" className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{node.hostname}</h2>
            <p className="text-sm capitalize text-slate-600 dark:text-slate-400">{node.role.replace("-", " ")}</p>
          </div>
        </div>
        <StatusBadge status={node.status} label={nodeStatusLabel(node.status)} />
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <InfrastructureProperty label="Architecture" value={node.architecture} />
        <InfrastructureProperty label="Operating system" value={node.operatingSystem} />
        <InfrastructureProperty label="CPU" value={node.cpu} />
        <InfrastructureProperty label="Memory" value={node.memory} />
        <InfrastructureProperty label="Storage" value={node.storage} />
        <InfrastructureProperty label="K3s version" value={node.k3sVersion} />
        <InfrastructureProperty label="Network address" value={node.networkAddress} />
      </dl>

      <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">{node.notes}</p>
    </article>
  );
}
