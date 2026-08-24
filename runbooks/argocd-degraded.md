<!-- category: GitOps -->
<!-- signals: Argo CD Degraded, sync failed, health degraded -->
<!-- last_updated: 2026-08-24 -->
# Runbook: Argo CD Degraded

## Purpose

Investigate an Argo CD Application that reconciled or attempted to reconcile but reports degraded health.

## Symptoms

- Argo CD reports `Degraded`, `Missing`, or failed operation state.
- Kubernetes shows rollout failures such as unavailable replicas or `ImagePullBackOff`.
- OpsPulse shows a GitOps signal or incident candidate.

## Impact

The desired state may not be running successfully. Depending on the resource, platform visibility, logging, or OpsPulse availability may be impaired.

## Initial Checks

- Identify the degraded Application and namespace.
- Inspect Argo operation state.
- Inspect Kubernetes Deployments, Pods, and events in the destination namespace.

## Diagnostic Commands

```bash
sudo k3s kubectl get applications -n argocd
sudo k3s kubectl describe application <application> -n argocd
sudo k3s kubectl get pods -n <namespace> -o wide
sudo k3s kubectl get events -n <namespace> --sort-by=.lastTimestamp
```

## Likely Causes

- Bad image tag or unsupported image architecture.
- Resource requests are too high for the Raspberry Pi nodes.
- Missing CRD or Helm chart rendering failure.
- Probe failure, crash loop, or unavailable dependency.

## Remediation

- Fix the Git desired state and push the correction.
- Use a Git revert for unwanted image/configuration changes.
- Confirm ARM64 image compatibility before retrying.
- Reduce resource requests only when cluster pressure evidence supports it.

## Verification

```bash
sudo k3s kubectl get application <application> -n argocd -o jsonpath='{.status.sync.status}{" "}{.status.health.status}{"\n"}'
sudo k3s kubectl get pods -n <namespace>
```

## Escalation

Escalate if the degraded Application owns monitoring, logging, or the OpsPulse API and remains degraded after a corrective Git commit.

## Prevention

- Pin image versions.
- Validate Kustomize and Helm rendering before merge.
- Keep resource requests conservative for `workpi`.
