# TEST-004 - API Replica Recovery

## Objective

Verify that Kubernetes replaces a deleted OpsPulse API Pod and restores the desired replica count.

## Initial State

- `opspulse-api` Deployment desired replica count is two.
- Both API Pods are ready.
- `opspulse-api` Service has ready endpoints.

## Procedure

Identify an API Pod:

```bash
kubectl get pods -n opspulse -l app=opspulse-api
```

Delete one Pod:

```bash
kubectl delete pod <api-pod> -n opspulse
```

Observe recovery:

```bash
kubectl get pods -n opspulse -l app=opspulse-api -w
kubectl get endpoints -n opspulse opspulse-api
```

Verify the frontend remains functional if another healthy API endpoint stays available.

## Evidence

- Date: 2026-08-23
- Deleted Pod: `opspulse-api-7d4fc7657-dh228`
- Replacement Pod: `opspulse-api-7d4fc7657-nb4qp`
- Final API Pods:

```text
opspulse-api-7d4fc7657-hdnkf   1/1   Running   homepi
opspulse-api-7d4fc7657-nb4qp   1/1   Running   workpi
```

- Final API endpoints:

```text
10.42.0.36:8000,10.42.1.33:8000
```

## Observed Behavior

Kubernetes created a replacement API Pod after one Pod was deleted. The Deployment returned to two Ready replicas and the ClusterIP Service returned to two ready endpoints.

## Result

Passed.

## Operational Significance

This test demonstrates Deployment reconciliation and Service endpoint behavior for replicated API Pods. It should not be described as zero-downtime unless that is separately verified.
