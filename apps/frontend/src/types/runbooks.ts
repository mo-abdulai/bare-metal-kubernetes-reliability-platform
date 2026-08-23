export type RunbookStatus = "available" | "planned";

export interface Runbook {
  id: string;
  title: string;
  category: string;
  linkedSignals: string[];
  lastUpdated: string;
  purpose: string;
}

export interface RunbookDetail extends Runbook {
  content: string;
}
