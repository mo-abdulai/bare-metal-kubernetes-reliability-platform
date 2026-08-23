import { notFound, redirect } from "next/navigation";

import { StatusBadge } from "@/components/ui/status-badge";
import { addIncidentTimeline, getIncident, resolveIncident, updateIncident } from "@/lib/api/opspulse";
import { incidentStatuses } from "@/lib/data/incidents";
import { severityClasses } from "@/lib/utils/styles";
import type { IncidentSeverity, IncidentStatus, SignalSource } from "@/types/incidents";

export const dynamic = "force-dynamic";

async function changeStatus(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  await updateIncident(id, { status: String(formData.get("status")) as IncidentStatus });
  redirect(`/incidents/${id}`);
}

async function addTimeline(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  await addIncidentTimeline(id, {
    eventType: String(formData.get("eventType") || "note"),
    message: String(formData.get("message") || ""),
  });
  redirect(`/incidents/${id}`);
}

async function resolveAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  await resolveIncident(id, {
    summary: String(formData.get("summary") || ""),
    rootCause: String(formData.get("rootCause") || ""),
    remediation: String(formData.get("remediation") || ""),
    prevention: String(formData.get("prevention") || ""),
  });
  redirect(`/incidents/${id}`);
}

function duration(start: string, end?: string | null) {
  const startMs = new Date(start).getTime();
  const endMs = end ? new Date(end).getTime() : Date.now();
  const minutes = Math.max(Math.round((endMs - startMs) / 60000), 0);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function groupLabel(source: SignalSource) {
  if (source === "prometheus") return "Alerts";
  if (source === "kubernetes") return "Kubernetes Events";
  if (source === "loki") return "Logs";
  return "Workload State";
}

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let incident;
  try {
    incident = await getIncident(id);
  } catch {
    notFound();
  }
  const grouped = incident.signals.reduce<Record<string, typeof incident.signals>>((acc, signal) => {
    const key = groupLabel(signal.source);
    acc[key] = [...(acc[key] || []), signal];
    return acc;
  }, {});

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-mono text-sm text-slate-500 dark:text-slate-400">{incident.id}</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">{incident.title}</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-400">{incident.summary || "No summary recorded."}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-md border px-2 py-1 text-xs font-medium ${severityClasses(incident.severity as IncidentSeverity)}`}>{incident.severity}</span>
            <StatusBadge status={incident.status === "Resolved" ? "connected" : "Documented"} label={incident.status} />
            <StatusBadge status="Documented" label={incident.component} />
            <StatusBadge status="Documented" label={duration(incident.detectedAt, incident.resolvedAt)} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface-900">
          <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Correlated Signals</h2>
          <div className="mt-4 grid gap-4">
            {Object.entries(grouped).map(([label, signals]) => (
              <div key={label}>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</h3>
                <div className="mt-2 grid gap-2">
                  {signals.map((signal) => (
                    <div key={signal.id} className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-surface-850">
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{new Date(signal.timestamp).toLocaleString()}</span>
                        <span>{signal.component}</span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-50">{signal.title}</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{signal.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {incident.signals.length === 0 ? <p className="text-sm text-slate-600 dark:text-slate-400">No evidence snapshots were attached.</p> : null}
          </div>
        </div>

        <div className="grid gap-4">
          <form action={changeStatus} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-surface-900">
            <input type="hidden" name="id" value={incident.id} />
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
            <select name="status" defaultValue={incident.status} className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-surface-950">
              {incidentStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <button className="mt-3 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">Update Status</button>
          </form>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-surface-900">
            <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Runbook</h2>
            {incident.runbookId ? <a href={`/runbooks/${incident.runbookId}`} className="mt-2 block text-sm font-medium text-blue-700 dark:text-blue-300">{incident.runbookId}</a> : <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">No runbook linked.</p>}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface-900">
          <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Timeline</h2>
          <ol className="mt-4 space-y-3">
            {incident.timeline.map((entry) => (
              <li key={`${entry.timestamp}-${entry.eventType}-${entry.message}`} className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-surface-850">
                <p className="text-xs uppercase text-slate-500 dark:text-slate-400">{entry.eventType} - {new Date(entry.timestamp).toLocaleString()}</p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{entry.message}</p>
              </li>
            ))}
          </ol>
          <form action={addTimeline} className="mt-4 grid gap-3">
            <input type="hidden" name="id" value={incident.id} />
            <input name="eventType" placeholder="investigation" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-surface-950" />
            <textarea name="message" required rows={3} placeholder="Timeline note" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-surface-950" />
            <button className="justify-self-start rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-950">Add Timeline Entry</button>
          </form>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface-900">
          <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Resolution</h2>
          {incident.resolution ? (
            <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
              <p><strong>Summary:</strong> {incident.resolution.summary}</p>
              {incident.resolution.rootCause ? <p><strong>Root cause:</strong> {incident.resolution.rootCause}</p> : null}
              {incident.resolution.remediation ? <p><strong>Remediation:</strong> {incident.resolution.remediation}</p> : null}
              {incident.resolution.prevention ? <p><strong>Prevention:</strong> {incident.resolution.prevention}</p> : null}
            </div>
          ) : (
            <form action={resolveAction} className="mt-4 grid gap-3">
              <input type="hidden" name="id" value={incident.id} />
              <textarea name="summary" required rows={3} placeholder="Resolution summary" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-surface-950" />
              <textarea name="rootCause" rows={2} placeholder="Root cause" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-surface-950" />
              <textarea name="remediation" rows={2} placeholder="Remediation" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-surface-950" />
              <textarea name="prevention" rows={2} placeholder="Prevention / follow-up" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-surface-950" />
              <button className="justify-self-start rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">Resolve Incident</button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
