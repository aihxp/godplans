#!/usr/bin/env bash
# Release-grade local evidence. Requires the pinned official validator and gh.

set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -n "${SKILLS_REF_BIN:-}" ]; then
  VALIDATOR=$SKILLS_REF_BIN
elif command -v skills-ref >/dev/null 2>&1; then
  VALIDATOR=$(command -v skills-ref)
else
  printf '%s\n' "[fail] skills-ref is required for release validation." >&2
  printf '%s\n' "Install the pinned validator in an isolated environment:" >&2
  printf '%s\n' "  python3 -m venv .venv-skills-ref" >&2
  printf '%s\n' "  .venv-skills-ref/bin/pip install -r requirements/skills-ref.txt" >&2
  printf '%s\n' "Then set SKILLS_REF_BIN=.venv-skills-ref/bin/skills-ref and rerun." >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1 || ! gh auth status >/dev/null 2>&1; then
  printf '%s\n' "[fail] authenticated gh CLI is required for tag and release parity." >&2
  exit 1
fi

cd "$REPO_DIR"
SKILLS_REF_BIN="$VALIDATOR" npm run check
bash scripts/eval.sh --check-cases
"$VALIDATOR" validate "$REPO_DIR/skills/godplans"
bash scripts/lint.sh tag-release-parity --verbose
npm pack --dry-run --json --ignore-scripts >/dev/null
printf '%s\n' "ok   [release-check]"
