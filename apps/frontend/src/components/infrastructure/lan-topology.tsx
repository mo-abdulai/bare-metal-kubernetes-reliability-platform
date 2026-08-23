import { Network, Server } from "lucide-react";

import type { ClusterNode } from "@/types/infrastructure";

export function LanTopology({ nodes }: { nodes: ClusterNode[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface-900">
      <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">LAN Topology</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Physical node connectivity documented at a high level.</p>

      <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-surface-850">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <Network aria-hidden="true" className="h-5 w-5 text-blue-700 dark:text-blue-300" />
          LAN
        </div>
        <div className="ml-2 mt-4 space-y-4 border-l border-slate-300 pl-5 dark:border-slate-700">
          {nodes.map((node) => (
            <div key={node.id} className="flex items-center gap-3">
              <Server aria-hidden="true" className="h-4 w-4 text-slate-500" />
              <div>
                <div className="font-medium text-slate-950 dark:text-slate-50">{node.hostname}</div>
                <div className="text-sm capitalize text-slate-600 dark:text-slate-400">{node.role.replace("-", " ")}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
