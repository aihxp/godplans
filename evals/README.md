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
```

Supported operations are `outcome`, `frontmatter`, `domain`, `contains`,
`contains-ci`, `not-contains`, and `max-count`. `contains-ci` performs a
case-insensitive fixed-string check. Every case declares exactly one outcome.

## Publishing a baseline

Run the complete matrix once per supported agent and model family. Commit the
summary, runner version, model identifier, date, plan validator version, and
the exact commit under `evals/baselines/`. Never publish a score without the
raw generated artifacts needed to reproduce it. Model-backed evaluations are
release evidence, not a CI gate, because they require credentials and incur
cost.
