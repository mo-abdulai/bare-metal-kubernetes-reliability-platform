#!/usr/bin/env bash

set -u

color_enabled() {
  [[ -t 1 && "${NO_COLOR:-}" == "" ]]
}

color() {
  local code="$1"
  if color_enabled; then
    printf '\033[%sm' "$code"
  fi
}

reset_color() {
  if color_enabled; then
    printf '\033[0m'
  fi
}

info() {
  printf '%s%s%s\n' "$(color 36)" "$*" "$(reset_color)"
}

success() {
  printf '%s%s%s\n' "$(color 32)" "$*" "$(reset_color)"
}

warn() {
  printf '%s%s%s\n' "$(color 33)" "$*" "$(reset_color)"
}

error() {
  printf '%s%s%s\n' "$(color 31)" "$*" "$(reset_color)" >&2
}

section() {
  printf '\n==================================================\n'
  printf '%s\n' "$*"
  printf '==================================================\n\n'
}

