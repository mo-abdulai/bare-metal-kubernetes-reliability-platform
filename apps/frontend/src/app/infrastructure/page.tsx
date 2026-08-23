import { LanTopology } from "@/components/infrastructure/lan-topology";
import { NodeCard } from "@/components/infrastructure/node-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { clusterNodes } from "@/lib/data/infrastructure";

export default function InfrastructurePage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950 dark:text-slate-50">Physical Kubernetes Infrastructure</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Node inventory is limited to verified repository documentation. Missing hardware, version, and network values remain marked as not collected.
          </p>
        </div>
        <StatusBadge status="Documented" label="Repository source" />
      </section>

      <section aria-label="Node inventory" className="grid gap-4 xl:grid-cols-2">
        {clusterNodes.map((node) => (
          <NodeCard key={node.id} node={node} />
        ))}
      </section>

      <LanTopology nodes={clusterNodes} />
    </div>
  );
}
