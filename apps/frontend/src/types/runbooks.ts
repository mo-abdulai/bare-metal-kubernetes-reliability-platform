export type RunbookStatus = "available" | "planned";

export interface Runbook {
  id: string;
  title: string;
  category: string;
  linkedSignals: string[];
  lastUpdated: string;
  purpose: string;
  reproducible: boolean;
  reproductionCommand: string | null;
  cleanupCommand: string | null;
  expectedSignals: string[];
}

export interface RunbookDetail extends Runbook {
  content: string;
}
