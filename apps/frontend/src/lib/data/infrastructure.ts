import type { ClusterNode, PlatformActivity, PlatformSummary } from "@/types/infrastructure";

export const clusterNodes: ClusterNode[] = [
  {
    id: "homepi",
    hostname: "homepi",
    role: "control-plane",
    architecture: "ARM64",
    operatingSystem: "Linux; distribution/version not collected",
    cpu: "Not collected",
    memory: "Not collected",
    storage: "Not collected",
    k3sVersion: "Not collected",
    networkAddress: "Not collected",
    status: "documented",
    notes: "Documented as the K3s server/control-plane node.",
  },
  {
    id: "workpi",
    hostname: "workpi",
    role: "worker",
    architecture: "ARM64",
    operatingSystem: "Linux; distribution/version not collected",
    cpu: "Not collected",
    memory: "Not collected",
    storage: "Not collected",
    k3sVersion: "Not collected",
    networkAddress: "Not collected",
    status: "documented",
    notes: "Documented as the K3s agent/worker node.",
  },
];

export const platformSummary: PlatformSummary[] = [
  {
    label: "Nodes",
    value: "2",
    state: "Verified",
    description: "Two documented ARM64 K3s nodes.",
  },
  {
    label: "Workloads",
    value: "0",
    state: "Static",
    description: "Live workload telemetry is not connected in Phase 5.",
  },
  {
    label: "Services",
    value: "2",
    state: "Documented",
    description: "OpsPulse web NodePort and internal API ClusterIP service are defined.",
  },
  {
    label: "Recorded Incidents",
    value: "0",
    state: "Documented",
    description: "No incident records exist in this repository yet.",
  },
];

export const platformCapabilities = [
  "Two-node bare-metal cluster",
  "ARM64 Linux infrastructure",
  "K3s orchestration",
  "Separated control-plane and worker roles",
  "Workload execution on worker-node compute resources",
  "Kubernetes networking model documented",
  "Containerized Next.js frontend",
  "Containerized FastAPI backend",
  "Internal Kubernetes Service discovery",
  "Application liveness and readiness probes",
  "Graceful backend failure handling in the frontend",
  "Architecture documentation",
];

export const platformActivity: PlatformActivity[] = [
  {
    id: "baseline",
    title: "Cluster baseline completed",
    detail: "Phase 1 baseline evidence area is documented in the repository.",
    status: "completed",
  },
  {
    id: "architecture",
    title: "Architecture documented",
    detail: "Hardware, network, and K3s topology documentation is present.",
    status: "documented",
  },
  {
    id: "opspulse",
    title: "OpsPulse frontend added",
    detail: "Phase 4 frontend workload source, probes, Docker, and manifests are present.",
    status: "completed",
  },
  {
    id: "opspulse-api",
    title: "OpsPulse API added",
    detail: "Phase 5 backend source, internal service manifests, probes, and frontend integration are present.",
    status: "completed",
  },
];
