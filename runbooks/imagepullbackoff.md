<!-- category: Workload Health -->
<!-- signals: ImagePullBackOff, ErrImagePull, failed image pull -->
<!-- last_updated: 2026-08-23 -->
<!-- reproducible: true -->
<!-- reproduction_command: ./scripts/incidents/incident.sh imagepullbackoff -->
<!-- cleanup_command: ./scripts/incidents/cleanup.sh imagepullbackoff -->
<!-- expected_signals: ErrImagePull, ImagePullBackOff, Kubernetes Warning events -->
# Runbook: ImagePullBackOff

## Purpose

Investigate a workload that cannot pull its container image.

## Symptoms

- Pod status shows `ErrImagePull` or `ImagePullBackOff`.
- Kubernetes events report failed image pull attempts.
- The container never starts.

## Impact

The workload is unavailable because no runnable container image is present on the node.

## Initial Checks

- Confirm the image name, tag, and registry path.
- Check whether the failure is isolated to one workload.
- Confirm image pull secrets only when the workload intentionally uses private images.

## Diagnostic Commands

```bash
sudo k3s kubectl get pods -n <namespace>
sudo k3s kubectl describe pod -n <namespace> <pod>
sudo k3s kubectl get events -n <namespace> --sort-by=.lastTimestamp
```

## Likely Causes

- Image tag does not exist.
- Registry hostname is incorrect.
- Private image pull secret is missing or invalid.
- Node cannot reach the registry.

## Remediation

- Correct the image reference.
- Publish the missing image tag.
- Fix image pull secret configuration for private images.

## Verification

```bash
sudo k3s kubectl rollout status deployment/<deployment> -n <namespace>
sudo k3s kubectl get pods -n <namespace>
```

## Escalation

Escalate if multiple workloads cannot pull images from a registry that should be available.

## Prevention

- Validate image tags before deployment.
- Keep registry credentials scoped and rotated.

## Reproduction / Validation

This incident can be safely reproduced using the OpsPulse incident framework.

Reproduction commands are intended only for the dedicated OpsPulse test namespace and must not be applied directly to production workloads.

```bash
./scripts/incidents/incident.sh imagepullbackoff
```

Expected observations:

- Pod enters `ErrImagePull` or `ImagePullBackOff`.
- Kubernetes Warning events explain the failed pull.
- Prometheus waiting reason metrics reflect image pull state.
- OpsPulse surfaces correlated signals.

Cleanup:

```bash
./scripts/incidents/cleanup.sh imagepullbackoff
```
