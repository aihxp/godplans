#!/usr/bin/env bash

set -u

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VALIDATOR="$ROOT_DIR/skills/godplans/scripts/validate-plan.sh"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/godplans-validator.XXXXXX")"
PASS_COUNT=0
FAIL_COUNT=0

trap 'rm -rf "$TMP_DIR"' EXIT HUP INT TERM

write_valid_plan() {
  file=$1
  status=$2
  cat > "$file" <<'EOF'
---
name: validator-fixture
plan_version: 1
status: PLAN_STATUS
created: 2026-07-13
updated: 2026-07-13
mode: greenfield
product_form: cli-or-sdk
archetype: cli-tool
public_release: false
source_revision: none
input_digest: sha256:1c7ca1006bb3157ad989c1f1dd1cd1d6e8e2a44d9509821ffa43f3be205a12d5
validated_at: 2026-07-13T12:00:00Z
domains_applicable: [product, code-quality]
domains_excluded: []
progress:
  phases_total: 2
  phases_done: 0
  tasks_total: 3
  tasks_done: 0
---

# Validator fixture master plan

Done means the validator fixture passes every structural check.

## Scope and non-goals

In scope: validator behavior. Non-goals: application code.

## Plan provenance

Source revision: none
Input digest: sha256:1c7ca1006bb3157ad989c1f1dd1cd1d6e8e2a44d9509821ffa43f3be205a12d5
Validated at: 2026-07-13T12:00:00Z
Evidence inventory:
- `intake` = `sha256:1111111111111111111111111111111111111111111111111111111111111111`

## Product form

Primary: CLI or SDK. A vertical slice runs from command parsing through deterministic output and a consumer fixture.

## Compliance gate

Result: pass.

## Applicability matrix

| Domain | Status | Reason |
|---|---|---|
| product | applicable | fixture requirement |
| code-quality | applicable | validator coverage |

## Decisions

The fixture uses two ordered phases.

## Requirements

R-1.1: WHEN validation runs THE SYSTEM SHALL return a reliable exit code.

## Architecture

The shell entry point delegates parsing to portable Perl.

## Style genome

ASCII text and Bash 3.2 compatible shell.

## Agent memory

The plan remains the source of truth.

## Phases

## Phase 1: Validator behavior

Goal: validate the core plan contract.

### Wave 1.1

- [ ] GP-101 [W1.1] Parse plan state
  - Files: skills/godplans/scripts/validate-plan.sh
  - Depends on: none
  - Reuses: repository shell conventions
  - Acceptance: frontmatter and counters are checked
  - Verify: `bash tests/validate-plan.sh`
  - Requirements: R-1.1, R-CODE-21

- [ ] GP-102 [W1.1] Check task references
  - Files: tests/validate-plan.sh
  - Depends on: GP-101
  - Reuses: validator fixture
  - Acceptance: dependencies and requirement IDs resolve
  - Verify: `bash tests/validate-plan.sh`
  - Requirements: R-1.1, R-CODE-21

Checkpoint: malformed plans fail with a diagnostic.

Must-haves:
- Truth: invalid plans return nonzero
- Artifact: skills/godplans/scripts/validate-plan.sh exists
- Link: the regression suite invokes the shipped validator

## Phase 2: Verification

Goal: prove the validator contract end to end.

### Wave 2.1

- [ ] GP-201 [W2.1] Run full validator regression suite
  - Files: tests/validate-plan.sh
  - Depends on: GP-101, GP-102
  - Reuses: repository lint entry point
  - Acceptance: all regression cases pass
  - Verify: `bash tests/validate-plan.sh`
  - Requirements: R-1.1, R-CODE-21

Checkpoint: the portable suite passes from a fresh checkout.

Must-haves:
- Truth: the validator reports a valid plan
- Artifact: tests/validate-plan.sh is executable
- Link: plan-format.md points to the validator

## Open Questions

None.

## Rules for executing agents

Only approved or executing plans may be executed.

## Session log

- 2026-07-13 plan created
EOF
  PLAN_STATUS="$status" perl -0pi -e 's/status: PLAN_STATUS/status: $ENV{PLAN_STATUS}/' "$file"
}

