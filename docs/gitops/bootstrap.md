# GitOps Bootstrap

This document describes bootstrapping GitOps-managed platform workloads after Argo CD is installed.

## Install Argo CD

Install Argo CD with the resource-conscious Kustomize install:

```bash
sudo k3s kubectl apply -k gitops/platform/argocd/install
sudo k3s kubectl get pods -n argocd -o wide
```

Argo CD itself is not managed by the root Application in this phase. This avoids a self-management loop during initial bootstrap.

## Access Argo CD

Use port-forwarding:

```bash
sudo k3s kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Retrieve the initial admin password only from the cluster:

```bash
sudo k3s kubectl get secret argocd-initial-admin-secret -n argocd -o jsonpath='{.data.password}' | base64 -d
```

Do not commit this password.

## Bootstrap Platform Applications

Apply the root Application:

```bash
sudo k3s kubectl apply -f gitops/bootstrap/root-application.yaml
sudo k3s kubectl get applications -n argocd
```

The root Application points to `gitops/platform/argocd/applications`, which creates the child Applications.

## Verification

```bash
sudo k3s kubectl get application opspulse -n argocd
sudo k3s kubectl get application monitoring -n argocd
sudo k3s kubectl get application loki -n argocd
sudo k3s kubectl get application alloy -n argocd
sudo k3s kubectl get pods -n opspulse
```

This bootstrap does not provision physical hosts, install K3s, configure SSH, or manage node operating systems.
