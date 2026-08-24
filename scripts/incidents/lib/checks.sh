#!/usr/bin/env bash

set -euo pipefail

preflight() {
  local scenario="$1"
  local manifest
  manifest="$(manifest_path "${scenario}")"

  if ! is_scenario "${scenario}"; then
    error "Unknown scenario: ${scenario}"
    return 1
  fi

  if [[ "$(scenario_mode "${scenario}")" == "manual-only" ]]; then
    return 0
  fi

  if [[ ! -f "${manifest}" ]]; then
    error "Scenario manifest is missing: ${manifest}"
    return 1
  fi

  if ! kubectl_cmd version --client >/dev/null 2>&1; then
    error "Kubernetes client is not available through: ${KUBECTL_CMD}"
    return 1
  fi

  if ! kubectl_cmd cluster-info >/dev/null 2>&1; then
    error "Cluster is not reachable through: ${KUBECTL_CMD}"
    return 1
  fi

  if ! kubectl_cmd get nodes >/dev/null 2>&1; then
    error "Cannot read cluster nodes. Check kubeconfig/RBAC."
    return 1
  fi

  if ! kubectl_cmd get nodes --no-headers 2>/dev/null | awk '$2 == "Ready" { found=1 } END { exit found ? 0 : 1 }'; then
    error "No Ready nodes found. Refusing to run incident reproduction."
    return 1
  fi

  if ! kubectl_cmd create namespace "${CHAOS_NAMESPACE}" --dry-run=client -o yaml >/dev/null 2>&1; then
    error "Target namespace cannot be created or rendered: ${CHAOS_NAMESPACE}"
    return 1
  fi

  if ! apply_manifest "${manifest}" --dry-run=client >/dev/null 2>&1; then
    error "Scenario manifest failed client-side validation: ${manifest}"
    return 1
  fi
}