record_pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  printf 'ok   %s\n' "$1"
}

record_fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  printf 'FAIL %s: %s\n' "$1" "$2" >&2
}

expect_pass() {
  name=$1
  shift
  output=$("$VALIDATOR" "$@" 2>&1)
  status=$?
  if [ "$status" -eq 0 ]; then
    record_pass "$name"
  else
    record_fail "$name" "expected success, got $status: $output"
  fi
}

expect_fail() {
  name=$1
  expected=$2
  shift 2
  output=$("$VALIDATOR" "$@" 2>&1)
  status=$?
  if [ "$status" -eq 0 ]; then
    record_fail "$name" "expected failure"
  elif printf '%s\n' "$output" | grep -F "$expected" >/dev/null 2>&1; then
    record_pass "$name"
  else
    record_fail "$name" "missing diagnostic '$expected': $output"
  fi
}

new_case() {
  CASE_NUMBER=$((CASE_NUMBER + 1))
  CASE_FILE="$TMP_DIR/case-$CASE_NUMBER.mdx"
  cp "$BASE_PLAN" "$CASE_FILE"
}

BASE_PLAN="$TMP_DIR/valid-planning.mdx"
CASE_NUMBER=0
write_valid_plan "$BASE_PLAN" planning

expect_pass "planning validation mode" --allow-planning "$BASE_PLAN"
expect_fail "planning execution gate" "requires status approved or executing" "$BASE_PLAN"

TABLE_PLAN="$TMP_DIR/valid-requirements-table.mdx"
cp "$BASE_PLAN" "$TABLE_PLAN"
perl -0pi -e 's/R-1\.1: WHEN validation runs THE SYSTEM SHALL return a reliable exit code\./| ID | Acceptance |\n|---|---|\n| R-1.1 | WHEN validation runs THE SYSTEM SHALL return a reliable exit code. |/' "$TABLE_PLAN"
expect_pass "local requirement in Markdown table" --allow-planning "$TABLE_PLAN"

ISOLATED_DIR="$TMP_DIR/standalone-companion"
mkdir "$ISOLATED_DIR"
cp "$VALIDATOR" "$ISOLATED_DIR/validate-plan.sh"
cp "$BASE_PLAN" "$ISOLATED_DIR/PLAN.mdx"
chmod +x "$ISOLATED_DIR/validate-plan.sh"
REPOSITORY_VALIDATOR="$VALIDATOR"
VALIDATOR="$ISOLATED_DIR/validate-plan.sh"
expect_pass "standalone copied validator" --allow-planning "$ISOLATED_DIR/PLAN.mdx"
VALIDATOR="$REPOSITORY_VALIDATOR"

ACTUAL_CATALOG="$TMP_DIR/actual-catalog"
EMBEDDED_CATALOG="$TMP_DIR/embedded-catalog"
perl -ne '
  $inside = 1, next if /^## Plan requirements\s*$/;
  $inside = 0 if $inside && /^## /;
  if ($inside) {
    while (/(R-([A-Z][A-Z0-9-]*)-([0-9]+))/g) {
      $seen{$2}{$3} = 1;
    }
  }
  if (eof) {
    $inside = 0;
  }
  END {
    for $prefix (sort keys %seen) {
      @numbers = sort { $a <=> $b } keys %{$seen{$prefix}};
      die "catalog gap for $prefix\n" if @numbers != $numbers[-1];
      print "$prefix $numbers[-1]\n";
    }
  }
' "$ROOT_DIR"/skills/godplans/references/*.md > "$ACTUAL_CATALOG"
perl -ne 'print "$1 $2\n" if /^    ([A-Z][A-Z0-9-]*) => ([0-9]+),$/' "$REPOSITORY_VALIDATOR" | sort > "$EMBEDDED_CATALOG"
if diff -u "$ACTUAL_CATALOG" "$EMBEDDED_CATALOG" >/dev/null 2>&1; then
  record_pass "embedded requirement catalog is current"
