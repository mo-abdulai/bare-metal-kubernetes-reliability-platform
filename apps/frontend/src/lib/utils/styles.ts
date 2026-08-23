import type { NodeStatus } from "@/types/infrastructure";
import type { IncidentSeverity } from "@/types/incidents";
import type { ServiceHealth } from "@/types/services";

export function nodeStatusLabel(status: NodeStatus) {
  if (status === "ready") {
    return "Ready";
  }

  if (status === "not-ready") {
    return "Not Ready";
  }

  return status === "documented" ? "Documented" : status === "configured" ? "Configured" : "Unknown";
}

export function statusClasses(status: NodeStatus | ServiceHealth | "Static" | "Verified" | "Documented" | "Ready") {
  switch (status) {
    case "documented":
    case "Documented":
      return "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-200";
    case "configured":
    case "Verified":
    case "Ready":
    case "ready":
    case "connected":
    case "ok":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200";
    case "unavailable":
    case "not-ready":
      return "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-200";
    case "not-checked":
    case "Static":
      return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200";
    case "unknown":
    default:
      return "border-slate-400/30 bg-slate-400/10 text-slate-700 dark:text-slate-200";
  }
}

export function severityClasses(severity: IncidentSeverity) {
  switch (severity) {
    case "SEV-1":
      return "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-200";
    case "SEV-2":
      return "border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-200";
    case "SEV-3":
      return "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-200";
    case "SEV-4":
      return "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-200";
  }
}
