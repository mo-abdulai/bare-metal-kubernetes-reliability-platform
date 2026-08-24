# GitOps Deployment Workflow

Normal delivery flow:

```text
1. Change manifest/image version
2. Review git diff
3. Commit
4. Push
5. Argo detects revision
6. Argo syncs
7. Kubernetes rolls out
8. Health validated
```

## Image Update Example

Update the explicit image tag in:

```text
gitops/apps/opspulse/overlays/bare-metal/kustomization.yaml
```

Example:

```yaml
images:
  - name: opspulse-web
    newName: nurud43/opspulse-web
    newTag: v0.1.6
```

Then:

```bash
git diff
git add gitops/apps/opspulse/overlays/bare-metal/kustomization.yaml
git commit -m "Update OpsPulse web image"
git push
```

## Verify Argo CD

```bash
sudo k3s kubectl get application opspulse -n argocd
sudo k3s kubectl describe application opspulse -n argocd
sudo k3s kubectl rollout status deployment/opspulse-web -n opspulse
sudo k3s kubectl get deployment opspulse-web -n opspulse -o jsonpath='{.spec.template.spec.containers[0].image}{"\n"}'
```

Manual `kubectl apply` is non-standard for GitOps-owned resources and should be reserved for emergency/debugging cases.
