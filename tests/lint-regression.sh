#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

fail() {
  echo "FAIL [lint-regression] $*" >&2
  exit 1
}

cp -R "$ROOT" "$TMP/repo"

printf '\nstale marker\n' >> "$TMP/repo/PROMPT.md"
before=$(shasum "$TMP/repo/PROMPT.md" | awk '{print $1}')
if bash "$TMP/repo/scripts/lint.sh" prompt-fresh >/dev/null 2>&1; then
  fail "stale prompt passed"
fi
after=$(shasum "$TMP/repo/PROMPT.md" | awk '{print $1}')
[ "$before" = "$after" ] || fail "prompt-fresh mutated the generated artifact"

perl -0pi -e 's/"version": "[^"]+"/"version": "9.9.9"/' "$TMP/repo/package.json"
if bash "$TMP/repo/scripts/lint.sh" version-parity >/dev/null 2>&1; then
  fail "package version drift passed"
fi

printf '%s\n' '{ invalid json' > "$TMP/repo/evals/cases/brownfield-cli/INPUT/package.json"
if bash "$TMP/repo/scripts/lint.sh" json-valid >/dev/null 2>&1; then
  fail "invalid JSON passed"
fi

space_repo="$TMP/repo with space"
cp -R "$ROOT" "$space_repo"
if ! bash "$space_repo/scripts/lint.sh" json-valid >/dev/null 2>&1; then
  fail "valid JSON failed when the repository path contained spaces"
fi

echo "ok   [lint-regression]"
