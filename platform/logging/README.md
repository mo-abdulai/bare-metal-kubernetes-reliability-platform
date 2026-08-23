# OpsPulse Logging

Phase 7 adds centralized operational logs and Kubernetes event correlation with Grafana Loki, Grafana Alloy, and Grafana.

## Components

- Namespace: `logging`
- Loki chart: `grafana/loki` `7.3.0`
- Alloy chart: `grafana/alloy` `1.11.1`
- Loki mode: `SingleBinary`
- Loki replicas: `1`
- Loki PVC: `2Gi` on `local-path`
- Retention: `48h`
- Loki placement: `homepi`
- Alloy placement: one Deployment on `homepi`

Alloy uses the Kubernetes API for pod log collection through `loki.source.kubernetes`, so it can collect logs from pods on both nodes without hostPath log mounts, privileged containers, or a DaemonSet on memory-constrained `workpi`.

## Install

```bash
kubectl apply -f platform/logging/namespace.yaml
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
helm upgrade --install loki grafana/loki \
  --version 7.3.0 \
  --namespace logging \
  --values platform/logging/loki-values.yaml
helm upgrade --install alloy grafana/alloy \
  --version 1.11.1 \
  --namespace logging \
  --values platform/logging/alloy-values.yaml
kubectl apply -f platform/logging/dashboards/opspulse-logs-events-dashboard.yaml
```

## Queries

Use Grafana Explore with the Loki datasource. Start with:

```logql
{namespace="opspulse", app="opspulse-api"}
```

```logql
{namespace="opspulse", app="opspulse-web"}
```

```logql
{source="event", job="kubernetes-events"} | json
```

See [LogQL documentation](../../docs/observability/logql.md) for the tested query set.
