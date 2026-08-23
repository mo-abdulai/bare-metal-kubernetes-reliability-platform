export type RunbookStatus = "available" | "planned";

export interface Runbook {
  id: string;
  title: string;
  component: string;
  status: RunbookStatus;
  path?: string;
}