else
  record_fail "embedded requirement catalog is current" "validator catalog differs from domain modules"
fi

APPROVED_PLAN="$TMP_DIR/valid-approved.mdx"
write_valid_plan "$APPROVED_PLAN" approved
expect_pass "approved execution gate" "$APPROVED_PLAN"

EXECUTING_PLAN="$TMP_DIR/valid-executing.mdx"
write_valid_plan "$EXECUTING_PLAN" executing
expect_pass "executing execution gate" "$EXECUTING_PLAN"

PARTIAL_PLAN="$TMP_DIR/valid-partial.mdx"
write_valid_plan "$PARTIAL_PLAN" executing
perl -0pi -e 's/- \[ \] GP-10/- [x] GP-10/g; s/phases_done: 0/phases_done: 1/; s/tasks_done: 0/tasks_done: 2/' "$PARTIAL_PLAN"
expect_pass "derived completed phase counters" "$PARTIAL_PLAN"

DONE_PLAN="$TMP_DIR/valid-done.mdx"
write_valid_plan "$DONE_PLAN" done
expect_fail "done execution gate" "requires status approved or executing" "$DONE_PLAN"
expect_pass "done structural validation" --allow-planning "$DONE_PLAN"

new_case
perl -0pi -e 's/tasks_total: 3/tasks_total: 4/' "$CASE_FILE"
expect_fail "wrong task total" "tasks_total is 4, derived value is 3" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/tasks_done: 0/tasks_done: 1/' "$CASE_FILE"
expect_fail "wrong task done count" "tasks_done is 1, derived value is 0" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/phases_total: 2/phases_total: 3/' "$CASE_FILE"
expect_fail "wrong phase total" "phases_total is 3, derived value is 2" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/phases_done: 0/phases_done: 1/' "$CASE_FILE"
expect_fail "wrong phase done count" "phases_done is 1, derived value is 0" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/GP-102 \[W1\.1\]/GP-101 [W1.1]/' "$CASE_FILE"
expect_fail "duplicate task definitions" "duplicate task definition ID GP-101" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/## Phase 2: Verification/## Phase 3: Verification/' "$CASE_FILE"
expect_fail "non-sequential phase numbers" "expected Phase 2, found Phase 3" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/GP-101 \[W1\.1\]/GP-101/' "$CASE_FILE"
expect_fail "missing task wave" "GP-101 has malformed task heading" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/GP-101 \[W1\.1\]/GP-101 [W2.1]/' "$CASE_FILE"
expect_fail "task wave phase mismatch" "GP-101 wave phase 2 does not match Phase 1" --allow-planning "$CASE_FILE"

for field in Files "Depends on" Reuses Acceptance Verify Requirements; do
  new_case
  FIELD="$field" perl -0pi -e 's/^  - \Q$ENV{FIELD}\E:.*\n//m' "$CASE_FILE"
  expect_fail "missing $field field" "GP-101 missing required field: $field" --allow-planning "$CASE_FILE"
done

new_case
perl -0pi -e 's/Depends on: GP-101/Depends on: GP-999/' "$CASE_FILE"
expect_fail "unknown dependency" "GP-102 depends on undefined task GP-999" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/Depends on: none/Depends on: GP-201/' "$CASE_FILE"
expect_fail "forward dependency" "GP-101 depends on later task GP-201" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/Depends on: GP-101/Depends on: sometimes GP-101/' "$CASE_FILE"
expect_fail "malformed dependency" "GP-102 has malformed Depends on value" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/R-CODE-21/R-NOPE-1/' "$CASE_FILE"
expect_fail "unknown domain requirement" "undefined requirement R-NOPE-1" --allow-planning "$CASE_FILE"

new_case
CODE_MAX=$(perl -ne 'print $1 if /^\s+CODE => (\d+),/' "$REPOSITORY_VALIDATOR")
CODE_OOR="R-CODE-$((CODE_MAX + 1))"
perl -0pi -e "s/R-CODE-21/$CODE_OOR/" "$CASE_FILE"
expect_fail "out-of-range domain requirement" "undefined requirement $CODE_OOR" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/R-1\.1, R-CODE-21/R-9.9, R-CODE-21/' "$CASE_FILE"
expect_fail "unknown local requirement" "undefined requirement R-9.9" --allow-planning "$CASE_FILE"

