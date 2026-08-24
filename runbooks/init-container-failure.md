<!-- category: Workload Health -->
<!-- signals: Init:CrashLoopBackOff, init container restart, init failure logs -->
<!-- last_updated: 2026-08-23 -->
<!-- reproducible: true -->
<!-- reproduction_command: ./scripts/incidents/incident.sh init-container-failure -->
<!-- cleanup_command: ./scripts/incidents/cleanup.sh init-container-failure -->
<!-- expected_signals: Init:CrashLoopBackOff, init logs, main container not started -->
# Runbook: Init Container Failure

## Purpose

Investigate a Pod blocked because an init container fails repeatedly.

## Symptoms

- Pod status shows `Init:CrashLoopBackOff` or init failure state.
- Main application container never starts.
- Init container logs explain the failure.

## Impact

The workload is unavailable because initialization cannot complete.

## Initial Checks

- Inspect init container command, image, and logs.
- Confirm dependencies expected by the init container exist.

## Diagnostic Commands

```bash
sudo k3s kubectl describe pod -n <namespace> <pod>
sudo k3s kubectl logs -n <namespace> <pod> -c <init-container> --previous
sudo k3s kubectl get events -n <namespace> --sort-by=.lastTimestamp
```

## Likely Causes

- Init command exits non-zero.
- Required config, network, or dependency is unavailable.
- Init image or permissions are incorrect.

## Remediation

- Correct the init command or dependency.
- Roll out the fixed workload.
- Keep initialization small and observable.

## Verification

```bash
sudo k3s kubectl get pods -n <namespace>
sudo k3s kubectl logs -n <namespace> <pod> -c <container>
```

## Escalation

Escalate if init failures block critical platform components.

## Prevention

- Test init containers independently.
- Keep init dependencies explicit and monitored.

## Reproduction / Validation

This incident can be safely reproduced using the OpsPulse incident framework.

Reproduction commands are intended only for the dedicated OpsPulse test namespace and must not be applied directly to production workloads.

```bash
./scripts/incidents/incident.sh init-container-failure
```

Expected observations:

- Init container enters `CrashLoopBackOff`.
- Main container never starts.
- Init logs contain deterministic failure text.
- OpsPulse surfaces correlated signals.

Cleanup:

```bash
./scripts/incidents/cleanup.sh init-container-failure
```
