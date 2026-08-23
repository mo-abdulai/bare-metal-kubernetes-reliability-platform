import { BookOpen } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { runbooks } from "@/lib/data/runbooks";

const plannedRunbooks = [
  "Node NotReady",
  "CrashLoopBackOff",
  "OOMKilled",
  "Service Has No Endpoints",
  "Pod Pending",
  "Database Unavailable",
];

export default function RunbooksPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950 dark:text-slate-50">Runbooks</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Operational runbooks will be listed when corresponding repository files exist.
          </p>
        </div>
        <StatusBadge status="Static" label="Directory ready" />
      </section>

      {runbooks.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" />
      ) : (
        <EmptyState
          icon={<BookOpen aria-hidden="true" className="h-10 w-10" />}
          title="No runbooks published"
          description="The UI is ready to map incidents to operational runbooks once runbook files are added to the repository."
        />
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface-900">
        <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Planned Runbook Categories</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Shown as planned categories only; none are marked complete.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {plannedRunbooks.map((title) => (
            <div key={title} className="rounded-md border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
              {title}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
