# Argo CD GitOps Control Plane

Argo CD is installed in the `argocd` namespace using the official upstream install manifest through Kustomize:

```bash
sudo k3s kubectl apply -k gitops/platform/argocd/install
```

The install is intentionally non-HA for the two-node Raspberry Pi K3s cluster:

- one `argocd-server`
- one `argocd-repo-server`
- one `argocd-application-controller`
- one Redis instance
- Dex scaled to zero because SSO is not part of Phase 9
- heavier components pinned to `homepi`

Argo CD is not publicly exposed. Use port-forwarding:

```bash
sudo k3s kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Initial admin password retrieval, if using the default admin account:

```bash
sudo k3s kubectl get secret argocd-initial-admin-secret -n argocd -o jsonpath='{.data.password}' | base64 -d
```

Do not commit the password or repository credentials.
