export interface GitOpsApplication {
  name: string;
  syncStatus: string;
  healthStatus: string;
  revision: string | null;
  targetRevision: string | null;
  destinationNamespace: string | null;
  lastOperationPhase: string | null;
  lastReconciledAt: string | null;
  currentImages: string[];
}

export interface GitOpsStatus {
  status: "ok";
  applications: GitOpsApplication[];
}
