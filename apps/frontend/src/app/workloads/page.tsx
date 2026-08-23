import { Boxes } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { getClusterInventoryResult } from "@/lib/api/opspulse";

export const dynamic = "force-dynamic";

export default async function WorkloadsPage() {
  const clusterInventory = await getClusterInventoryResult();
  const deployments = clusterInventory.status === "connected" ? clusterInventory.data.deployments : [];
  const pods = clusterInventory.status === "connected" ? clusterInventory.data.pods : [];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950 dark:text-slate-50">Workloads</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Deployments and Pods are read from the live OpsPulse namespace through the internal API.
          </p>
        </div>
        <StatusBadge status={clusterInventory.status === "connected" ? "connected" : "unavailable"} label={clusterInventory.status === "connected" ? "Live Kubernetes API" : "Inventory Unavailable"} />
      </section>

      {deployments.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-surface-900">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-surface-850 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Workload</th>
                  <th className="px-4 py-3">Namespace</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Desired</th>
                  <th className="px-4 py-3">Available</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {deployments.map((workload) => (
                  <tr key={`${workload.namespace}/${workload.name}`} className="align-top">
                    <td className="px-4 py-4 font-medium text-slate-950 dark:text-slate-50">{workload.name}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{workload.namespace}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-400">Deployment</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{workload.desired}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{workload.available}</td>
                    <td className="px-4 py-4">
                      <StatusBadge status={workload.status === "available" ? "connected" : "unknown"} label={workload.status === "available" ? "Available" : "Pending"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<Boxes aria-hidden="true" className="h-10 w-10" />}
          title="No workloads reported"
          description="Live workload telemetry will become available when the platform API is connected."
        />
      )}

      {pods.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-surface-900">
          <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-950 dark:text-slate-50">Pods</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-surface-850 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Pod</th>
                  <th className="px-4 py-3">Node</th>
                  <th className="px-4 py-3">Phase</th>
                  <th className="px-4 py-3">Ready</th>
                  <th className="px-4 py-3">Restarts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {pods.map((pod) => (
                  <tr key={`${pod.namespace}/${pod.name}`} className="align-top">
                    <td className="px-4 py-4 font-medium text-slate-950 dark:text-slate-50">{pod.name}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{pod.nodeName}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{pod.phase}</td>
                    <td className="px-4 py-4">
                      <StatusBadge status={pod.ready ? "connected" : "unknown"} label={pod.ready ? "Ready" : "Not Ready"} />
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{pod.restarts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
