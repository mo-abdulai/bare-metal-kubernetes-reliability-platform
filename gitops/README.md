# GitOps Layout

This directory contains the declarative delivery configuration for Phase 9.

```text
gitops/
├── apps/opspulse/              # OpsPulse Kustomize base and bare-metal overlay
├── platform/argocd/            # Argo CD install and child Applications
└── bootstrap/root-application.yaml
```

Bootstrap flow:

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

`root-application.yaml` points at `gitops/platform/argocd/applications`, which defines child Applications for OpsPulse, monitoring, Loki, Alloy, and supporting monitoring/logging extras.

The OpsPulse app uses Kustomize. Monitoring and logging keep their existing Helm charts and pinned versions, with values sourced from `platform/monitoring` and `platform/logging`.
