# Loki Ingestion Validation

## Objective

Confirm Loki receives real logs from OpsPulse workloads, logs from both node placements where applicable, and Kubernetes events from Alloy.

## Sources

- `opspulse-api` pod logs
- `opspulse-web` pod logs
- Kubernetes events
- Grafana Explore
- Loki datasource `Loki`

## Procedure

1. Deploy logging:

```bash
make deploy-logging
```

Run this from a shell where both `kubectl` and `helm` can reach the K3s API, such as on `homepi` or from a workstation kubeconfig pointed at the real cluster endpoint.

2. Confirm logging pods:

```bash
ssh mo-abdulai@homepi.local sudo k3s kubectl get pods -n logging -o wide
```

3. Query labels in Grafana Explore:

```logql
{namespace="opspulse", app="opspulse-api"}
```

```logql
{namespace="opspulse", app="opspulse-web"}
```

```logql
{source="event", job="kubernetes-events"} | json
```

4. Confirm logs from pods scheduled on both nodes when workload placement includes both `homepi` and `workpi`:

```logql
{namespace="opspulse", node="homepi"}
```

```logql
{namespace="opspulse", node="workpi"}
```

## Evidence

Pending post-deployment validation. Do not mark this test passed until Grafana Explore or Loki API output is captured from the live cluster.

## Result

Pending.
