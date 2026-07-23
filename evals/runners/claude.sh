#!/usr/bin/env bash
set -eu
GODPLANS_VENDOR_PROVIDER=claude GODPLANS_VENDOR_ARM=skill \
  exec "$(dirname "$0")/vendor-cli.sh" "$@"
