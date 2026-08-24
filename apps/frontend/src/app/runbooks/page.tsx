import { BookOpen, FileText } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { getRunbooksResult } from "@/lib/api/opspulse";

export const dynamic = "force-dynamic";

export default async function RunbooksPage() {
  const runbooks = await getRunbooksResult();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950 dark:text-slate-50">Runbooks</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Repository-backed operational procedures for investigating and remediating known infrastructure failure modes.
          </p>
        </div>
        <StatusBadge status={runbooks.status === "connected" ? "connected" : "unavailable"} label={runbooks.status === "connected" ? "Directory Live" : "Directory Unavailable"} />
      </section>

      {runbooks.status === "connected" && runbooks.data.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {runbooks.data.map((runbook) => (
            <Link key={runbook.id} href={`/runbooks/${runbook.id}`} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-400 dark:border-slate-800 dark:bg-surface-900">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">{runbook.category}</p>
                  <h2 className="mt-1 text-base font-semibold text-slate-950 dark:text-slate-50">{runbook.title}</h2>
                </div>
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
              <p className="mt-3 line-clamp-3 text-sm text-slate-600 dark:text-slate-400">{runbook.purpose}</p>
              {runbook.reproducible ? (
                <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                  Reproducible: <code>{runbook.reproductionCommand}</code>
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {runbook.linkedSignals.slice(0, 3).map((signal) => <StatusBadge key={signal} status="Documented" label={signal} />)}
                {runbook.reproducible ? <StatusBadge status="connected" label="Reproducible" /> : null}
              </div>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Updated {runbook.lastUpdated}</p>
            </Link>
          ))}
        </section>
      ) : (
        <EmptyState
          icon={<BookOpen aria-hidden="true" className="h-10 w-10" />}
          title="No runbooks available"
          description={runbooks.status === "connected" ? "No Markdown runbooks were returned by the API." : runbooks.message}
        />
      )}
    </div>
  );
}
