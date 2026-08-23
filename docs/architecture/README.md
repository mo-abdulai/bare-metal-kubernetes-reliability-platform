# Architecture Documentation

This directory documents the physical, network, and Kubernetes architecture of the Bare-Metal Kubernetes Reliability & Operations Platform.

## Documents

- [Hardware & Node Inventory](hardware.md)
- [Network Architecture](network.md)
- [Kubernetes Cluster Topology](cluster-topology.md)

The architecture documentation will evolve as future platform capabilities are introduced. Current platform capabilities include the OpsPulse application and Phase 6 Prometheus/Grafana observability. Later phases may add centralized logging, GitOps, security controls, and backup/recovery.

Baseline command output, when available, should remain in [`../baseline/`](../baseline/) as separate evidence rather than being embedded directly into architecture overviews.
