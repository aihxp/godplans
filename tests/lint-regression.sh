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

MEMORY_MODULE="$TMP/repo/skills/godplans/references/agent-memory.md"
if grep -Fq 'only for context and repo' "$MEMORY_MODULE"; then
  fail "agent-memory guidance forbids justified additional always-loaded pillars"
fi
if grep -Fq 'scope floor total' "$MEMORY_MODULE"; then
  fail "agent-memory guidance uses the contradictory scope floor total name"
fi
grep -Fq 'agents/context.md and agents/repo.md at status: present with always_load: true' "$MEMORY_MODULE" || fail "agent-memory guidance lost the mandatory context and repo floor"
grep -Fq 'always-loaded scope total' "$MEMORY_MODULE" || fail "agent-memory guidance lost the total always-load budget"

mkdir -p "$TMP/repo/.venv-skills-ref"
perl -CSD -e 'print chr(0x00E9), "\n"' > "$TMP/repo/.venv-skills-ref/third-party-license"
if ! bash "$TMP/repo/scripts/lint.sh" unicode-clean >/dev/null 2>&1; then
  fail "ignored official-validator environment was scanned as authored content"
fi

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

perl -0pi -e 's|actions/checkout@[0-9a-f]{40}|actions/checkout@v7|' "$TMP/repo/.github/workflows/lint.yml"
action_output=$(bash "$TMP/repo/scripts/lint.sh" action-pins 2>&1) && action_status=0 || action_status=$?
if [ "$action_status" -eq 0 ]; then
  fail "floating GitHub Action tag passed"
fi
printf '%s\n' "$action_output" | grep -q 'floating GitHub Action reference' || fail "action pin check did not report the floating reference"

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
