# GitOps Rollback

Rollback is Git-based. Do not rely on `kubectl rollout undo` as the normal path for GitOps-owned workloads.

## Process

1. Identify the problematic Git revision.
2. Revert the Git commit or restore the previous image tag.
3. Push the rollback commit.
4. Let Argo CD reconcile.
5. Verify the Deployment rollout.
6. Verify OpsPulse health.
7. Inspect metrics, logs, and events.

## Commands

```bash
git log --oneline -- gitops/apps/opspulse/overlays/bare-metal/kustomization.yaml
git revert <commit>
git push
sudo k3s kubectl get application opspulse -n argocd
sudo k3s kubectl rollout status deployment/opspulse-web -n opspulse
sudo k3s kubectl get pods -n opspulse -o wide
```

## Verification

Confirm:

- Argo CD reports `Synced`.
- Argo CD reports `Healthy`.
- the restored image tag is running.
- Prometheus, Loki, Alertmanager, and OpsPulse remain healthy.
