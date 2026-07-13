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
#   version-parity       every published version surface agrees.
#   description-length   SKILL.md description is 1-1024 characters (Agent
#                        Skills spec bound).
#   dir-name-match       skill directory name matches frontmatter name.
#   references-exist     every references/<file>.md named in SKILL.md exists.
#   modules-complete     every reference module has the six contract sections.
#   symlinks-valid       .agents/skills and .claude/skills projections resolve.
#   json-valid           every authored JSON file parses.
#   shell-syntax         shell scripts parse in their declared shell.
#   eval-cases           behavioral case manifests are complete and valid.
#   product-surfaces     shipped validator and evaluation entry points exist.
#   prompt-fresh         PROMPT.md matches build-prompt.sh without mutation.
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
    -path "$REPO_DIR/evals/output" -prune -o \
    -type f \( -name '*.md' -o -name '*.mdx' -o -name '*.sh' -o -name '*.js' -o -name '*.json' -o -name '*.yml' -o -name 'EXPECTATIONS' -o -name '.gitignore' -o -name 'LICENSE' \) -print
}

check_unicode_clean() {
  CHECK=unicode-clean
  # perl, not grep -P: BSD grep on stock macOS has no -P and would silently
  # skip the scan. The rule is stricter than the ban list: authored files are
  # pure ASCII, so any byte above 0x7F fails.
  command -v perl >/dev/null 2>&1 || { fail "perl not found; cannot scan"; return; }
  bad=0
  file_list=$(mktemp)
  authored_files > "$file_list"
  while IFS= read -r f; do
    hits=$(perl -ne 'print "$.:$_" if /[^\x00-\x7F]/' "$f" 2>/dev/null | head -5)
    if [ -n "$hits" ]; then
      fail "non-ASCII character in ${f#$REPO_DIR/}:"
      printf '%s\n' "$hits" >&2
      bad=1
    fi
  done < "$file_list"
  rm -f "$file_list"
  [ "$bad" = "0" ] && pass
}

check_version_parity() {
  CHECK=version-parity
  fm=$(awk -F'"' '/^  version:/ { print $2; exit }' "$SKILL_DIR/SKILL.md")
  ch=$(grep -m1 '^## \[' "$REPO_DIR/CHANGELOG.md" | sed 's/^## \[\([^]]*\)\].*/\1/')
  body=$(grep -m1 '^## Skill version:' "$SKILL_DIR/SKILL.md" | sed 's/^## Skill version: //')
  package=$(awk -F'"' '/"version":/ { print $4; exit }' "$REPO_DIR/package.json")
  marketplace=$(awk -F'"' '/"version":/ { print $4; exit }' "$REPO_DIR/.claude-plugin/marketplace.json")
  plugin=$(awk -F'"' '/"version":/ { print $4; exit }' "$REPO_DIR/plugins/godplans/.claude-plugin/plugin.json")
  template=$(grep -m1 'plan created (godplans v' "$SKILL_DIR/templates/PLAN.template.mdx" | sed 's/.*godplans v\([^)]*\).*/\1/')
  bad=0
  for pair in \
    "CHANGELOG:$ch" \
    "SKILL-body:$body" \
    "package:$package" \
    "marketplace:$marketplace" \
    "plugin:$plugin" \
    "template:$template"
  do
    label=${pair%%:*}
    value=${pair#*:}
    if [ "$fm" != "$value" ]; then
      fail "$label version ($value) != SKILL.md version ($fm)"
      bad=1
    fi
  done
  [ "$bad" = "0" ] && pass
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

check_json_valid() {
  CHECK=json-valid
  command -v node >/dev/null 2>&1 || { fail "node not found; cannot parse JSON"; return; }
  bad=0
  file_list=$(mktemp)
  find "$REPO_DIR" -path "$REPO_DIR/.git" -prune -o -path "$REPO_DIR/node_modules" -prune -o -path "$REPO_DIR/evals/output" -prune -o -type f -name '*.json' -print > "$file_list"
  while IFS= read -r f; do
    if ! node -e 'JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"))' "$f" 2>/dev/null; then
      fail "invalid JSON: ${f#$REPO_DIR/}"
      bad=1
    fi
  done < "$file_list"
  rm -f "$file_list"
  [ "$bad" = "0" ] && pass
}

check_shell_syntax() {
  CHECK=shell-syntax
  bad=0
  if ! sh -n "$REPO_DIR/install.sh"; then
    fail "install.sh does not parse as POSIX sh"
    bad=1
  fi
  for f in "$REPO_DIR"/scripts/*.sh "$REPO_DIR"/tests/*.sh "$REPO_DIR"/evals/runners/*.sh "$SKILL_DIR"/scripts/*.sh; do
    [ -f "$f" ] || continue
    if ! bash -n "$f"; then
      fail "shell syntax error: ${f#$REPO_DIR/}"
      bad=1
    fi
  done
  [ "$bad" = "0" ] && pass
}

check_eval_cases() {
  CHECK=eval-cases
  if bash "$REPO_DIR/scripts/eval.sh" --check-cases >/dev/null; then
    pass
  else
    fail "behavioral case contract failed"
  fi
}

check_product_surfaces() {
  CHECK=product-surfaces
  bad=0
  for f in \
    "$SKILL_DIR/scripts/validate-plan.sh" \
    "$REPO_DIR/scripts/eval.sh" \
    "$REPO_DIR/evals/runners/codex.sh" \
    "$REPO_DIR/tests/run.sh"
  do
    if [ ! -x "$f" ]; then
      fail "missing executable: ${f#$REPO_DIR/}"
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
  GODPLANS_PROMPT_OUT="$tmp/PROMPT.generated" bash "$SCRIPT_DIR/build-prompt.sh" >/dev/null
  if ! cmp -s "$tmp/PROMPT.generated" "$REPO_DIR/PROMPT.md"; then
    fail "PROMPT.md is stale; run scripts/build-prompt.sh and commit the diff"
  else
    pass
  fi
  rm -rf "$tmp"
}

TARGET="${1:---all}"
case "$TARGET" in
  --all|--verbose)
    check_unicode_clean
    check_version_parity
    check_description_length
    check_dir_name_match
    check_references_exist
    check_modules_complete
    check_symlinks_valid
    check_json_valid
    check_shell_syntax
    check_eval_cases
    check_product_surfaces
    check_prompt_fresh
    ;;
  unicode-clean) check_unicode_clean ;;
  version-parity|frontmatter-version) check_version_parity ;;
  description-length) check_description_length ;;
  dir-name-match) check_dir_name_match ;;
  references-exist) check_references_exist ;;
  modules-complete) check_modules_complete ;;
  symlinks-valid) check_symlinks_valid ;;
  json-valid) check_json_valid ;;
  shell-syntax) check_shell_syntax ;;
  eval-cases) check_eval_cases ;;
  product-surfaces) check_product_surfaces ;;
  prompt-fresh) check_prompt_fresh ;;
  *) echo "Unknown check: $TARGET" >&2; exit 1 ;;
esac

exit "$FAILED"
