<!-- category: Scheduling -->
<!-- signals: FailedScheduling, insufficient CPU, insufficient memory, Pod Pending -->
<!-- last_updated: 2026-08-23 -->
<!-- reproducible: true -->
<!-- reproduction_command: ./scripts/incidents/incident.sh insufficient-resources -->
<!-- cleanup_command: ./scripts/incidents/cleanup.sh insufficient-resources -->
<!-- expected_signals: Pod Pending, insufficient resources event, no resource consumption -->
# Runbook: Insufficient Resources

## Purpose

Investigate a Pod that cannot schedule because its resource requests exceed available node capacity.

## Symptoms

- Pod remains `Pending`.
- Scheduler events mention insufficient CPU or memory.
- No container starts.

## Impact

The workload has no available Pod until scheduling constraints are corrected.

## Initial Checks

- Compare Pod requests with node allocatable resources.
- Confirm whether the request is realistic.

## Diagnostic Commands

```bash
sudo k3s kubectl describe pod -n <namespace> <pod>
sudo k3s kubectl describe nodes
sudo k3s kubectl get events -n <namespace> --sort-by=.lastTimestamp
```

## Likely Causes

- Requests are too high.
- Cluster capacity is insufficient.
- Too many workloads are already scheduled.

## Remediation

- Lower unrealistic requests.
- Move non-critical workloads.
- Add capacity only through planned infrastructure changes.

## Verification

```bash
sudo k3s kubectl get pods -n <namespace> -o wide
sudo k3s kubectl top nodes
```

## Escalation

Escalate if critical workloads cannot schedule after request correction.

## Prevention

- Review resource requests for Raspberry Pi capacity.
- Validate scheduling in test namespaces.

## Reproduction / Validation

This incident can be safely reproduced using the OpsPulse incident framework.

Reproduction commands are intended only for the dedicated OpsPulse test namespace and must not be applied directly to production workloads.

```bash
./scripts/incidents/incident.sh insufficient-resources
```

Expected observations:

- Pod stays `Pending`.
- Scheduler event reports insufficient CPU or memory.
- The requested resources are never consumed because the Pod does not schedule.

Cleanup:

```bash
./scripts/incidents/cleanup.sh insufficient-resources
```