new_case
perl -CSD -e 'print chr(0x2014), "\n"' >> "$CASE_FILE"
expect_fail "banned Unicode" "banned Unicode" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/## Open Questions\n/## Questions\n/' "$CASE_FILE"
expect_fail "missing Open Questions" "expected exactly one ## Open Questions section, found 0" --allow-planning "$CASE_FILE"

new_case
printf '\n## Open Questions\n\nDuplicate.\n' >> "$CASE_FILE"
expect_fail "duplicate Open Questions" "expected exactly one ## Open Questions section, found 2" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/## Phase 2: Verification/## Phase 2: Release/' "$CASE_FILE"
expect_fail "missing final Verification phase" "final phase must be Verification" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/^name:.*\n//m' "$CASE_FILE"
expect_fail "missing frontmatter field" "missing frontmatter field: name" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/^  tasks_done:.*\n//m' "$CASE_FILE"
expect_fail "missing progress counter" "missing progress counter: tasks_done" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/plan_version: 1/plan_version: zero/' "$CASE_FILE"
expect_fail "invalid plan version" "plan_version must be a positive integer" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/updated: 2026-07-13/updated: July 13/' "$CASE_FILE"
expect_fail "invalid updated date" "updated must use YYYY-MM-DD" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/status: planning/status: paused/' "$CASE_FILE"
expect_fail "invalid lifecycle status" "invalid status 'paused'" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/mode: greenfield/mode: rewrite/' "$CASE_FILE"
expect_fail "invalid plan mode" "invalid mode 'rewrite'" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/product_form: cli-or-sdk/product_form: website/' "$CASE_FILE"
expect_fail "invalid product form" "invalid product_form 'website'" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/public_release: false/public_release: maybe/' "$CASE_FILE"
expect_fail "invalid public release flag" "public_release must be true or false" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/R-1\.1, R-CODE-21/R-1.1, R-SEC-26/' "$CASE_FILE"
expect_fail "non-public plan with hardening role marker" "public_release false must not cite R-SEC-26" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/R-1\.1, R-CODE-21/R-1.1, R-ROAD-21/' "$CASE_FILE"
expect_fail "non-public plan with prepublication gate role marker" "public_release false must not cite R-ROAD-21" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/R-1\.1, R-CODE-21/R-1.1, R-LAUNCH-22/' "$CASE_FILE"
expect_fail "non-public plan with activation role marker" "public_release false must not cite R-LAUNCH-22" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/^source_revision:.*\n//m' "$CASE_FILE"
expect_fail "missing source revision" "missing frontmatter field: source_revision" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/input_digest: sha256:[0-9a-f]+/input_digest: latest/' "$CASE_FILE"
expect_fail "invalid input digest" "input_digest must be sha256" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/input_digest: sha256:[0-9a-f]+/input_digest: sha256:0000000000000000000000000000000000000000000000000000000000000000/' "$CASE_FILE"
expect_fail "placeholder input digest" "input_digest must not use the all-zero placeholder" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/validated_at: 2026-07-13T12:00:00Z/validated_at: yesterday/' "$CASE_FILE"
expect_fail "invalid validation timestamp" "validated_at must use UTC ISO-8601" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/## Plan provenance\n\n/## Evidence\n\n/' "$CASE_FILE"
expect_fail "missing Plan provenance" "expected exactly one ## Plan provenance section, found 0" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/Evidence inventory:/Evidence list:/' "$CASE_FILE"
expect_fail "incomplete Plan provenance" "Plan provenance is missing Evidence inventory:" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/Source revision: none/Source revision: 0123456789abcdef0123456789abcdef01234567/' "$CASE_FILE"
expect_fail "mismatched provenance source revision" "Plan provenance Source revision does not match frontmatter source_revision" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/Input digest: sha256:[0-9a-f]{64}/Input digest: sha256:cf2597de8c02e80d716a6c4a97d4c03cd75a566771121170be7c46bcf3b709e5/' "$CASE_FILE"
expect_fail "mismatched provenance input digest" "Plan provenance Input digest does not match frontmatter input_digest" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/Validated at: 2026-07-13T12:00:00Z/Validated at: 2026-07-14T12:00:00Z/' "$CASE_FILE"
expect_fail "mismatched provenance validation timestamp" "Plan provenance Validated at does not match frontmatter validated_at" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/^- `intake` = `sha256:[0-9a-f]{64}`\n//m' "$CASE_FILE"
expect_fail "empty provenance inventory" "Plan provenance Evidence inventory must contain at least one item" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/`intake`/`readme`/' "$CASE_FILE"
expect_fail "provenance inventory missing intake" "Plan provenance Evidence inventory must contain exactly one intake item" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/- `intake` = `sha256:([0-9a-f]{64})`/- intake = sha256:$1/' "$CASE_FILE"
expect_fail "malformed provenance inventory" "malformed Plan provenance inventory item" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/(- `intake` = `sha256:[0-9a-f]{64}`)/$1\n$1/' "$CASE_FILE"
expect_fail "duplicate provenance inventory label" "duplicate Plan provenance inventory label: intake" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/(Source revision: none)/$1\n$1/' "$CASE_FILE"
expect_fail "duplicate provenance field label" "Plan provenance has duplicate Source revision label" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/sha256:1111111111111111111111111111111111111111111111111111111111111111`/sha256:2222222222222222222222222222222222222222222222222222222222222222`/' "$CASE_FILE"
expect_fail "mismatched provenance aggregate digest" "Plan provenance Input digest does not match the Evidence inventory aggregate" --allow-planning "$CASE_FILE"

