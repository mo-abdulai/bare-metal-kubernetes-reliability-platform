<!-- category: Scheduling -->
<!-- signals: FailedScheduling, Pod Pending -->
<!-- last_updated: 2026-08-23 -->
# Runbook: Pod Pending

## Purpose

Investigate a Pod that cannot be scheduled or started.

## Symptoms

- Pod remains `Pending`.
- Events show `FailedScheduling`.
- Resources or node selectors prevent placement.

## Impact

The owning workload may have reduced or zero available replicas.

## Initial Checks

- Check scheduling events.
- Confirm node resources and node selectors.

## Diagnostic Commands

```bash
sudo k3s kubectl describe pod -n <namespace> <pod>
sudo k3s kubectl get nodes -o wide
sudo k3s kubectl top nodes
```

## Likely Causes

- Insufficient CPU or memory.
- PVC binding issue.
- Node selector cannot be satisfied.

## Remediation

- Free resources or reduce requests.
- Correct node selectors.
- Confirm PVC and StorageClass state.

## Verification

```bash
sudo k3s kubectl get pods -n <namespace> -o wide
```

## Escalation

Escalate if core monitoring or OpsPulse workloads cannot schedule.

## Prevention

- Keep requests conservative on `workpi`.
