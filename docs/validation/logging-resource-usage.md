# Logging Resource Usage Validation

## Objective

Confirm Loki and Alloy do not destabilize the two-node Raspberry Pi K3s cluster after deployment.

## Preflight Evidence

Captured on 2026-08-23 before deploying Phase 7 logging:

```text
NAME     CPU(cores)   CPU(%)   MEMORY(bytes)   MEMORY(%)
homepi   572m         14%      2815Mi          36%
workpi   153m         3%       527Mi           58%
```

Storage inspection showed `local-path` as the default StorageClass and one existing `4Gi` Prometheus PVC in the `monitoring` namespace.

`homepi` root/K3s storage inspection showed about `15Gi` free out of `29Gi`:

```text
Filesystem      Size  Used Avail Use% Mounted on
/dev/mmcblk0p2   29G   13G   15G  47% /
```

## Procedure

1. Deploy logging.
2. Inspect pods, restarts, and placement:

```bash
ssh mo-abdulai@homepi.local sudo k3s kubectl get pods -n logging -o wide
```

3. Inspect resource usage:

```bash
ssh mo-abdulai@homepi.local sudo k3s kubectl top nodes
ssh mo-abdulai@homepi.local sudo k3s kubectl top pods -n logging
```

4. Inspect disk/PVC:

```bash
ssh mo-abdulai@homepi.local sudo k3s kubectl get pvc -n logging
```

5. Inspect OOMKilled and warning events:

```bash
ssh mo-abdulai@homepi.local sudo k3s kubectl get events -A --sort-by=.lastTimestamp
```

## Result

Pending post-deployment validation.
