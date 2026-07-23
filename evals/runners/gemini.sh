#!/usr/bin/env bash
set -eu
GODPLANS_VENDOR_PROVIDER=gemini GODPLANS_VENDOR_ARM=skill \
  exec "$(dirname "$0")/vendor-cli.sh" "$@"
