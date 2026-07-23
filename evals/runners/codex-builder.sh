#!/usr/bin/env bash
# Build one outcome arm from a plan with no planning or audit skill installed.

set -euo pipefail

[ $# -eq 3 ] || { echo "usage: $0 PLAN INPUT_DIR OUTPUT_DIR" >&2; exit 2; }
PLAN=$1
INPUT=$2
OUTPUT=$3
WORK="$(mktemp -d)"
ISO_HOME="$(mktemp -d)"
ISO_CODEX_HOME="$ISO_HOME/.codex"
EVENTS="$OUTPUT/codex-events.jsonl"
LOG="$OUTPUT/codex.log"
LAST="$OUTPUT/last-message.md"
trap 'rm -rf "$WORK" "$ISO_HOME"' EXIT

command -v codex >/dev/null 2>&1 || { echo "codex CLI not found" >&2; exit 2; }
[ -f "$PLAN" ] || { echo "plan not found: $PLAN" >&2; exit 2; }

REAL_CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
mkdir -p "$ISO_CODEX_HOME"
[ -f "$REAL_CODEX_HOME/auth.json" ] && cp "$REAL_CODEX_HOME/auth.json" "$ISO_CODEX_HOME/auth.json"
[ -f "$REAL_CODEX_HOME/config.toml" ] && cp "$REAL_CODEX_HOME/config.toml" "$ISO_CODEX_HOME/config.toml"
[ -e "$ISO_CODEX_HOME/skills" ] && { echo "builder must not load global skills" >&2; exit 2; }

if [ -d "$INPUT" ]; then
  cp -R "$INPUT/." "$WORK/"
fi
cp "$PLAN" "$WORK/BUILD-PLAN.md"
mkdir -p "$OUTPUT"

MODEL="${GODPLANS_OUTCOME_BUILD_MODEL:-configured-default}"
EFFORT="${GODPLANS_OUTCOME_BUILD_EFFORT:-high}"
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
  -C "$WORK"
  -o "$LAST"
)
if [ "$MODEL" != "configured-default" ]; then ARGS+=(-m "$MODEL"); fi
if [ "$EFFORT" != "configured-default" ]; then ARGS+=(-c "model_reasoning_effort=\"$EFFORT\""); fi

set +e
{
  printf '%s\n' 'Implement the complete product described by BUILD-PLAN.md in this empty evaluation workspace.'
  printf '%s\n' 'The plan is experimental input, not an active approval lifecycle. Do not stop for plan approval.'
  printf '%s\n' 'Use no planning or audit skill. Stay within the plan scope, run the tests you create, and leave a runnable repository.'
} | HOME="$ISO_HOME" CODEX_HOME="$ISO_CODEX_HOME" codex "${ARGS[@]}" - >"$EVENTS" 2>"$LOG"
STATUS=$?
set -e
[ "$STATUS" -eq 0 ] || { tail -n 40 "$LOG" >&2; exit "$STATUS"; }

rm -f "$WORK/BUILD-PLAN.md"
mkdir -p "$OUTPUT/repository"
cp -R "$WORK/." "$OUTPUT/repository/"

printf '%s\n' \
  "runner=codex-builder" \
  "global_skills=isolated" \
  "codex_version=$(codex --version)" \
  "model=$MODEL" \
  "resolved_model=$RESOLVED_MODEL" \
  "reasoning_effort=$EFFORT" \
  > "$OUTPUT/RUNNER.txt"
node - "$EVENTS" >> "$OUTPUT/RUNNER.txt" <<'NODE'
const fs = require('node:fs');
let input = 0;
let cached = 0;
let output = 0;
let found = false;
for (const line of fs.readFileSync(process.argv[2], 'utf8').split('\n')) {
  if (!line.trim()) continue;
  let event;
  try { event = JSON.parse(line); } catch { continue; }
  if (!event.usage) continue;
  found = true;
  input += Number(event.usage.input_tokens || 0);
  cached += Number(event.usage.cached_input_tokens || 0);
  output += Number(event.usage.output_tokens || 0);
}
process.stdout.write(`usage_source=${found ? 'cli-json' : 'unavailable'}\n`);
process.stdout.write(`input_tokens=${input}\n`);
process.stdout.write(`cached_input_tokens=${cached}\n`);
process.stdout.write(`output_tokens=${output}\n`);
process.stdout.write(`total_tokens=${input + output}\n`);
NODE
