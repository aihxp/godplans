#!/usr/bin/env bash
# scripts/lint.sh: meta-linter for godplans.
#
# Mechanically enforces the discipline rules. Replaces "the rule says X"
# with "CI fails if X is violated."
#
# Checks (run with --all, default):
#
#   unicode-clean        no em dashes, en dashes, Unicode arrows, box-drawing
#                        characters, smart quotes, ellipsis characters, or
#                        emojis in any authored file.
#   frontmatter-version  SKILL.md metadata version matches the top CHANGELOG
#                        entry and the body "Skill version" line.
#   description-length   SKILL.md description is 1-1024 characters (Agent
#                        Skills spec bound).
#   dir-name-match       skill directory name matches frontmatter name.
#   references-exist     every references/<file>.md named in SKILL.md exists.
#   modules-complete     every reference module has the six contract sections.
#   symlinks-valid       .agents/skills and .claude/skills projections resolve.
#   prompt-fresh         PROMPT.md exists and matches build-prompt.sh output.
#
# Usage: bash scripts/lint.sh [check-name | --all] [--verbose]
# Bash 3.2 compatible (macOS default).

set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SKILL_DIR="$REPO_DIR/skills/godplans"
VERBOSE=0
FAILED=0

for arg in "$@"; do
  [ "$arg" = "--verbose" ] && VERBOSE=1
done

note() { [ "$VERBOSE" = "1" ] && echo "  $*" || true; }
fail() { echo "FAIL [$CHECK] $*" >&2; FAILED=1; }
pass() { echo "ok   [$CHECK]"; }

authored_files() {
  find "$REPO_DIR" \
    -path "$REPO_DIR/.git" -prune -o \
    -path "$REPO_DIR/node_modules" -prune -o \
    -type f \( -name '*.md' -o -name '*.mdx' -o -name '*.sh' -o -name '*.json' -o -name '*.yml' \) -print
}

check_unicode_clean() {
  CHECK=unicode-clean
  # perl, not grep -P: BSD grep on stock macOS has no -P and would silently
  # skip the scan. The rule is stricter than the ban list: authored files are
  # pure ASCII, so any byte above 0x7F fails.
  command -v perl >/dev/null 2>&1 || { fail "perl not found; cannot scan"; return; }
  bad=0
  for f in $(authored_files); do
    hits=$(perl -ne 'print "$.:$_" if /[^\x00-\x7F]/' "$f" 2>/dev/null | head -5)
    if [ -n "$hits" ]; then
      fail "non-ASCII character in ${f#$REPO_DIR/}:"
      printf '%s\n' "$hits" >&2
      bad=1
    fi
  done
  [ "$bad" = "0" ] && pass
}

check_frontmatter_version() {
  CHECK=frontmatter-version
  fm=$(awk -F'"' '/^  version:/ { print $2; exit }' "$SKILL_DIR/SKILL.md")
  ch=$(grep -m1 '^## \[' "$REPO_DIR/CHANGELOG.md" | sed 's/^## \[\([^]]*\)\].*/\1/')
  body=$(grep -m1 '^## Skill version:' "$SKILL_DIR/SKILL.md" | sed 's/^## Skill version: //')
  if [ "$fm" != "$ch" ]; then fail "SKILL.md version ($fm) != CHANGELOG top entry ($ch)"; fi
  if [ "$fm" != "$body" ]; then fail "SKILL.md frontmatter version ($fm) != body Skill version line ($body)"; fi
  [ "$fm" = "$ch" ] && [ "$fm" = "$body" ] && pass
}

check_description_length() {
  CHECK=description-length
  desc=$(awk '/^description:/ {print; exit}' "$SKILL_DIR/SKILL.md" | sed 's/^description: //; s/^"//; s/"$//')
  len=$(printf '%s' "$desc" | wc -c | tr -d ' ')
  if [ "$len" -lt 1 ] || [ "$len" -gt 1024 ]; then
    fail "description is $len chars; Agent Skills spec bound is 1-1024"
  else
    note "description length: $len"
    pass
  fi
}

check_dir_name_match() {
  CHECK=dir-name-match
  fm_name=$(awk '/^name:/ {print $2; exit}' "$SKILL_DIR/SKILL.md")
  dir_name=$(basename "$SKILL_DIR")
  if [ "$fm_name" != "$dir_name" ]; then
    fail "frontmatter name ($fm_name) != directory name ($dir_name)"
  else
    pass
  fi
}

check_references_exist() {
  CHECK=references-exist
  bad=0
  for ref in $(grep -o 'references/[a-z-]*\.md' "$SKILL_DIR/SKILL.md" | sort -u); do
    if [ ! -f "$SKILL_DIR/$ref" ]; then
      fail "SKILL.md names $ref but it does not exist"
      bad=1
    else
      note "$ref exists"
    fi
  done
  [ "$bad" = "0" ] && pass
}

check_modules_complete() {
  CHECK=modules-complete
  bad=0
  for f in "$SKILL_DIR"/references/*.md; do
    base=$(basename "$f")
    case "$base" in
      plan-format.md|discovery.md|compliance.md|exemplar.md) continue ;;
    esac
    for section in "## Lineage" "## Decisions to force" "## Plan requirements" "## Task seeds" "## Self-audit rubric" "## Anti-patterns refused"; do
      if ! grep -q "^$section" "$f"; then
        fail "$base missing section: $section"
        bad=1
      fi
    done
  done
  [ "$bad" = "0" ] && pass
}

check_symlinks_valid() {
  CHECK=symlinks-valid
  bad=0
  for link in "$REPO_DIR/.agents/skills/godplans" "$REPO_DIR/.claude/skills/godplans"; do
    if [ ! -e "$link" ]; then
      fail "projection $link does not resolve"
      bad=1
    fi
  done
  [ "$bad" = "0" ] && pass
}

check_prompt_fresh() {
  CHECK=prompt-fresh
  if [ ! -f "$REPO_DIR/PROMPT.md" ]; then
    fail "PROMPT.md missing; run scripts/build-prompt.sh"
    return
  fi
  tmp=$(mktemp -d)
  cp "$REPO_DIR/PROMPT.md" "$tmp/PROMPT.before"
  bash "$SCRIPT_DIR/build-prompt.sh" >/dev/null
  if ! cmp -s "$tmp/PROMPT.before" "$REPO_DIR/PROMPT.md"; then
    fail "PROMPT.md was stale; regenerated now, commit the diff"
  else
    pass
  fi
  rm -rf "$tmp"
}

TARGET="${1:---all}"
case "$TARGET" in
  --all|--verbose)
    check_unicode_clean
    check_frontmatter_version
    check_description_length
    check_dir_name_match
    check_references_exist
    check_modules_complete
    check_symlinks_valid
    check_prompt_fresh
    ;;
  unicode-clean) check_unicode_clean ;;
  frontmatter-version) check_frontmatter_version ;;
  description-length) check_description_length ;;
  dir-name-match) check_dir_name_match ;;
  references-exist) check_references_exist ;;
  modules-complete) check_modules_complete ;;
  symlinks-valid) check_symlinks_valid ;;
  prompt-fresh) check_prompt_fresh ;;
  *) echo "Unknown check: $TARGET" >&2; exit 1 ;;
esac

exit "$FAILED"
