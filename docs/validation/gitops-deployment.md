# TEST-015 - Git-Driven Deployment

Status: Not executed on live cluster.

## Goal

Validate that a Git image tag change drives an Argo CD sync and Kubernetes rolling update.

## Planned Exercise

Change a safe image tag in:

```text
gitops/apps/opspulse/overlays/bare-metal/kustomization.yaml
```

Expected:

```text
Git image update
-> Argo detects revision
-> Argo syncs
-> Kubernetes rolling update occurs
-> new image becomes Ready
-> previous ReplicaSet remains available for history
-> Argo returns Synced/Healthy
```

## Evidence To Capture

- Git commit hash
- Argo Application revision
- rollout status
- running image
- final health state
