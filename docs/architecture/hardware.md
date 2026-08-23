# Hardware & Node Inventory

## Platform Overview

The Bare-Metal Kubernetes Reliability & Operations Platform is a two-node ARM64 bare-metal Kubernetes environment built on Raspberry Pi hardware and operated with K3s.

The platform separates control-plane and worker responsibilities across two physical systems. This provides a compact infrastructure operations environment for validating Kubernetes behavior, node health, workload placement, and reliability workflows on real hardware.

## Node Inventory

| Node | Role | Architecture | OS | CPU | Memory | Storage |
| --- | --- | --- | --- | --- | --- | --- |
| `homepi` | K3s server/control plane | ARM64 | Linux; distribution/version `TODO: verify` | `TODO: verify` | `TODO: verify` | `TODO: verify` |
| `workpi` | K3s agent/worker | ARM64 | Linux; distribution/version `TODO: verify` | `TODO: verify` | `TODO: verify` | `TODO: verify` |

## Node Responsibilities

### homepi

`homepi` is the K3s server node and provides the control-plane role for the cluster. Its responsibilities include Kubernetes API access, control-plane coordination, and cluster state management as handled by K3s.

As the control-plane node, `homepi` is responsible for coordinating scheduling decisions and control loops through the K3s-managed Kubernetes control plane.

### workpi

`workpi` is the K3s agent node and provides worker capacity for the cluster. Its responsibilities include executing container workloads, contributing node compute resources, and participating in Kubernetes networking as a worker node.

## Operating Model

Separating control-plane and worker responsibilities creates a small multi-node bare-metal environment suitable for operating and validating:

- node health
- scheduling behavior
- workload placement
- service networking
- cluster failures
- incident response
- infrastructure observability

Detailed hardware specifications, operating system versions, and storage characteristics should be added after they are verified from sanitized baseline output or read-only inspection commands.
