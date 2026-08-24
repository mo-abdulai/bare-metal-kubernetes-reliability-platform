#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

usage() {
  cat <<EOF
Usage:
  ./scripts/incidents/cleanup.sh <scenario>
  ./scripts/incidents/cleanup.sh --all
EOF
}

confirm_removed() {
  local scenario="$1"
  local attempt=1
  while (( attempt <= 60 )); do
    if ! kubectl_cmd get all,pvc,configmap,secret -n "${CHAOS_NAMESPACE}" -l "$(resource_selector "${scenario}")" --ignore-not-found 2>/dev/null | grep -q "${scenario}"; then
      success "Cleanup confirmed for ${scenario}."
      return 0
    fi
    sleep 1
    attempt=$((attempt + 1))
  done
  error "Some resources for ${scenario} still exist in ${CHAOS_NAMESPACE}."
  kubectl_cmd get all,pvc,configmap,secret -n "${CHAOS_NAMESPACE}" -l "$(resource_selector "${scenario}")" --ignore-not-found || true
  return 1
}

cleanup_scenario() {
  local scenario="$1"
  local manifest

  if ! is_scenario "${scenario}"; then
    error "Unknown scenario: ${scenario}"
    usage
    exit 1
  fi

  manifest="$(manifest_path "${scenario}")"
  if [[ "$(scenario_mode "${scenario}")" == "manual-only" ]]; then
    warn "Scenario ${scenario} is manual-only; no automatic resources to remove."
    return 0
  fi

  if [[ ! -f "${manifest}" ]]; then
    error "Scenario manifest is missing: ${manifest}"
    exit 1
  fi

  info "Removing resources for scenario ${scenario} from namespace ${CHAOS_NAMESPACE}."
  delete_manifest "${manifest}" --ignore-not-found=true
  confirm_removed "${scenario}"
}

cleanup_all() {
  info "Removing dedicated incident reproduction namespace: ${CHAOS_NAMESPACE}"
  kubectl_cmd delete namespace "${CHAOS_NAMESPACE}" --ignore-not-found=true
  success "Cleanup requested for ${CHAOS_NAMESPACE}."
}

if [[ $# -ne 1 ]]; then
  usage
  exit 1
fi

case "$1" in
  --all) cleanup_all ;;
  --help|-h) usage ;;
  *) cleanup_scenario "$1" ;;
esac
