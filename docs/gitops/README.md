# GitOps & Declarative Delivery

Phase 9 makes Git the authoritative desired-state source for OpsPulse platform delivery.

```text
Developer
   |
   v
GitHub
   |
   v
Argo CD
   |
   v
Kubernetes
   |
   v
OpsPulse
```

## Principles

- Git contains declarative Kubernetes desired state.
- Argo CD compares Git state with live cluster state.
- Normal delivery happens through commits and pull requests.
- Manual `kubectl apply` is reserved for emergency or debugging workflows.
- Secrets are not committed to Git.

## Repository Structure

```text
gitops/
├── README.md
├── apps/
│   └── opspulse/
│       ├── base/
│       └── overlays/
│           └── bare-metal/
├── platform/
│   └── argocd/
│       ├── install/
│       └── applications/
└── bootstrap/
    └── root-application.yaml
```

Existing chart values remain in:

- `platform/monitoring/values.yaml`
- `platform/logging/loki-values.yaml`
- `platform/logging/alloy-values.yaml`

## Argo CD Architecture

Argo CD runs inside K3s in the `argocd` namespace. The Phase 9 install is non-HA and resource-conscious for the Raspberry Pi cluster:

- one `argocd-server`
- one `argocd-repo-server`
- one `argocd-application-controller`
- one Redis instance
- Dex scaled to zero
- heavier components scheduled on `homepi`

Argo CD is not publicly exposed. Use port-forwarding for UI/API access.

## Application-Of-Applications

`gitops/bootstrap/root-application.yaml` manages child Applications from `gitops/platform/argocd/applications`:

- `opspulse`
- `monitoring`
- `monitoring-extras`
- `loki`
- `alloy`
- `logging-extras`

OpsPulse is managed with Kustomize. Monitoring, Loki, and Alloy remain Helm-backed with pinned chart versions.

## Sync Policy

Child Applications enable:

- `automated`: Argo CD reconciles without manual sync clicks.
- `selfHeal`: live drift is corrected back to Git desired state.
- `prune`: Git-removed resources are removed from the cluster when they are owned by the scoped Application.

Prune is scoped by narrow Application paths and namespaces. The OpsPulse Application must not own `kube-system`, `argocd`, or unrelated infrastructure resources.

## Ownership Boundaries

GitOps managed:

- OpsPulse namespace resources
- OpsPulse web/API Deployments, Services, ConfigMaps, RBAC
- OpsPulse API ServiceMonitor
- monitoring Helm release
- monitoring dashboards and alert rules
- Loki and Alloy Helm releases
- logging dashboards and Grafana datasource

Not GitOps managed:

- physical Raspberry Pi provisioning
- K3s installation
- node OS configuration
- SSH configuration
- K3s bootstrap/join credentials
- kubeconfigs and service account tokens
- Argo CD admin password
- GitHub credentials

## Failure Behavior

Argo CD is a delivery and reconciliation controller. Existing workloads continue running if Argo CD is unavailable. OpsPulse GitOps status degrades gracefully when the Argo CD Application CRD cannot be read.

## Related Docs

- [Bootstrap](bootstrap.md)
- [Deployment Workflow](deployment-workflow.md)
- [Rollback](rollback.md)
