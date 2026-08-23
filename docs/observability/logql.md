# LogQL

These queries match the labels configured in `platform/logging/alloy-values.yaml`. Validate them in Grafana Explore after `make deploy-logging`.

## OpsPulse API errors

```logql
{namespace="opspulse", app="opspulse-api"} |~ "(?i)(error|failed|failure|timeout|unavailable|exception)"
```

## Next.js backend errors

```logql
{namespace="opspulse", app="opspulse-web"} |~ "(?i)(error|failed|failure|timeout|unavailable|exception)"
```

## Kubernetes Warning events

```logql
{source="event", job="kubernetes-events"} | json | type="Warning"
```

## Logs from workpi

```logql
{namespace="opspulse", node="workpi"}
```

## Logs for a specific Pod

```logql
{namespace="opspulse", pod="opspulse-api-REPLACE_ME"}
```

## Pod logs by container

```logql
{namespace="opspulse", container=~"opspulse-api|opspulse-web"}
```

## Loki ingestion health

```logql
{namespace="logging", app=~"loki|alloy"}
```

## Event correlation workflow

1. Start from a Prometheus metric panel such as API 5xx rate, pod restarts, or node filesystem usage.
2. Note the namespace, pod, container, or node label.
3. Open the `OpsPulse — Logs & Events` dashboard.
4. Filter by the same namespace, pod, container, or node.
5. Check Kubernetes warnings with:

```logql
{source="event", job="kubernetes-events"} | json | type="Warning"
```
