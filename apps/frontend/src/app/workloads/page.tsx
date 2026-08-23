import { Boxes } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { workloads } from "@/lib/data/workloads";

export default function WorkloadsPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950 dark:text-slate-50">Workloads</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            This route establishes the table architecture for Kubernetes workload telemetry without inventing running deployments.
          </p>
        </div>
        <StatusBadge status="Static" label="Awaiting API" />
      </section>

      {workloads.length > 0 ? (
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
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800" />
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
    </div>
  );
}
