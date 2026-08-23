export type IncidentSeverity = "SEV-1" | "SEV-2" | "SEV-3" | "SEV-4";
export type IncidentStatus = "Open" | "Investigating" | "Mitigated" | "Monitoring" | "Resolved";
export type SignalSource = "prometheus" | "kubernetes" | "loki" | "workload";

export interface Signal {
  id: string;
  timestamp: string;
  source: SignalSource;
  severityHint: IncidentSeverity;
  component: string;
  title: string;
  message: string;
  metadata: Record<string, string>;
}

export interface IncidentCandidate {
  candidateId: string;
  title: string;
  component: string;
  firstSeen: string;
  lastSeen: string;
  signalCount: number;
  severitySuggestion: IncidentSeverity;
  runbookId: string | null;
  signals: Signal[];
}

export interface IncidentTimelineEntry {
  timestamp: string;
  eventType: string;
  message: string;
}

export interface IncidentResolution {
  summary: string;
  rootCause: string | null;
  remediation: string | null;
  prevention: string | null;
}

export interface Incident {
  id: string;
  title: string;
  severity: IncidentSeverity;
  component: string;
  status: IncidentStatus;
  summary: string | null;
  source: string;
  createdAt: string;
  updatedAt: string;
  detectedAt: string;
  resolvedAt: string | null;
  signals: Signal[];
  runbookId: string | null;
  timeline: IncidentTimelineEntry[];
  resolution: IncidentResolution | null;
}

export interface ActiveAlert {
  id: string;
  name: string;
  state: string;
  severity: string | null;
  instance: string | null;
  namespace: string | null;
  pod: string | null;
  node: string | null;
  summary: string | null;
  startedAt: string | null;
  labels: Record<string, string>;
}
