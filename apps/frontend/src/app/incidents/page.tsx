import { AlertTriangle, ArrowRight, Clock, FileText } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { getActiveAlertsResult, getIncidentCandidatesResult, getIncidentsResult, getSignalsResult } from "@/lib/api/opspulse";
import { incidentSeverities } from "@/lib/data/incidents";
import { severityClasses } from "@/lib/utils/styles";
import type { Incident, IncidentCandidate, IncidentSeverity, Signal } from "@/types/incidents";

export const dynamic = "force-dynamic";

function duration(start: string, end?: string | null) {
  const startMs = new Date(start).getTime();
  const endMs = end ? new Date(end).getTime() : Date.now();
  const minutes = Math.max(Math.round((endMs - startMs) / 60000), 0);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function severityBadge(severity: IncidentSeverity) {
  return <span className={`rounded-md border px-2 py-1 text-xs font-medium ${severityClasses(severity)}`}>{severity}</span>;
}

function ActiveIncidentCard({ incident }: { incident: Incident }) {
  return (
    <Link href={`/incidents/${incident.id}`} className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-400 dark:border-slate-800 dark:bg-surface-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-medium text-slate-500 dark:text-slate-400">{incident.id}</p>
          <h3 className="mt-1 text-base font-semibold text-slate-950 dark:text-slate-50">{incident.title}</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{incident.component}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {severityBadge(incident.severity)}
          <StatusBadge status={incident.status === "Resolved" ? "connected" : "Documented"} label={incident.status} />
        </div>
      </div>
      <div className="mt-4 grid gap-3 text-sm text-slate-600 dark:text-slate-400 sm:grid-cols-3">
        <div>{incident.signals.length} signals</div>
        <div>{incident.runbookId ? `Runbook: ${incident.runbookId}` : "No runbook selected"}</div>
        <div className="flex items-center gap-1"><Clock className="h-4 w-4" /> {duration(incident.detectedAt, incident.resolvedAt)}</div>
      </div>
    </Link>
  );
}

function CandidateCard({ candidate }: { candidate: IncidentCandidate }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-surface-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Potential Incident</p>
          <h3 className="mt-1 text-base font-semibold text-slate-950 dark:text-slate-50">{candidate.title}</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{candidate.component}</p>
        </div>
        {severityBadge(candidate.severitySuggestion)}
      </div>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
        {candidate.signalCount} correlated signals - first seen {duration(candidate.firstSeen)} ago
      </p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Suggested runbook: {candidate.runbookId || "None"}</p>
      <Link href={`/incidents/promote?candidate=${candidate.candidateId}`} className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
        Review <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

function SignalRow({ signal }: { signal: Signal }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-surface-850">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">{signal.source}</span>
        {severityBadge(signal.severityHint)}
        <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(signal.timestamp).toLocaleString()}</span>
      </div>
      <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-50">{signal.title}</p>
      <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{signal.message}</p>
    </div>
  );
}

export default async function IncidentsPage() {
  const [incidents, candidates, signals, alerts] = await Promise.all([
    getIncidentsResult(),
    getIncidentCandidatesResult(),
    getSignalsResult(),
    getActiveAlertsResult(),
  ]);
  const activeIncidents = incidents.status === "connected" ? incidents.data.filter((incident) => incident.status !== "Resolved") : [];
  const recentSignals = signals.status === "connected" ? signals.data.slice(0, 8) : [];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950 dark:text-slate-50">Incidents</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Signals are raw operational evidence. Incidents are reviewed issues promoted for investigation and tracking.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="Documented" label={`${incidentSeverities.length} severities`} />
          <StatusBadge status={alerts.status === "connected" ? "connected" : "unavailable"} label={alerts.status === "connected" ? "Alerts Live" : "Alerts Unavailable"} />
          <StatusBadge status={signals.status === "connected" ? "connected" : "unavailable"} label={signals.status === "connected" ? "Signals Live" : "Signals Unavailable"} />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface-900">
        <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Active Incidents</h2>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {activeIncidents.length > 0 ? (
            activeIncidents.map((incident) => <ActiveIncidentCard key={incident.id} incident={incident} />)
          ) : (
            <EmptyState icon={<AlertTriangle className="h-10 w-10" />} title="No active incidents" description="Formal incidents appear here only after an operator reviews signals and promotes them." />
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface-900">
        <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Incident Candidates</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Candidates are retained groups of related signals. Review and promotion are required before they become active incidents.
        </p>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {candidates.status === "connected" && candidates.data.length > 0 ? (
            candidates.data.map((candidate) => <CandidateCard key={candidate.candidateId} candidate={candidate} />)
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-400">{candidates.status === "connected" ? "No incident candidates detected." : candidates.message}</p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface-900">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-300" />
          <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Recent Signals</h2>
        </div>
        <div className="mt-4 grid gap-3">
          {recentSignals.length > 0 ? recentSignals.map((signal) => <SignalRow key={signal.id} signal={signal} />) : <p className="text-sm text-slate-600 dark:text-slate-400">No recent signals returned.</p>}
        </div>
      </section>
    </div>
  );
}
