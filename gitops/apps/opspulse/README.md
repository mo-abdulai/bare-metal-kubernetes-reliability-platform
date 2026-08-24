# OpsPulse GitOps Application

The `base` directory contains reusable Kubernetes resources for OpsPulse:

- `opspulse` namespace
- FastAPI ServiceAccount, RBAC, ConfigMap, Deployment, and Service
- Next.js ConfigMap, Deployment, and NodePort Service
- Prometheus `ServiceMonitor`

The `overlays/bare-metal` directory pins the Raspberry Pi K3s desired state:

- `nurud43/opspulse-api:v0.1.5`
- `nurud43/opspulse-web:v0.1.5`
- two replicas for API and web
- bare-metal environment labels

Routine delivery changes should update the overlay image tags and be applied by Argo CD after the change is committed and pushed.
