export type IncidentSeverity = "SEV-1" | "SEV-2" | "SEV-3" | "SEV-4";
export type IncidentStatus = "open" | "investigating" | "resolved";

export interface Incident {
  id: string;
  title: string;
  severity: IncidentSeverity;
  component: string;
  status: IncidentStatus;
  detected: string;
  resolved?: string;
}
