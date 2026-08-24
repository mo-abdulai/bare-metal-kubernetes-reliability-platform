# TEST-016 - GitOps Rollback

Status: Not executed on live cluster.

## Goal

Validate that rollback is performed through Git and reconciled by Argo CD.

## Planned Exercise

Use `git revert` or restore the previous image tag in Git, then push.

Expected:

```text
Git revert
-> Argo detects rollback desired state
-> Kubernetes rolls back workload
-> previous version is restored
-> Argo returns Synced/Healthy
```

## Evidence To Capture

- unwanted version
- revert commit
- Argo sync status
- restored image
- application health
