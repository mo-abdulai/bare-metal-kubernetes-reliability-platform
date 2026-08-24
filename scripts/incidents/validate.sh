#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

failures=0

check() {
  local description="$1"
  shift
  if "$@"; then
    success "OK: ${description}"
  else
    error "FAIL: ${description}"
    failures=$((failures + 1))
  fi
}

metadata_has() {
  local scenario="$1"
  local key="$2"
  [[ "$(metadata_value "${scenario}" "${key}")" != "" ]]
}

runbook_exists() {
  local scenario="$1"
  [[ -f "${REPO_ROOT}/$(runbook_path "${scenario}")" ]]
}

manifest_valid() {
  local scenario="$1"
  if [[ "$(scenario_mode "${scenario}")" == "manual-only" ]]; then
    return 0
  fi
  apply_manifest "$(manifest_path "${scenario}")" --dry-run=client >/dev/null
}

script_syntax() {
  bash -n "${SCRIPT_DIR}/incident.sh" &&
    bash -n "${SCRIPT_DIR}/cleanup.sh" &&
    bash -n "${SCRIPT_DIR}/validate.sh" &&
    bash -n "${SCRIPT_DIR}/lib/common.sh" &&
    bash -n "${SCRIPT_DIR}/lib/checks.sh" &&
    bash -n "${SCRIPT_DIR}/lib/output.sh"
}

check "shell script syntax" script_syntax

if command -v shellcheck >/dev/null 2>&1; then
  check "shellcheck" shellcheck \
    "${SCRIPT_DIR}/incident.sh" \
    "${SCRIPT_DIR}/cleanup.sh" \
    "${SCRIPT_DIR}/validate.sh" \
    "${SCRIPT_DIR}/lib/common.sh" \
    "${SCRIPT_DIR}/lib/checks.sh" \
    "${SCRIPT_DIR}/lib/output.sh"
else
  warn "shellcheck not installed; skipping optional shellcheck validation."
fi

for scenario in "${SCENARIOS[@]}"; do
  check "${scenario} metadata title" metadata_has "${scenario}" "title"
  check "${scenario} metadata runbook" metadata_has "${scenario}" "runbook"
  check "${scenario} metadata expected_state" metadata_has "${scenario}" "expected_state"
  check "${scenario} runbook exists" runbook_exists "${scenario}"
  check "${scenario} manifest parses or is manual-only" manifest_valid "${scenario}"
done

if grep -R --exclude validate.sh -nE 'delete namespace (opspulse|monitoring|logging)|reboot|systemctl stop|k3s-killall|/etc|iptables|nft ' "${SCRIPT_DIR}"; then
  error "Risky command pattern found in scripts/incidents."
  failures=$((failures + 1))
else
  success "OK: destructive command scan"
fi

if [[ "${failures}" -gt 0 ]]; then
  error "Validation failed with ${failures} issue(s)."
  exit 1
fi

success "Incident reproduction framework validation passed."