PROVENANCE_PLAN="$TMP_DIR/valid-multi-item-provenance.mdx"
cp "$BASE_PLAN" "$PROVENANCE_PLAN"
perl -0pi -e '
  s/1c7ca1006bb3157ad989c1f1dd1cd1d6e8e2a44d9509821ffa43f3be205a12d5/cf2597de8c02e80d716a6c4a97d4c03cd75a566771121170be7c46bcf3b709e5/g;
  s/- `intake` = `sha256:1111111111111111111111111111111111111111111111111111111111111111`/- `readme` = `sha256:2222222222222222222222222222222222222222222222222222222222222222`\n- `intake` = `sha256:1111111111111111111111111111111111111111111111111111111111111111`/
' "$PROVENANCE_PLAN"
expect_pass "valid provenance inventory aggregate" --allow-planning "$PROVENANCE_PLAN"

new_case
perl -0pi -e 's/## Product form\n/## Delivery form\n/' "$CASE_FILE"
expect_fail "missing Product form" "expected exactly one ## Product form section, found 0" --allow-planning "$CASE_FILE"

new_case
perl -0pi -e 's/public_release: false/public_release: true/' "$CASE_FILE"
expect_fail "public release requires prepublication gate" "public release requires a prepublication gate task" --allow-planning "$CASE_FILE"

PUBLIC_PLAN="$TMP_DIR/valid-public-release.mdx"
cp "$BASE_PLAN" "$PUBLIC_PLAN"
perl -0pi -e '
  s/public_release: false/public_release: true/;
  s/(- \[ \] GP-101.*?  - Requirements: )[^\n]+/$1R-1.1, R-SEC-26/s;
  s/(- \[ \] GP-102.*?  - Acceptance: )[^\n]+/$1fresh prepublication check records checked_at, hardening_revision, finding_counts, policy, verdict, owner, justification, accepted_at, and expires_at after current hardening evidence; any later change invalidates the pass/s;
  s/(- \[ \] GP-102.*?  - Requirements: )[^\n]+/$1R-1.1, R-ROAD-21/s;
  s/(- \[ \] GP-201.*?  - Depends on: )[^\n]+/$1GP-102/s;
  s/(- \[ \] GP-201.*?  - Requirements: )[^\n]+/$1R-1.1, R-LAUNCH-22/s
