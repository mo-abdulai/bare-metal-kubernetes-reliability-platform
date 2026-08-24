<!-- category: Configuration -->
<!-- signals: CreateContainerConfigError, missing ConfigMap -->
<!-- last_updated: 2026-08-23 -->
<!-- reproducible: true -->
<!-- reproduction_command: ./scripts/incidents/incident.sh missing-configmap -->
<!-- cleanup_command: ./scripts/incidents/cleanup.sh missing-configmap -->
<!-- expected_signals: CreateContainerConfigError, missing ConfigMap event -->
# Runbook: Missing ConfigMap

## Purpose

Investigate a workload that references a ConfigMap that does not exist.

## Symptoms

- Pod waits with `CreateContainerConfigError`.
- Events name a missing ConfigMap.
- Container does not start.

## Impact

The workload cannot start until configuration exists.

## Initial Checks

- Identify the referenced ConfigMap.
- Confirm namespace and name match the manifest.

## Diagnostic Commands

```bash
sudo k3s kubectl describe pod -n <namespace> <pod>
sudo k3s kubectl get configmap -n <namespace>
sudo k3s kubectl get events -n <namespace> --sort-by=.lastTimestamp
```

## Likely Causes

- ConfigMap was not applied.
- ConfigMap name or namespace is incorrect.
- Deployment order skipped configuration resources.

## Remediation

- Apply the required ConfigMap.
- Correct the reference in the workload manifest.
- Roll out the workload after configuration exists.

## Verification

```bash
sudo k3s kubectl get pods -n <namespace>
sudo k3s kubectl describe pod -n <namespace> <pod>
```

## Escalation

Escalate if missing configuration affects multiple application components.

## Prevention

- Deploy configuration before workloads.
- Validate references during manifest review.

## Reproduction / Validation

This incident can be safely reproduced using the OpsPulse incident framework.

Reproduction commands are intended only for the dedicated OpsPulse test namespace and must not be applied directly to production workloads.

```bash
./scripts/incidents/incident.sh missing-configmap
```

Expected observations:

- Pod waits with `CreateContainerConfigError`.
- Event text identifies the missing ConfigMap.
- OpsPulse surfaces Kubernetes event evidence.

Cleanup:

```bash
./scripts/incidents/cleanup.sh missing-configmap
```
