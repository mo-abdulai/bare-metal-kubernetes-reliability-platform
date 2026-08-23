export type WorkloadStatus = "available" | "pending" | "unknown";

export interface Workload {
  id: string;
  name: string;
  namespace: string;
  type: string;
  desired: number;
  available: number;
  status: WorkloadStatus;
}
