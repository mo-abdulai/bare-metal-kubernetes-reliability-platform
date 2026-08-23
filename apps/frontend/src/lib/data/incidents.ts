import type { IncidentSeverity, IncidentStatus } from "@/types/incidents";

export const incidentStatuses: IncidentStatus[] = ["Open", "Investigating", "Mitigated", "Monitoring", "Resolved"];

export const incidentSeverities: IncidentSeverity[] = ["SEV-1", "SEV-2", "SEV-3", "SEV-4"];
