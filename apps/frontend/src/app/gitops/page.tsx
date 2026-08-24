import { GitBranch, History } from "lucide-react";

import { StatusBadge } from "@/components/ui/status-badge";
import { getGitOpsStatusResult } from "@/lib/api/opspulse";

export const dynamic = "force-dynamic";

function stateClasses(value: string) {
  if (value === "Synced" || value === "Healthy" || value === "Succeeded") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300";
  }
  if (value === "Progressing" || value === "OutOfSync" || value === "Running") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300";
  }
  if (value === "Degraded" || value === "Missing" || value === "Failed" || value === "Error") {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300";
  }
  return "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300";
}

function StatePill({ label, value }: { label: string; value: string }) {
  return (
    <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${stateClasses(value)}`}>
      {label}: {value}
    </span>
  );
}

function shortRevision(revision: string | null) {
  if (!revision) {
    return "Unknown";
  }
  return revision.length > 12 ? revision.slice(0, 12) : revision;
}

export default async function GitOpsPage() {
  const gitops = await getGitOpsStatusResult();
  const applications = gitops.status === "connected" ? gitops.data.applications : [];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950 dark:text-slate-50">GitOps</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Argo CD compares Git desired state with Kubernetes cluster state and reconciles drift for GitOps-owned resources.
          </p>
        </div>
        <StatusBadge status={gitops.status === "connected" ? "connected" : "unavailable"} label={gitops.status === "connected" ? "Argo CD Connected" : "Argo CD Unavailable"} />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface-900">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-blue-600 dark:text-blue-300" />
          <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Applications</h2>
        </div>
        <div className="mt-4 grid gap-4">
          {applications.length > 0 ? (
            applications.map((application) => (
              <article key={application.name} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-surface-850">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-950 dark:text-slate-50">{application.name}</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Namespace: {application.destinationNamespace || "cluster scoped"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatePill label="Sync" value={application.syncStatus} />
                    <StatePill label="Health" value={application.healthStatus} />
                    {application.lastOperationPhase ? <StatePill label="Operation" value={application.lastOperationPhase} /> : null}
                  </div>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-slate-600 dark:text-slate-400 md:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Target</p>
                    <p className="mt-1 font-mono text-xs">{application.targetRevision || "Unknown"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Revision</p>
                    <p className="mt-1 font-mono text-xs">{shortRevision(application.revision)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Last Reconciled</p>
                    <p className="mt-1">{application.lastReconciledAt ? new Date(application.lastReconciledAt).toLocaleString() : "Unknown"}</p>
                  </div>
                </div>
                {application.currentImages.length > 0 ? (
                  <div className="mt-4">
                    <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Images</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {application.currentImages.map((image) => (
                        <code key={image} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 dark:border-slate-800 dark:bg-surface-950 dark:text-slate-300">
                          {image}
                        </code>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-400">{gitops.status === "connected" ? "No Argo CD applications returned." : gitops.message}</p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface-900">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Activity</h2>
        </div>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Detailed reconciliation history is intentionally left in Argo CD. OpsPulse shows current Application state and image summaries without exposing repository credentials.
        </p>
      </section>
    </div>
  );
}