' "$PUBLIC_PLAN"
expect_pass "public release with ordered hardening gate activation chain" --allow-planning "$PUBLIC_PLAN"

GATE_BEFORE_HARDENING_PLAN="$TMP_DIR/gate-before-hardening.mdx"
cp "$PUBLIC_PLAN" "$GATE_BEFORE_HARDENING_PLAN"
perl -0pi -e 's/R-SEC-26/R-TEMP-1/; s/R-ROAD-21/R-SEC-26/; s/R-TEMP-1/R-ROAD-21/' "$GATE_BEFORE_HARDENING_PLAN"
expect_fail "prepublication gate before hardening" "prepublication gate must follow the latest hardening task" --allow-planning "$GATE_BEFORE_HARDENING_PLAN"

GATE_WITHOUT_HARDENING_DEPENDENCY_PLAN="$TMP_DIR/gate-without-hardening-dependency.mdx"
cp "$PUBLIC_PLAN" "$GATE_WITHOUT_HARDENING_DEPENDENCY_PLAN"
perl -0pi -e 's/(- \[ \] GP-102.*?  - Depends on: )GP-101/$1none/s' "$GATE_WITHOUT_HARDENING_DEPENDENCY_PLAN"
expect_fail "prepublication gate without hardening dependency" "prepublication gate must depend on the latest hardening task GP-101" --allow-planning "$GATE_WITHOUT_HARDENING_DEPENDENCY_PLAN"

ACTIVATION_WITHOUT_GATE_DEPENDENCY_PLAN="$TMP_DIR/activation-without-gate-dependency.mdx"
cp "$PUBLIC_PLAN" "$ACTIVATION_WITHOUT_GATE_DEPENDENCY_PLAN"
perl -0pi -e 's/(- \[ \] GP-201.*?  - Depends on: )GP-102/$1GP-101/s' "$ACTIVATION_WITHOUT_GATE_DEPENDENCY_PLAN"
expect_fail "public activation without gate dependency" "public activation must depend on the prepublication gate GP-102" --allow-planning "$ACTIVATION_WITHOUT_GATE_DEPENDENCY_PLAN"

INTERVENING_TASK_PLAN="$TMP_DIR/intervening-task-before-activation.mdx"
cp "$PUBLIC_PLAN" "$INTERVENING_TASK_PLAN"
perl -0pi -e 's/tasks_total: 3/tasks_total: 4/; s/(Checkpoint: malformed plans fail with a diagnostic\.)/- [ ] GP-103 [W1.1] Intervene after the prepublication gate\n  - Files: docs\/release\/notes.md\n  - Depends on: GP-102\n  - Reuses: release fixture\n  - Acceptance: release notes exist\n  - Verify: `test -s docs\/release\/notes.md`\n  - Requirements: R-1.1, R-CODE-21\n\n$1/' "$INTERVENING_TASK_PLAN"
expect_fail "task between prepublication gate and activation" "public activation must immediately follow the prepublication gate GP-102" --allow-planning "$INTERVENING_TASK_PLAN"

DUPLICATE_ACTIVATION_PLAN="$TMP_DIR/duplicate-public-activation.mdx"
cp "$PUBLIC_PLAN" "$DUPLICATE_ACTIVATION_PLAN"
perl -0pi -e 's/R-1\.1, R-ROAD-21/R-1.1, R-ROAD-21, R-LAUNCH-22/' "$DUPLICATE_ACTIVATION_PLAN"
expect_fail "duplicate public activation markers" "public release requires exactly one first activation task citing R-LAUNCH-22, found 2" --allow-planning "$DUPLICATE_ACTIVATION_PLAN"

if [ "$FAIL_COUNT" -ne 0 ]; then
  printf '\n%d passed, %d failed\n' "$PASS_COUNT" "$FAIL_COUNT" >&2
  exit 1
fi

printf '\n%d validator regression checks passed\n' "$PASS_COUNT"
