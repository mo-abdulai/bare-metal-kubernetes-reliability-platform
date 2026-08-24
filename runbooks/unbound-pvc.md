<!-- category: Storage -->
<!-- signals: unbound PVC, Pending PVC, FailedScheduling -->
<!-- last_updated: 2026-08-23 -->
<!-- reproducible: true -->
<!-- reproduction_command: ./scripts/incidents/incident.sh unbound-pvc -->
<!-- cleanup_command: ./scripts/incidents/cleanup.sh unbound-pvc -->
<!-- expected_signals: PVC Pending, Pod Pending, unbound immediate PersistentVolumeClaims -->
# Runbook: Unbound PVC

## Purpose

Investigate a Pod that cannot start because its PersistentVolumeClaim remains unbound.

## Symptoms

- PVC phase is `Pending`.
- Pod remains `Pending`.
- Events mention unbound PVCs or missing storage class.

## Impact

The workload cannot start because required storage is unavailable.

## Initial Checks

- Inspect PVC, StorageClass, and events.
- Confirm the requested storage class exists.

## Diagnostic Commands

```bash
sudo k3s kubectl get pvc -n <namespace>
sudo k3s kubectl describe pvc -n <namespace> <pvc>
sudo k3s kubectl describe pod -n <namespace> <pod>
sudo k3s kubectl get storageclass
```

## Likely Causes

- StorageClass does not exist.
- Dynamic provisioner is unavailable.
- Requested access mode or size cannot be satisfied.

## Remediation

- Correct the StorageClass reference.
- Restore the provisioner.
- Adjust requested storage only after confirming workload needs.

## Verification

```bash
sudo k3s kubectl get pvc -n <namespace>
sudo k3s kubectl get pods -n <namespace>
```

## Escalation

Escalate if persistent storage failures affect stateful production workloads.

## Prevention

- Validate PVC and StorageClass references before deployment.
- Monitor provisioner health.

## Reproduction / Validation

This incident can be safely reproduced using the OpsPulse incident framework.

Reproduction commands are intended only for the dedicated OpsPulse test namespace and must not be applied directly to production workloads.

```bash
./scripts/incidents/incident.sh unbound-pvc
```

Expected observations:

- PVC remains `Pending`.
- Pod remains `Pending`.
- Kubernetes events mention unbound PVC or missing StorageClass.
- OpsPulse surfaces storage-related signals.

Cleanup:

```bash
./scripts/incidents/cleanup.sh unbound-pvc
```
