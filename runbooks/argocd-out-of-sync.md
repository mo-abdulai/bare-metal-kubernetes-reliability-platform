<!-- category: GitOps -->
<!-- signals: Argo CD OutOfSync, configuration drift, self-heal -->
<!-- last_updated: 2026-08-24 -->
# Runbook: Argo CD OutOfSync

## Purpose

Investigate an Argo CD Application whose live Kubernetes state differs from the desired state in Git.

## Symptoms

- Argo CD reports `OutOfSync`.
- OpsPulse GitOps page shows a non-synced Application.
- A GitOps-owned resource has been manually changed or Git contains unapplied desired state.

## Impact

Git is no longer matching the cluster for the affected Application. If self-heal is enabled, Argo CD should restore the live object to Git state.

## Initial Checks

- Confirm which Application is `OutOfSync`.
- Identify whether the drift was a manual cluster change or a new Git revision.
- Confirm the Application destination namespace is scoped to the expected resources.

## Diagnostic Commands

```bash
sudo k3s kubectl get applications -n argocd
sudo k3s kubectl describe application opspulse -n argocd
sudo k3s kubectl get deployment opspulse-web -n opspulse -o yaml
sudo k3s kubectl get events -n argocd --sort-by=.lastTimestamp
```

## Likely Causes

- Manual `kubectl edit`, `scale`, or `apply` drifted a GitOps-owned resource.
- A Git commit changed desired state and Argo CD has not reconciled yet.
- Argo CD cannot render manifests due to invalid Kustomize, Helm, or repository configuration.
- The target branch or path is incorrect.

## Remediation

- If drift was manual and Git is correct, allow self-heal to restore the resource.
- If Git is wrong, fix Git and push a corrective commit.
- If Argo cannot render, correct the Kustomize or Helm configuration.
- Avoid manual `kubectl apply` except for emergency/debugging paths.

## Verification

```bash
sudo k3s kubectl get application opspulse -n argocd -o jsonpath='{.status.sync.status}{" "}{.status.health.status}{"\n"}'
sudo k3s kubectl rollout status deployment/opspulse-web -n opspulse
```

## Escalation

Escalate if self-heal repeatedly fails or the drift affects monitoring, logging, or OpsPulse availability.

## Prevention

- Use Git commits and pull requests for normal delivery.
- Keep Argo Applications narrowly scoped.
- Review prune/self-heal behavior before adding new resource paths.
