#!/usr/bin/env bash
# Run godplans behavioral cases through any compatible agent runner.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CASES="${GODPLANS_EVAL_CASES:-$ROOT/evals/cases}"
RUNNER="${GODPLANS_EVAL_RUNNER:-}"
VALIDATOR="${GODPLANS_VALIDATOR:-$ROOT/skills/godplans/scripts/validate-plan.sh}"
OUTPUT="$ROOT/evals/output"
CHECK_ONLY=0
SCORE_ONLY=0
SELECTED=""

usage() {
  cat <<'USAGE'
Usage: bash scripts/eval.sh [options] [case ...]

Run behavioral cases through GODPLANS_EVAL_RUNNER and score the artifacts.

Options:
  --check-cases       Validate case manifests without running an agent.
  --score-only        Rescore artifacts already present under --output.
  --output DIRECTORY  Read or write evaluation artifacts in DIRECTORY.
  -h, --help          Show this help.
USAGE
}

die() {
  echo "eval: $*" >&2
  exit 2
}

append_selected() {
  if [ -z "$SELECTED" ]; then
    SELECTED=$1
  else
    SELECTED="$SELECTED $1"
  fi
}

while [ $# -gt 0 ]; do
  case "$1" in
    --check-cases) CHECK_ONLY=1 ;;
    --score-only) SCORE_ONLY=1 ;;
    --output)
      [ $# -gt 1 ] || die "--output needs a directory"
      OUTPUT=$2
      shift
      ;;
    -h|--help) usage; exit 0 ;;
    --*) die "unknown option: $1" ;;
    *) append_selected "$1" ;;
  esac
  shift
done

[ -d "$CASES" ] || die "case directory not found: $CASES"

case_dirs() {
  if [ -n "$SELECTED" ]; then
    for id in $SELECTED; do
      [ -d "$CASES/$id" ] || die "unknown case: $id"
      printf '%s\n' "$CASES/$id"
    done
  else
    find "$CASES" -mindepth 1 -maxdepth 1 -type d -print | LC_ALL=C sort
  fi
}

validate_expectations() {
  file=$1
  outcome_count=0
  while IFS='|' read -r op arg value; do
    case "$op" in
      ''|'#'*) continue ;;
      outcome)
        case "$arg" in plan|refusal) ;; *) return 1 ;; esac
        outcome_count=$((outcome_count + 1))
        ;;
      frontmatter|domain)
        [ -n "$arg" ] && [ -n "$value" ] || return 1
        ;;
      contains|contains-ci|not-contains)
        [ -n "$arg" ] || return 1
        ;;
      max-count)
        [ -n "$arg" ] || return 1
        case "$value" in ''|*[!0-9]*) return 1 ;; esac
        ;;
      *) return 1 ;;
    esac
  done < "$file"
  [ "$outcome_count" -eq 1 ]
}

CASE_LIST=$(mktemp)
trap 'rm -f "$CASE_LIST"' EXIT
case_dirs > "$CASE_LIST"

while IFS= read -r dir; do
  [ -f "$dir/REQUEST.md" ] || die "missing REQUEST.md in $dir"
  [ -f "$dir/EXPECTATIONS" ] || die "missing EXPECTATIONS in $dir"
  validate_expectations "$dir/EXPECTATIONS" || die "invalid EXPECTATIONS in $dir"
  expected_outcome=$(awk -F'|' '$1 == "outcome" { print $2; exit }' "$dir/EXPECTATIONS")
  if [ "$expected_outcome" = "plan" ] && grep -Eiq 'PLAN[.]mdx[^[:alnum:]]+only' "$dir/REQUEST.md"; then
    die "plan case contradicts the required validator companion: $dir"
  fi
done < "$CASE_LIST"

if [ "$CHECK_ONLY" -eq 1 ]; then
  echo "ok   [eval-cases]"
  exit 0
fi

[ -x "$VALIDATOR" ] || die "validator is not executable: $VALIDATOR"
if [ "$SCORE_ONLY" -eq 0 ]; then
  [ -n "$RUNNER" ] || die "set GODPLANS_EVAL_RUNNER to an executable runner"
  [ -x "$RUNNER" ] || die "runner is not executable: $RUNNER"
fi

mkdir -p "$OUTPUT"
failed=0

while IFS= read -r dir; do
  id=$(basename "$dir")
  expected_outcome=$(awk -F'|' '$1 == "outcome" { print $2; exit }' "$dir/EXPECTATIONS")
  out_dir="$OUTPUT/$id"
  if [ "$SCORE_ONLY" -eq 0 ]; then
    rm -rf "$out_dir"
    mkdir -p "$out_dir"
  fi

  if [ "$expected_outcome" = "plan" ]; then
    artifact="$out_dir/PLAN.mdx"
  else
    artifact="$out_dir/RESPONSE.md"
  fi

  if [ "$SCORE_ONLY" -eq 0 ]; then
    if ! "$RUNNER" "$dir/REQUEST.md" "$artifact"; then
      printf '%s\tFAIL\trunner\n' "$id"
      failed=1
      continue
    fi
  fi

  artifact_set_ok=1
  if [ "$expected_outcome" = "plan" ]; then
    companion="$out_dir/validate-plan.sh"
    [ -s "$artifact" ] || artifact_set_ok=0
    [ -x "$companion" ] || artifact_set_ok=0
    cmp -s "$VALIDATOR" "$companion" || artifact_set_ok=0
  else
    [ -s "$artifact" ] || artifact_set_ok=0
    [ ! -e "$out_dir/PLAN.mdx" ] || artifact_set_ok=0
  fi
  if [ "$artifact_set_ok" -eq 0 ]; then
    printf '%s\tFAIL\tartifacts\n' "$id"
    failed=1
    continue
  fi

  passed=0
  total=0
  case_failed=0

  while IFS='|' read -r op arg value; do
    case "$op" in ''|'#'*) continue ;; esac
    total=$((total + 1))
    ok=0
    case "$op" in
      outcome)
        if [ "$arg" = "plan" ]; then
          [ -s "$artifact" ] && "$VALIDATOR" --allow-planning "$artifact" >/dev/null 2>&1 && ok=1
        else
          [ -s "$artifact" ] && ok=1
        fi
        ;;
      frontmatter)
        grep -Eq "^${arg}:[[:space:]]*${value}[[:space:]]*$" "$artifact" && ok=1
        ;;
      domain)
        grep -Eq "^[|][[:space:]]*${arg}[[:space:]]*[|][[:space:]]*${value}[[:space:]]*[|]" "$artifact" && ok=1
        ;;
      contains)
        grep -Fq -- "$arg" "$artifact" && ok=1
        ;;
      contains-ci)
        grep -Fiq -- "$arg" "$artifact" && ok=1
        ;;
      not-contains)
        if ! grep -Fq -- "$arg" "$artifact"; then ok=1; fi
        ;;
      max-count)
        count=$(grep -Fc -- "$arg" "$artifact" || true)
        [ "$count" -le "$value" ] && ok=1
        ;;
    esac

    if [ "$ok" -eq 1 ]; then
      passed=$((passed + 1))
    else
      case_failed=1
      printf '%s\tMISS\t%s|%s|%s\n' "$id" "$op" "$arg" "$value" >&2
    fi
  done < "$dir/EXPECTATIONS"

  if [ "$case_failed" -eq 0 ]; then
    printf '%s\tPASS\t%s/%s\n' "$id" "$passed" "$total"
  else
    printf '%s\tFAIL\t%s/%s\n' "$id" "$passed" "$total"
    failed=1
  fi
done < "$CASE_LIST"

exit "$failed"
