# godplans behavioral evaluations

The repository linter proves that the skill package is internally consistent.
These cases test the separate product question: does an agent using godplans
produce the right kind of plan for a concrete request?

## Case matrix

| Case | Mode | Archetype | Primary risk tested |
|---|---|---|---|
| greenfield-saas | greenfield | saas-dashboard | tenancy, money, security, UX, operations |
| weekend-library | greenfield | library | scale calibration and domain exclusion |
| brownfield-cli | brownfield | cli-tool | real-file fingerprinting and reuse |
| replan-preserves-history | replan | cli-tool | stable completed work and new task IDs |
| compliance-refusal | hard stop | prohibited product | refusal before discovery or planning |
| product-form-routing | greenfield | ml-pipeline | primary data or ML form plus independent API form |
| nested-pillars | greenfield | hybrid | Pillars 1.1 nested scopes, catalog, and precedence |
| stale-source-evidence | brownfield | api-service | provenance binding and stale resume handling |
| stale-prepublication | greenfield | saas-dashboard | late Critical invalidates public-release authorization |
| observability-evidence | greenfield | api-service | installation evidence separated from real-event maturity |

Every case contains:

- `REQUEST.md`: the user request and any case-specific setup.
- `EXPECTATIONS`: deterministic assertions over the response or PLAN.mdx.
- Optional `INPUT/`: a repository state the runner must copy into its isolated
  workspace before invoking the skill.

## Runner contract

Set `GODPLANS_EVAL_RUNNER` to an executable and run:

```bash
GODPLANS_EVAL_RUNNER=/absolute/path/to/runner bash scripts/eval.sh
```

An authenticated Codex CLI runner is included:

```bash
GODPLANS_EVAL_RUNNER="$PWD/evals/runners/codex.sh" bash scripts/eval.sh
```

Set `GODPLANS_EVAL_MODEL` or `GODPLANS_EVAL_REASONING_EFFORT` to override
the local Codex defaults. The runner records both values and the CLI version in
`RUNNER.txt` beside each artifact.

The runner receives two arguments:

1. Absolute path to the case `REQUEST.md`.
2. Absolute output path. It ends in `PLAN.mdx` for plan cases and
   `RESPONSE.md` for refusal cases.

The runner is responsible for creating an isolated workspace, copying a
sibling `INPUT/` directory when present, invoking the target agent with the
request, and copying the resulting artifact to argument 2. For a plan case,
the runner must retain the emitted executable validator beside the plan as
`validate-plan.sh`. The harness requires that companion to be byte-identical
to `GODPLANS_VALIDATOR`. The runner must return nonzero when the agent fails or
an expected artifact is absent.

The runner must also isolate the agent from any globally installed skills.
Codex discovers skills in `$CODEX_HOME/skills` and `$HOME/.agents/skills`
independent of the workspace, so on a maintainer's machine (where godplans is
almost always installed globally) an unisolated runner loads the skill no
matter what, and the control arm ends up measuring godplans against itself.
`codex.sh` and `codex-baseline.sh` handle this by running Codex with a
throwaway `HOME` and a throwaway `CODEX_HOME` that carries only the copied
`auth.json` and `config.toml`, never a `skills/` directory. The skill arm then
links the project-local skill into its workspace; the control arm never does.
That single link is the only intended difference between the two arms, and the
`tests/eval-harness.sh` regression asserts it.

`scripts/eval.sh` validates plan structure with the shipped plan validator,
then applies every semantic expectation. Outputs are retained under
`evals/output/<case>/` by default for inspection. CI runs `--check-cases` and
the harness regression tests without calling a model.

Rescore retained artifacts after expectation changes without another model
call:

```bash
bash scripts/eval.sh --score-only --output "$PWD/evals/output"
```

Score-only mode still rejects missing, non-executable, or drifted validator
companions. Use `bash scripts/eval.sh --help` for case selection and output
options.

## Control arm

Without a control, the matrix proves conformance and nothing more: every case
scores godplans against godplans' own expectations, so a pass shows the skill
did what it promised, not that the promise was worth loading. `--baseline`
adds the missing arm by running each case a second time through the same
agent, model, and reasoning effort with no skill available, then scoring that
output against the identical expectations.

```bash
GODPLANS_EVAL_RUNNER="$PWD/evals/runners/codex.sh" \
GODPLANS_EVAL_BASELINE_RUNNER="$PWD/evals/runners/codex-baseline.sh" \
bash scripts/eval.sh --baseline
```

Each case prints a `BASE` row with the control score and the delta, and the run
ends with an `AGGREGATE` row totaling both arms. The control arm is a
measurement and never a gate: its misses are the point, so they are not
reported as failures and cannot change the exit code.

A control arm only means something if it is fair. `codex-baseline.sh` holds
the agent, model, reasoning effort, workspace, `INPUT/` fixture, and
`REQUEST.md` identical to the skill arm, asks plainly for a thorough plan so
the control has a real chance at every scored dimension, leaks nothing from
the skill (no format contract, requirement IDs, validator, or phase method),
and accepts a plan written at any plausible path. A control that is denied a
fair attempt at a dimension it is scored on measures the rigging, not the
skill. When the control produces no plan at all, its final response is scored
instead and the assertions fail honestly rather than being hidden as a runner
error.

Expect the control to win some assertions outright. Any case where it scores
near the skill arm is a case whose expectations test formatting rather than
planning quality, and it should be tightened.

## Expectation grammar

Each non-comment line is pipe-delimited:

```text
outcome|plan|
frontmatter|mode|greenfield
domain|database|applicable
contains|workspace_id|
contains-ci|usage policy|
not-contains|PLACEHOLDER|
max-count|## Open Questions|1
gate|prepublication|hardening_revision
```

Supported operations are `outcome`, `frontmatter`, `domain`, `contains`,
`contains-ci`, `not-contains`, `max-count`, and `gate`. `contains-ci` performs
a case-insensitive fixed-string check. `gate` names a release-blocking
invariant in its second field and requires the fixed string in its third field;
one missing gate fails the case regardless of its other score. Every case
declares exactly one outcome.

## Publishing a baseline

Run the complete matrix once per supported agent and model family, with
`--baseline`, so the published record carries both arms. Commit the summary,
runner version, model identifier, date, plan validator version, and the exact
commit under `evals/baselines/`. Never publish a score without the raw
generated artifacts needed to reproduce it, and never publish a skill score
without the control score beside it: a number with no control is a
conformance report being presented as evidence of value. Model-backed
evaluations are release evidence, not a CI gate, because they require
credentials and incur cost.

Two limits of the current harness, stated rather than hidden. Each case is a
single sample, so a published delta carries no variance; repeat runs and
report the spread before treating a delta as a measurement. And only one agent
runner ships, so no result yet separates godplans' contribution from Codex's.
