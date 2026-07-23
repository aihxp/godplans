#!/usr/bin/env bash
set -eu
GODPLANS_VENDOR_PROVIDER=gemini GODPLANS_VENDOR_ARM=baseline \
  exec "$(dirname "$0")/vendor-cli.sh" "$@"
