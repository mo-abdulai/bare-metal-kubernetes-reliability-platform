<!-- category: Configuration -->
<!-- signals: CreateContainerConfigError, missing Secret -->
<!-- last_updated: 2026-08-23 -->
<!-- reproducible: true -->
<!-- reproduction_command: ./scripts/incidents/incident.sh missing-secret -->
<!-- cleanup_command: ./scripts/incidents/cleanup.sh missing-secret -->
<!-- expected_signals: CreateContainerConfigError, missing Secret event -->
# Runbook: Missing Secret

## Purpose

Investigate a workload that references a Secret that does not exist.

## Symptoms

- Pod waits with `CreateContainerConfigError`.
- Events name a missing Secret.
- Container does not start.

## Impact

The workload cannot start until required secret material is present.

## Initial Checks

- Identify the referenced Secret name.
- Confirm it belongs in the workload namespace.
- Do not print secret values.

## Diagnostic Commands

```bash
sudo k3s kubectl describe pod -n <namespace> <pod>
sudo k3s kubectl get secret -n <namespace>
sudo k3s kubectl get events -n <namespace> --sort-by=.lastTimestamp
```

## Likely Causes

- Secret was not created.
- Secret name or namespace is incorrect.
- Deployment order skipped secret provisioning.

## Remediation

- Create or restore the expected Secret through the approved secret workflow.
- Correct workload references.
- Restart or roll out the workload after the Secret exists.

## Verification

```bash
sudo k3s kubectl get pods -n <namespace>
sudo k3s kubectl describe pod -n <namespace> <pod>
```

## Escalation

Escalate if missing credentials affect production service availability.

## Prevention

- Validate Secret references without exposing values.
- Keep secret creation documented and repeatable.

## Reproduction / Validation

This incident can be safely reproduced using the OpsPulse incident framework.

Reproduction commands are intended only for the dedicated OpsPulse test namespace and must not be applied directly to production workloads.

```bash
./scripts/incidents/incident.sh missing-secret
```

Expected observations:

- Pod waits with `CreateContainerConfigError`.
- Event text identifies the missing Secret.
- No real Secret is referenced.
- OpsPulse surfaces Kubernetes event evidence.

Cleanup:

```bash
./scripts/incidents/cleanup.sh missing-secret
```
