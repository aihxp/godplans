#!/usr/bin/env bash
# Run a fresh static godaudits pass with the plan and arm identity absent.

set -euo pipefail

[ $# -eq 2 ] || { echo "usage: $0 REPOSITORY OUTPUT_DIR" >&2; exit 2; }
REPOSITORY=$1
OUTPUT=$2
SKILL_DIR="${GODAUDITS_SKILL_DIR:-}"
if [ -z "$SKILL_DIR" ]; then
  ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
  SIBLING="$(cd "$ROOT/.." && pwd)/godaudits/skills/godaudits"
  [ -d "$SIBLING" ] && SKILL_DIR=$SIBLING
fi
[ -d "$SKILL_DIR" ] || {
  echo "set GODAUDITS_SKILL_DIR to the canonical godaudits skill directory" >&2
  exit 2
}

ISO_HOME="$(mktemp -d)"
ISO_CODEX_HOME="$ISO_HOME/.codex"
AUDIT_WORK="$(mktemp -d)"
AUDIT_REPOSITORY="$AUDIT_WORK/repository"
EVENTS="$OUTPUT/codex-events.jsonl"
LOG="$OUTPUT/codex.log"
LAST="$OUTPUT/last-message.md"
trap 'rm -rf "$ISO_HOME" "$AUDIT_WORK"' EXIT

command -v codex >/dev/null 2>&1 || { echo "codex CLI not found" >&2; exit 2; }
REAL_CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
mkdir -p "$ISO_CODEX_HOME/skills"
[ -f "$REAL_CODEX_HOME/auth.json" ] && cp "$REAL_CODEX_HOME/auth.json" "$ISO_CODEX_HOME/auth.json"
[ -f "$REAL_CODEX_HOME/config.toml" ] && cp "$REAL_CODEX_HOME/config.toml" "$ISO_CODEX_HOME/config.toml"
cp -R "$SKILL_DIR" "$ISO_CODEX_HOME/skills/godaudits"
mkdir -p "$OUTPUT"
mkdir -p "$AUDIT_REPOSITORY"
cp -R "$REPOSITORY/." "$AUDIT_REPOSITORY/"

MODEL="${GODPLANS_OUTCOME_AUDIT_MODEL:-configured-default}"
EFFORT="${GODPLANS_OUTCOME_AUDIT_EFFORT:-high}"
RESOLVED_MODEL=$MODEL
if [ "$RESOLVED_MODEL" = "configured-default" ] && [ -f "$REAL_CODEX_HOME/config.toml" ]; then
  RESOLVED_MODEL=$(awk -F= '/^[[:space:]]*model[[:space:]]*=/ { value=$2; gsub(/[[:space:]"]/, "", value); print value; exit }' "$REAL_CODEX_HOME/config.toml")
  RESOLVED_MODEL=${RESOLVED_MODEL:-unavailable}
fi
ARGS=(
  exec
  --ephemeral
  --sandbox workspace-write
  --skip-git-repo-check
  --color never
  --json
  -C "$AUDIT_REPOSITORY"
  -o "$LAST"
)
if [ "$MODEL" != "configured-default" ]; then ARGS+=(-m "$MODEL"); fi
if [ "$EFFORT" != "configured-default" ]; then ARGS+=(-c "model_reasoning_effort=\"$EFFORT\""); fi

set +e
{
  printf '%s\n' 'Use the installed godaudits skill to run a complete fresh static audit of this repository.'
  printf '%s\n' 'Do not run the application, tests, network requests, or model calls from the audited project.'
  printf '%s\n' 'The repository contains no input plan and no treatment or control label. Audit only the built artifact.'
  printf '%s\n' 'Emit validated .godaudits/AUDIT.json and .godaudits/AUDIT.mdx.'
} | HOME="$ISO_HOME" CODEX_HOME="$ISO_CODEX_HOME" codex "${ARGS[@]}" - >"$EVENTS" 2>"$LOG"
STATUS=$?
set -e
[ "$STATUS" -eq 0 ] || { tail -n 40 "$LOG" >&2; exit "$STATUS"; }

[ -s "$AUDIT_REPOSITORY/.godaudits/AUDIT.json" ] || { echo "godaudits did not emit AUDIT.json" >&2; exit 1; }
[ -s "$AUDIT_REPOSITORY/.godaudits/AUDIT.mdx" ] || { echo "godaudits did not emit AUDIT.mdx" >&2; exit 1; }
cp "$AUDIT_REPOSITORY/.godaudits/AUDIT.json" "$OUTPUT/AUDIT.json"
cp "$AUDIT_REPOSITORY/.godaudits/AUDIT.mdx" "$OUTPUT/AUDIT.mdx"

printf '%s\n' \
  "runner=codex-godaudits" \
  "capability=static" \
  "arm_identity=hidden" \
  "godaudits_version=$(awk -F'\"' '/^  version:/ { print $2; exit }' "$SKILL_DIR/SKILL.md")" \
  "codex_version=$(codex --version)" \
  "model=$MODEL" \
  "resolved_model=$RESOLVED_MODEL" \
  "reasoning_effort=$EFFORT" \
  > "$OUTPUT/RUNNER.txt"
