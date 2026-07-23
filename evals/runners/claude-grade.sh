#!/usr/bin/env bash
set -eu
GODPLANS_GRADE_PROVIDER=claude exec "$(dirname "$0")/vendor-grade.sh" "$@"
