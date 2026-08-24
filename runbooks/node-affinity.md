<!-- category: Scheduling -->
<!-- signals: FailedScheduling, node affinity mismatch, Pod Pending -->
<!-- last_updated: 2026-08-23 -->
<!-- reproducible: true -->
<!-- reproduction_command: ./scripts/incidents/incident.sh node-affinity -->
<!-- cleanup_command: ./scripts/incidents/cleanup.sh node-affinity -->
<!-- expected_signals: Pod Pending, FailedScheduling event, affinity mismatch -->
# Runbook: Node Affinity Failure

## Purpose

Investigate a Pod that cannot schedule because required node affinity cannot be satisfied.

## Symptoms

- Pod remains `Pending`.
- Events mention node affinity or selector mismatch.
- No container starts.

## Impact

The workload has no running replica.

## Initial Checks

- Inspect node affinity and node labels.
- Confirm whether affinity is required or preferred.

## Diagnostic Commands

```bash
sudo k3s kubectl describe pod -n <namespace> <pod>
sudo k3s kubectl get nodes --show-labels
sudo k3s kubectl get events -n <namespace> --sort-by=.lastTimestamp
```

## Likely Causes

- Required node label does not exist.
- Workload targets the wrong architecture or node role.
- Node labels changed without updating workloads.

## Remediation

- Correct affinity requirements.
- Add labels only through an approved change when the label is real and intentional.
- Prefer soft affinity when strict placement is not required.

## Verification

```bash
sudo k3s kubectl get pods -n <namespace> -o wide
```

## Escalation

Escalate if critical workloads cannot schedule on any node.

## Prevention

- Keep node label conventions documented.
- Validate scheduling constraints before deployment.

## Reproduction / Validation

This incident can be safely reproduced using the OpsPulse incident framework.

Reproduction commands are intended only for the dedicated OpsPulse test namespace and must not be applied directly to production workloads.

```bash
./scripts/incidents/incident.sh node-affinity
```

Expected observations:

- Pod remains `Pending`.
- Scheduler event reports affinity mismatch.
- OpsPulse surfaces scheduling evidence.

Cleanup:

```bash
./scripts/incidents/cleanup.sh node-affinity
```
