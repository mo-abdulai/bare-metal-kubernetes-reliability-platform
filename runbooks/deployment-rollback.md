<!-- category: GitOps -->
<!-- signals: rollback, bad deployment, Git revert -->
<!-- last_updated: 2026-08-24 -->
# Runbook: Deployment Rollback

## Purpose

Roll back an unwanted deployment using Git as the source of truth.

## Symptoms

- A new image or configuration causes degraded health.
- Argo CD reports a failed or degraded Application.
- Kubernetes rollout stalls or Pods fail readiness.

## Impact

The affected workload may be unavailable or running reduced capacity until Git desired state is restored.

## Initial Checks

- Identify the Git revision that introduced the unwanted change.
- Confirm the currently running image and previous known-good image.
- Confirm Argo CD is reconciling the expected branch.

## Diagnostic Commands

```bash
git log --oneline -- gitops/apps/opspulse/overlays/bare-metal/kustomization.yaml
sudo k3s kubectl get application opspulse -n argocd -o yaml
sudo k3s kubectl rollout history deployment/opspulse-web -n opspulse
sudo k3s kubectl get deployment opspulse-web -n opspulse -o jsonpath='{.spec.template.spec.containers[0].image}{"\n"}'
```

## Likely Causes

- Bad image tag.
- Manifest change that changed probes, resources, labels, or service selectors incorrectly.
- Configuration change that broke startup or readiness.

## Remediation

- Revert the Git commit or restore the previous image tag in Git.
- Commit and push the rollback.
- Let Argo CD reconcile the rollback.
- Do not use `kubectl rollout undo` as the primary rollback path for GitOps-owned workloads.

## Verification

```bash
sudo k3s kubectl get application opspulse -n argocd -o jsonpath='{.status.sync.status}{" "}{.status.health.status}{"\n"}'
sudo k3s kubectl rollout status deployment/opspulse-web -n opspulse
sudo k3s kubectl get pods -n opspulse -o wide
```

## Escalation

Escalate if the Git rollback is pushed but Argo CD cannot sync or the previous version does not become healthy.

## Prevention

- Use explicit image tags.
- Keep deployment changes small and reviewable.
- Validate rollback during Phase 9 GitOps exercises.
