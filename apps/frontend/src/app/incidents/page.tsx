import { AlertTriangle } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { incidentSeverities, incidents } from "@/lib/data/incidents";
import { severityClasses } from "@/lib/utils/styles";

export default function IncidentsPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950 dark:text-slate-50">Incidents</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Incident records will appear here as reliability exercises and operational events are documented.
          </p>
        </div>
        <StatusBadge status="Documented" label="No records" />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface-900">
        <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Severity Model</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {incidentSeverities.map((severity) => (
            <span key={severity} className={`rounded-md border px-2 py-1 text-xs font-medium ${severityClasses(severity)}`}>
              {severity}
            </span>
          ))}
        </div>
      </section>

      {incidents.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-surface-900">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-surface-850 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Incident ID</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Component</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Detected</th>
                  <th className="px-4 py-3">Resolved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800" />
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<AlertTriangle aria-hidden="true" className="h-10 w-10" />}
          title="No incidents recorded"
          description="Incident records will appear here as reliability exercises and operational events are documented."
        />
      )}
    </div>
  );
}
