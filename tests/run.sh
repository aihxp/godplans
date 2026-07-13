#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

for test_file in "$ROOT"/tests/*.sh; do
  case "$test_file" in
    */run.sh) continue ;;
  esac
  bash "$test_file"
done

echo "ok   [test-suite]"
