#!/usr/bin/env bash
# Run one behavioral case with the locally authenticated Codex CLI.

set -euo pipefail

[ $# -eq 2 ] || { echo "usage: $0 REQUEST.md OUTPUT" >&2; exit 2; }

REQUEST=$1
OUTPUT=$2
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CASE_DIR="$(cd "$(dirname "$REQUEST")" && pwd)"
WORK="$(mktemp -d)"
LAST="$WORK/last-message.md"
OUTPUT_DIR="$(dirname "$OUTPUT")"
CODEX_LOG="$OUTPUT_DIR/codex.log"
trap 'rm -rf "$WORK"' EXIT

command -v codex >/dev/null 2>&1 || { echo "codex CLI not found" >&2; exit 2; }

CODEX_MODEL=${GODPLANS_EVAL_MODEL:-configured-default}
CODEX_EFFORT=${GODPLANS_EVAL_REASONING_EFFORT:-configured-default}
CODEX_ARGS=(
  exec
  --ephemeral
  --sandbox workspace-write
  --skip-git-repo-check
  --color never
  -C "$WORK"
  -o "$LAST"
)
if [ "$CODEX_MODEL" != "configured-default" ]; then
  CODEX_ARGS+=(-m "$CODEX_MODEL")
fi
if [ "$CODEX_EFFORT" != "configured-default" ]; then
  CODEX_ARGS+=(-c "model_reasoning_effort=\"$CODEX_EFFORT\"")
fi

if [ -d "$CASE_DIR/INPUT" ]; then
  cp -R "$CASE_DIR/INPUT/." "$WORK/"
fi

mkdir -p "$WORK/.agents/skills"
ln -s "$ROOT/skills/godplans" "$WORK/.agents/skills/godplans"
mkdir -p "$OUTPUT_DIR"

set +e
{
  printf '%s\n\n' 'Use the project-local godplans skill for the following evaluation request.'
  printf '%s\n' 'Work entirely inside the current workspace. Do not implement application code.'
  printf '%s\n\n' 'For a plan outcome, emit the complete godplans artifact set under .godplans/. For a compliance hard stop, explain the refusal in the final response and do not create a plan.'
  sed -n '1,$p' "$REQUEST"
} | codex "${CODEX_ARGS[@]}" - >/dev/null 2>"$CODEX_LOG"
CODEX_STATUS=$?
set -e
if [ "$CODEX_STATUS" -ne 0 ]; then
  tail -n 40 "$CODEX_LOG" >&2
  exit "$CODEX_STATUS"
fi

printf '%s\n' \
  "runner=codex" \
  "codex_version=$(codex --version)" \
  "model=$CODEX_MODEL" \
  "reasoning_effort=$CODEX_EFFORT" \
  > "$OUTPUT_DIR/RUNNER.txt"
case "$OUTPUT" in
  */PLAN.mdx)
    [ -s "$WORK/.godplans/PLAN.mdx" ] || { echo "Codex did not emit PLAN.mdx" >&2; exit 1; }
    [ -x "$WORK/.godplans/validate-plan.sh" ] || { echo "Codex did not emit an executable validator" >&2; exit 1; }
    cmp -s "$ROOT/skills/godplans/scripts/validate-plan.sh" "$WORK/.godplans/validate-plan.sh" || {
      echo "Codex emitted a validator that differs from the shipped source" >&2
      exit 1
    }
    cp "$WORK/.godplans/PLAN.mdx" "$OUTPUT"
    cp "$WORK/.godplans/validate-plan.sh" "$(dirname "$OUTPUT")/validate-plan.sh"
    ;;
  */RESPONSE.md)
    [ ! -e "$WORK/.godplans/PLAN.mdx" ] || { echo "Codex emitted a plan for a refusal case" >&2; exit 1; }
    [ -s "$LAST" ] || { echo "Codex returned an empty refusal" >&2; exit 1; }
    cp "$LAST" "$OUTPUT"
    ;;
  *)
    echo "unsupported output path: $OUTPUT" >&2
    exit 2
    ;;
esac
