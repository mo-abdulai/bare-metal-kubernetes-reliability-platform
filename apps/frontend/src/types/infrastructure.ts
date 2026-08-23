export type NodeRole = "control-plane" | "worker";
export type NodeStatus = "documented" | "configured" | "unknown" | "ready" | "not-ready";

export interface InfrastructureProperty {
  label: string;
  value: string;
}

export interface ClusterNode {
  id: string;
  hostname: string;
  role: NodeRole;
  architecture: string;
  operatingSystem: string;
  cpu: string;
  memory: string;
  storage: string;
  k3sVersion: string;
  networkAddress: string;
  status: NodeStatus;
  notes: string;
}

export interface PlatformSummary {
  label: string;
  value: string;
  state: "Verified" | "Static" | "Documented" | "Ready";
  description: string;
}

export interface PlatformActivity {
  id: string;
  title: string;
  detail: string;
  status: "completed" | "documented";
}
