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

Not yet executed in this repository session.

## Observed Behavior

Pending cluster deployment validation.

## Result

Pending.

## Operational Significance

This test demonstrates Deployment reconciliation and Service endpoint behavior for replicated API Pods. It should not be described as zero-downtime unless that is separately verified.
