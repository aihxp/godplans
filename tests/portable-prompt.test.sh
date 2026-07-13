#!/usr/bin/env bash

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROMPT="$REPO_DIR/PROMPT.md"
BUILD="$REPO_DIR/scripts/build-prompt.sh"

fail() {
  echo "FAIL [portable-prompt] $*" >&2
  exit 1
}

marker_count() {
  grep -Fxc "$1" "$PROMPT" || true
}

assert_marker_once() {
  marker=$1
  count=$(marker_count "$marker")
  [ "$count" -eq 1 ] || fail "expected marker once, found $count: $marker"
}

expected_refs="
compliance
discovery
product
architecture
stack
database
security
llm
ux
ui
seo
code-quality
style-genome
agent-memory
repo
build
roadmap
deploy
observe
launch
exemplar
plan-format
"

bash "$BUILD" >/dev/null

previous_line=0
for ref in $expected_refs; do
  marker="# INLINED REFERENCE: references/$ref.md"
  assert_marker_once "$marker"
  title=$(sed -n '1p' "$REPO_DIR/skills/godplans/references/$ref.md")
  title_count=$(marker_count "$title")
  [ "$title_count" -eq 1 ] || fail "expected module title once, found $title_count: $title"
  line=$(grep -Fnx "$marker" "$PROMPT" | cut -d: -f1)
  [ "$line" -gt "$previous_line" ] || fail "reference order is not workflow order at $ref"
  previous_line=$line
done

template_marker="# INLINED TEMPLATE: templates/PLAN.template.mdx"
assert_marker_once "$template_marker"
template_title="# PROJECT-NAME master plan"
template_title_count=$(marker_count "$template_title")
[ "$template_title_count" -eq 1 ] || fail "expected template content once, found $template_title_count"
template_line=$(grep -Fnx "$template_marker" "$PROMPT" | cut -d: -f1)
[ "$template_line" -gt "$previous_line" ] || fail "template does not follow plan-format"

unresolved=$(sed '/^# INLINED REFERENCE: /d; /^# INLINED TEMPLATE: /d' "$PROMPT" |
  grep -En 'references/([a-z-]+|<domain>)\.md|references/|templates/PLAN\.template\.mdx|(^|[^[:alnum:]-])plan-format\.md([^[:alnum:]-]|$)' || true)
[ -z "$unresolved" ] || fail "unresolved required local reference remains:\n$unresolved"

first_hash=$(shasum -a 256 "$PROMPT" | awk '{print $1}')
bash "$BUILD" >/dev/null
second_hash=$(shasum -a 256 "$PROMPT" | awk '{print $1}')
[ "$first_hash" = "$second_hash" ] || fail "regeneration is not deterministic"

echo "ok   [portable-prompt]"
