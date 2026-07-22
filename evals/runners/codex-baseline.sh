#!/usr/bin/env bash
# Control arm: run one behavioral case with the SAME Codex CLI, model, and
# reasoning effort as runners/codex.sh, but with no godplans skill available.
#
# Fairness rules, because a rigged control proves nothing:
#   - identical agent, model, reasoning effort, workspace, and INPUT fixture
#   - identical REQUEST.md, unmodified
#   - the task is stated plainly and asks for a thorough plan, so the baseline
#     has a real chance at every dimension it is scored on
#   - nothing from the skill leaks in: no format contract, no requirement IDs,
#     no validator, no phase method, no vocabulary from PLAN.mdx
#   - a missing plan is scored as zero, never hidden as a runner error

set -euo pipefail

[ $# -eq 2 ] || { echo "usage: $0 REQUEST.md OUTPUT" >&2; exit 2; }

REQUEST=$1
OUTPUT=$2
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

# No .agents/skills link: that absence is the whole point of this arm.
mkdir -p "$OUTPUT_DIR"

set +e
{
  printf '%s\n' 'Write a thorough implementation plan for the following request.'
  printf '%s\n' 'Work entirely inside the current workspace. Do not implement application code.'
  printf '%s\n\n' 'Write the plan to .godplans/PLAN.mdx. If you decline the request, explain why in your final response and do not write a plan.'
  sed -n '1,$p' "$REQUEST"
} | codex "${CODEX_ARGS[@]}" - >/dev/null 2>"$CODEX_LOG"
CODEX_STATUS=$?
set -e
if [ "$CODEX_STATUS" -ne 0 ]; then
  tail -n 40 "$CODEX_LOG" >&2
  exit "$CODEX_STATUS"
fi

printf '%s\n' \
  "runner=codex-baseline" \
  "arm=baseline-no-skill" \
  "codex_version=$(codex --version)" \
  "model=$CODEX_MODEL" \
  "reasoning_effort=$CODEX_EFFORT" \
  > "$OUTPUT_DIR/RUNNER.txt"

case "$OUTPUT" in
  */PLAN.mdx)
    # Accept a plan written anywhere plausible before falling back, so the
    # baseline is not penalized for choosing a different path.
    for candidate in "$WORK/.godplans/PLAN.mdx" "$WORK/PLAN.mdx" "$WORK/PLAN.md" "$WORK/plan.md"; do
      if [ -s "$candidate" ]; then
        cp "$candidate" "$OUTPUT"
        exit 0
      fi
    done
    # No plan file: score the final response instead. It will fail the
    # structural assertions, which is the honest result, not an error.
    cp "$LAST" "$OUTPUT" 2>/dev/null || : > "$OUTPUT"
    ;;
  */RESPONSE.md)
    if [ -s "$WORK/.godplans/PLAN.mdx" ]; then
      # The baseline planned a request it should have refused. Record the plan
      # so the refusal assertions fail against real evidence.
      cp "$WORK/.godplans/PLAN.mdx" "$OUTPUT"
    else
      cp "$LAST" "$OUTPUT" 2>/dev/null || : > "$OUTPUT"
    fi
    ;;
  *)
    echo "unsupported output path: $OUTPUT" >&2
    exit 2
    ;;
esac
