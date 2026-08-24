<!-- category: Scheduling -->
<!-- signals: ResourceQuota exceeded, admission failure -->
<!-- last_updated: 2026-08-23 -->
<!-- reproducible: true -->
<!-- reproduction_command: ./scripts/incidents/incident.sh resource-quota -->
<!-- cleanup_command: ./scripts/incidents/cleanup.sh resource-quota -->
<!-- expected_signals: quota exceeded, API admission error, ResourceQuota metrics -->
# Runbook: Resource Quota Failure

## Purpose

Investigate workloads rejected or blocked by namespace ResourceQuota.

## Symptoms

- Kubernetes API reports quota exceeded.
- Workload cannot be created or scaled.
- ResourceQuota used/hard values show no remaining capacity.

## Impact

New Pods or workload changes may be blocked in the namespace.

## Initial Checks

- Inspect ResourceQuota in the affected namespace.
- Compare requested resources with hard limits.

## Diagnostic Commands

```bash
sudo k3s kubectl get resourcequota -n <namespace> -o yaml
sudo k3s kubectl describe resourcequota -n <namespace>
sudo k3s kubectl get events -n <namespace> --sort-by=.lastTimestamp
```

## Likely Causes

- Quota too small for requested workload.
- Old resources consume quota.
- Requests/limits increased without quota review.

## Remediation

- Remove unused resources.
- Reduce requests where appropriate.
- Increase quota only through a controlled capacity change.

## Verification

```bash
sudo k3s kubectl describe resourcequota -n <namespace>
sudo k3s kubectl get pods -n <namespace>
```

## Escalation

Escalate if quota prevents recovery of production services.

## Prevention

- Track quota consumption during deployments.
- Keep namespace quotas aligned with expected workload size.

## Reproduction / Validation

This incident can be safely reproduced using the OpsPulse incident framework.

Reproduction commands are intended only for the dedicated OpsPulse test namespace and must not be applied directly to production workloads.

```bash
./scripts/incidents/incident.sh resource-quota
```

Expected observations:

- ResourceQuota in `opspulse-chaos` blocks Pod admission.
- Kubernetes API reports quota exceeded.
- OpsPulse surfaces quota or scheduling evidence.

Cleanup:

```bash
./scripts/incidents/cleanup.sh resource-quota
```
