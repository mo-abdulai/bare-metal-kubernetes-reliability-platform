import { AlertTriangle } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { getMetricsSummaryResult, getRecentEventsResult, getRecentLogsResult } from "@/lib/api/opspulse";
import { incidentSeverities, incidents } from "@/lib/data/incidents";
import { severityClasses } from "@/lib/utils/styles";

export const dynamic = "force-dynamic";

export default async function IncidentsPage() {
  const [metricsSummary, recentEvents, recentLogs] = await Promise.all([
    getMetricsSummaryResult(),
    getRecentEventsResult(),
    getRecentLogsResult(),
  ]);
  const activeSignals = [
    ...(metricsSummary.status === "connected" && metricsSummary.data.api.errorRatePerSecond > 0
      ? [{ id: "api-5xx-rate", source: "Prometheus", label: "API 5xx rate", detail: `${metricsSummary.data.api.errorRatePerSecond}/s` }]
      : []),
    ...(recentEvents.status === "connected"
      ? recentEvents.data
          .filter((event) => event.type === "Warning")
          .slice(0, 3)
          .map((event) => ({
            id: `${event.timestamp}-${event.reason}-${event.objectName}`,
            source: "Kubernetes",
            label: event.reason,
            detail: `${event.objectKind} ${event.objectName}`,
          }))
      : []),
    ...(recentLogs.status === "connected"
      ? recentLogs.data.slice(0, 3).map((entry) => ({
          id: `${entry.timestamp}-${entry.pod}-${entry.message}`,
          source: "Loki",
          label: `${entry.service} ${entry.level}`,
          detail: entry.message,
        }))
      : []),
  ];

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

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Recent Signals</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Raw operational evidence. Signals are not incidents until reviewed and promoted.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={metricsSummary.status === "connected" ? "connected" : "unavailable"} label={metricsSummary.status === "connected" ? "Metrics Live" : "Metrics Unavailable"} />
            <StatusBadge status={recentLogs.status === "connected" ? "connected" : "unavailable"} label={recentLogs.status === "connected" ? "Logs Live" : "Logs Unavailable"} />
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {activeSignals.length > 0 ? (
            activeSignals.map((signal) => (
              <div key={signal.id} className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-surface-850">
                <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">{signal.source}</p>
                <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-50">{signal.label}</p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{signal.detail}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-400">No recent alert, warning event, or error log signals returned.</p>
          )}
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
