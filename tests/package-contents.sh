#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT HUP INT TERM

fail() {
  echo "FAIL [package-contents] $*" >&2
  exit 1
}

cd "$ROOT"
npm pack --dry-run --json --ignore-scripts > "$TMP"

node - "$TMP" <<'NODE' || exit 1
const fs = require('fs');
const payload = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const paths = new Set(payload[0].files.map((entry) => entry.path));
for (const required of ['scripts/release-check.sh', 'requirements/skills-ref.txt']) {
  if (!paths.has(required)) {
    process.stderr.write(`FAIL [package-contents] missing ${required}\n`);
    process.exit(1);
  }
}
NODE

echo "ok   [package-contents]"
