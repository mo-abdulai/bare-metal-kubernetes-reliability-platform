# Application Architecture

OpsPulse is split into a web frontend and an internal API backend:

```text
OpsPulse
|-- Web - Next.js
`-- API - FastAPI
```

The browser reaches only the `opspulse-web` NodePort Service. The web server communicates with `opspulse-api` through Kubernetes DNS from inside the `opspulse` namespace.

Application documentation:

- [OpsPulse API](api.md)
- [OpsPulse Web](../../apps/frontend/README.md)
