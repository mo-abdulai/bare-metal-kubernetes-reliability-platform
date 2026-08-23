import { redirect } from "next/navigation";

import { StatusBadge } from "@/components/ui/status-badge";
import { createIncident, getIncidentCandidatesResult, getRunbooksResult } from "@/lib/api/opspulse";
import { incidentSeverities } from "@/lib/data/incidents";
import { severityClasses } from "@/lib/utils/styles";
import type { IncidentSeverity } from "@/types/incidents";

export const dynamic = "force-dynamic";

async function promoteIncident(formData: FormData) {
  "use server";

  const incident = await createIncident({
    title: String(formData.get("title") || ""),
    severity: String(formData.get("severity") || "SEV-4") as IncidentSeverity,
    component: String(formData.get("component") || ""),
    summary: String(formData.get("summary") || ""),
    runbookId: String(formData.get("runbookId") || "") || undefined,
    candidateId: String(formData.get("candidateId") || "") || undefined,
    signalIds: formData.getAll("signalIds").map(String),
  });

  redirect(`/incidents/${incident.id}`);
}

export default async function PromoteIncidentPage({ searchParams }: { searchParams: Promise<{ candidate?: string }> }) {
  const { candidate: candidateId } = await searchParams;
  const [candidates, runbooks] = await Promise.all([getIncidentCandidatesResult(), getRunbooksResult()]);
  const candidate = candidates.status === "connected" ? candidates.data.find((item) => item.candidateId === candidateId) : null;

  if (!candidate) {
    return (
      <div className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-surface-900">
        <h1 className="text-xl font-semibold text-slate-950 dark:text-slate-50">Candidate unavailable</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">The candidate may have disappeared because live signals changed. Return to Incidents and review current candidates.</p>
      </div>
    );
  }

  return (
    <form action={promoteIncident} className="mx-auto flex max-w-5xl flex-col gap-6">
      <input type="hidden" name="candidateId" value={candidate.candidateId} />
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface-900">
        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Promote Candidate</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">{candidate.title}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Review the correlated evidence, edit the incident fields, then explicitly create the incident.</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <label className="block rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-surface-900">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Title</span>
          <input name="title" defaultValue={candidate.title} required className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-surface-950" />
        </label>
        <label className="block rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-surface-900">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Component</span>
          <input name="component" defaultValue={candidate.component} required className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-surface-950" />
        </label>
        <label className="block rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-surface-900">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Severity</span>
          <select name="severity" defaultValue={candidate.severitySuggestion} className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-surface-950">
            {incidentSeverities.map((severity) => (
              <option key={severity} value={severity}>{severity}</option>
            ))}
          </select>
        </label>
        <label className="block rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-surface-900">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Runbook</span>
          <select name="runbookId" defaultValue={candidate.runbookId || ""} className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-surface-950">
            <option value="">No runbook</option>
            {runbooks.status === "connected" ? runbooks.data.map((runbook) => <option key={runbook.id} value={runbook.id}>{runbook.title}</option>) : null}
          </select>
        </label>
      </section>

      <label className="block rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-surface-900">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Summary</span>
        <textarea name="summary" rows={4} defaultValue={`Reviewed ${candidate.signalCount} correlated signals for ${candidate.component}.`} className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-surface-950" />
      </label>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface-900">
        <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Selected Evidence</h2>
        <div className="mt-4 grid gap-3">
          {candidate.signals.map((signal) => (
            <label key={signal.id} className="flex gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-surface-850">
              <input type="checkbox" name="signalIds" value={signal.id} defaultChecked className="mt-1" />
              <span>
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-medium uppercase text-slate-500 dark:text-slate-400">{signal.source}</span>
                  <span className={`rounded-md border px-2 py-0.5 text-xs ${severityClasses(signal.severityHint)}`}>{signal.severityHint}</span>
                  <StatusBadge status="Documented" label={signal.component} />
                </span>
                <span className="mt-2 block font-semibold text-slate-950 dark:text-slate-50">{signal.title}</span>
                <span className="mt-1 block text-slate-600 dark:text-slate-400">{signal.message}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Create Incident</button>
      </div>
    </form>
  );
}
