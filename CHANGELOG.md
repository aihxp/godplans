# Changelog

All notable changes to godplans are documented here. The format follows
Keep a Changelog; versioning follows SemVer.

## [1.8.0] - 2026-07-22

Two defects fixed and one measurement gap closed, all prompted by reading
UditAkhourii/adhd (MIT), whose thesis is that mixing the generator and the
critic destroys output quality and that a menu of options is not a set of
alternatives. The technique is re-expressed here for planning; no ADHD text,
prompt, or code is copied, and nothing in this release adds a dependency,
a network call, or a harness-specific primitive.

### Changed

- **Phase 6 is now an independent audit gate, not a self-audit.** The author
  graded the author, and worse: ground rule 8 makes the author read the
  module (including its rubric) before authoring, so the generator saw the
  grading key. Phase 6 now splits into 6a score, 6b name every deduction, and
  6c revise and rescore. Scoring runs under critic posture in a separate turn,
  and in an isolated context where the harness offers one, given only the
  drafted plan and the rubric text. Each deduction must cite the section,
  quote the sentence that lost the points, and name the rubric line; a
  deduction with no quoted text is not a deduction. Every revision quotes the
  deduction it answers, and a rescore with no corresponding revision is
  discarded. The scorecard now records whether the critic ran isolated.
- **R-ARCH-4 admits an eighth system shape.** The requirement demanded exactly
  one of seven listed shapes, so a genuinely apt shape outside the list did
  not merely lose, it failed a requirement. The seven remain the presumptive
  set; an eighth is permitted only when the plan names the constraint no
  listed shape satisfies and carries the same flip point and blast radius.
- **Open Questions must escape their own framing.** When every listed option
  is a variant of one framing, the question now names the option from outside
  that framing or states which constraint eliminated it. Options that only
  vary a dial are a menu, not alternatives. `references/exemplar.md` shows the
  worked form, including one genuinely off-framing option and why it lost.

### Added

- **R-STACK-21 (named runner-up beyond the starting set).** The pre-combined
  bundles in Decisions to force are a starting set, not a ceiling. The plan
  names one viable alternative that was generated rather than selected from
  that set, with the single condition under which it would have won, or states
  that generation produced none and names the constraint that eliminated them.
  This records the alternative without promoting it: the incumbent bias in
  R-STACK-7 and R-STACK-12 is deliberate and stands. Scored inside the
  existing Candidate coverage dimension, so the stack rubric still totals 100.
- **A control arm for the evaluation harness (`scripts/eval.sh --baseline`).**
  Every case previously scored godplans against godplans' own expectations, so
  the matrix could prove conformance but never that the skill beats the same
  agent unaided. `--baseline` runs each case a second time through
  `GODPLANS_EVAL_BASELINE_RUNNER` with no skill loaded, scores it against the
  identical expectations, and reports a per-case and aggregate delta. The
  control arm is a measurement, never a gate: its misses cannot change the
  exit code and are not reported as failures.
- **`evals/runners/codex-baseline.sh`**, a deliberately fair control: same
  agent, model, reasoning effort, workspace, fixture, and request; a plain ask
  for a thorough plan so it has a real chance at every scored dimension; no
  skill link and no leaked format contract, requirement IDs, validator, or
  phase method; and a plan accepted at any plausible path. A control denied a
  fair attempt measures the rigging, not the skill.
- Harness regression tests covering the control arm: both misuse guards
  (missing baseline runner, and a control that is the skill runner), artifact
  retention, delta and aggregate reporting, and the invariant that control
  misses never surface as skill-arm misses or change the exit code.
- `evals/cases/greenfield-saas` asserts the stack domain is applicable and
  that R-STACK-21 lands.
- `evals/README.md` documents the control arm, its fairness rules, and two
  limits now stated rather than hidden: single-sample cases carry no variance,
  and one shipped runner cannot separate godplans' contribution from Codex's.

## [1.7.0] - 2026-07-16

### Added

- R-ARCH-20 (API contract), the plan-side mirror of godaudits A-ARCH-23 and
  A-SEC-33. When the system exposes an API or service surface, PLAN.mdx settles
  the API style (REST, GraphQL, or RPC), a consumer-safe versioning strategy, the
  machine-readable contract (an OpenAPI document or a GraphQL schema), a single
  error envelope (RFC 7807 Problem Details or a documented equivalent), and the
  interaction-safety postures: an idempotency key on retryable unsafe operations
  and connection authentication plus resource bounds on any real-time (WebSocket
  or SSE) surface. The architecture module's `%catalog_max` was regenerated from
  the reference (ARCH 19 to 20) with no hand-edit to the validator.

## [1.6.0] - 2026-07-16

### Changed

- Derive-not-duplicate refactor. The validator's `%catalog_max` block is now
  generated from the reference modules by `npm run catalog` instead of being
  hand-maintained, and `catalog:check` (gated in `npm run check`) verifies it,
  adding a requirement no longer desyncs the validator. The out-of-range
  regression fixture computes `max+1` from the catalog instead of hard-coding an
  id, so it never breaks on growth.

### Added

- `npm run version:sync` writes the single source of version truth (package.json)
  into every version surface and regenerates the prompt; `version:check` verifies
  and prints the fix command (gated in `check`). `npm run release:prepare --
  <bump>` bumps, syncs, and stubs a CHANGELOG entry in one command. This release
  was cut with release:prepare.

## [1.5.0] - 2026-07-16

### Added

- R-REPO-21: the plan derives a documentation manifest from its applicability
  matrix, product form, scale, and risk or regulatory profile, tagging each
  document required, recommended, or not-applicable with the signal that set it,
  and names the governance documents (initiation brief with charter, business
  case, and stakeholders/RACI; requirements-traceability matrix; closeout with
  lessons) required at funded-product-with-regulated-data or enterprise scale.
  Documentation is scaled to the project, not a fixed checklist.

## [1.4.0] - 2026-07-16

### Added

- Compliance plan-time requirements:
  - R-SEC-29: consent and regulated-data governance (consent/lawful-basis before
    non-essential trackers with a server-honored opt-out; ROPA, DPA/BAA,
    transfer basis, and regulated-data scope as plan artifacts).
  - R-SEC-30: applicable compliance frameworks identified by where users live and
    what data is handled (GDPR/CCPA/PIPEDA, WCAG 2.2 AA/AODA/Section 508, SOC 2/
    ISO 27001, PCI DSS/HIPAA), mapped to the controls that evidence each and
    framed as technical-readiness, not certification.
  - R-UI-21: WCAG 2.2 AA pointer target size (2.5.8) and focus appearance (2.4.11)
    with a named conformance target.
  - R-CODE-24: behavioral requirements (concurrency, gating flags, state
    transitions, non-primary caller paths, runtime consent/accessibility) verified
    against the running app by an end-to-end or browser harness, not only unit
    tests or static greps.

## [1.3.0] - 2026-07-16

### Added

- Behavioral plan-time requirements that force controls to be wired, not merely
  present, closing gaps a control-presence audit misses:
  - R-SEC-27: authorization parity across every caller path to a privileged
    operation (interactive session, API key or token, publicly exported
    function, action-in-query-context, agent or tool call), with suspension and
    step-up enforced at the data or function tier, not only at a page gate.
  - R-SEC-28: caller-supplied selectors (id, email, slug, hostname, model
    output) are ownership-bound to the authenticated principal before use, with
    proof-of-control required for email and hostname; public checkout,
    unauthenticated verification, and agent or tool arguments named as the
    highest-risk cases.
  - R-DB-23: money flows reconcile end to end across charge, invoice,
    settlement, refund, and payout or transfer, with provider status confirmed
    before a record is marked final and transfers reversed on refund.
  - R-CODE-23: control flags meant to gate behavior are read on the enforcement
    path, lifecycle transitions never release a still-committed resource early
    or out of order, and scheduling uses the entity timezone rather than UTC.
- Two security anti-patterns refused at plan time: primary-path-only
  authorization and the trusted-selector confused deputy.

## [1.2.0] - 2026-07-13

### Added

- Product-form routing before archetype and domain composition, with distinct
  vertical slices, build concerns, and completion evidence for web, API or
  service, CLI or SDK, mobile or desktop, data or ML, and infrastructure or
  IaC plans.
- Plan provenance fields for source revision, SHA-256 input digest, and UTC
  validation time, plus resume rules that return materially stale completed or
  imported evidence to planning.
- Conditional public-release gates bound to current hardening evidence, with
  complete, expiring Critical-risk acceptance records and invalidation after
  any later hardening change.
- Pinned official Agent Skills validation, a release-check entry point,
  immutable GitHub Action pin enforcement, and tag-to-release version parity.
- Behavioral cases and blocking gate invariants for product forms, Pillars 1.1
  nested scopes, stale source and prepublication evidence, and observability
  evidence labels.

### Changed

- Agent-memory planning now targets Pillars 1.1.0: 11 Core and 11 Common
  concerns, five evidence states, optional local absent catalogs, path-derived
  sub-pillar identities, deterministic ASCII token routing, nested-scope
  precedence, context budgets, recursive validation, and routing fixtures.
- Observability plans now separate `installation-ready` controlled-fire
  evidence from `operationally-mature` real-event evidence and forbid treating
  synthetic signals as incident history.
- The portable validator now checks provenance, product form, and conditional
  public-release gate structure while retaining Bash 3.2 and stock Perl
  portability on macOS and Linux.

## [1.1.0] - 2026-07-13

### Added

- A self-contained PLAN.mdx validator that checks lifecycle state, derived
  counters, phase and task grammar, ordered dependency and requirement
  references, banned characters, Open Questions uniqueness, and the final
  Verification phase.
- An explicit `planning -> approved -> executing -> done` lifecycle with an
  execution gate and fresh approval after a material replan.
- A behavioral evaluation matrix for greenfield, brownfield, replan,
  scale-calibration, and compliance-refusal behavior, plus a real Codex runner.
- Saved-artifact rescoring for behavioral evaluations without another model
  call, while preserving complete-artifact validation.
- Regression suites for installer ownership, validator failures, portable
  prompt completeness, linter non-mutation, and evaluation harness behavior.

### Changed

- PROMPT.md now includes the orchestrator, every reference module, the quality
  exemplar, the validator, and the PLAN template as a full-fidelity fallback.
- Product language now describes audit-aware prevention and independent final
  verification instead of promising an audit-clean first run.
- Version parity, JSON parsing, shell syntax, product surfaces, and evaluation
  case integrity are enforced by the repository linter and CI.
- Weekend calibration now enforces an 8-task, 3-phase ceiling and requires
  task appetites to fit the stated capacity.
- Repository and lineage links now use the hannsxpeter GitHub location.

### Fixed

- `install.sh` no longer overwrites or uninstalls unowned destinations, maps
  user-facing tool aliases correctly, and rejects unknown or no-op targets.
- Plan validation no longer relies on non-enforcing grep pipelines or the
  unsupported macOS `grep -P` flag.
- Local requirement references now resolve from either colon-form definitions
  or the first column of a Markdown requirements table.
- The emission gate now refuses a PLAN handoff without its executable,
  byte-identical validator companion.
- Plan evaluation fixtures no longer contradict the companion contract, and
  semantic wording checks tolerate capitalization differences.
- Portable prompt generation no longer leaves required local references
  unavailable to plain chat surfaces.

## [1.0.0] - 2026-07-02

Initial release.

### Added

- The godplans Agent Skill: one command that runs discovery, forces every
  hard-to-reverse decision, and emits a complete, agent-executable master
  plan at `.godplans/PLAN.mdx` before any code is written.
- 18 domain reference modules descending from aihxp arc-ready and
  ready-suite (product, architecture, roadmap, stack, repo, build, deploy,
  observe, launch), the seven hannsxpeter auditors inverted into plan-time
  requirements (security from secauditor and harden-ready, code-quality
  from codeauditor, database from dbauditor, llm from llmauditor, seo from
  seoauditor, ui from uiauditor, ux from uxauditor), hannsxpeter/pillars
  (agent-memory), and hannsxpeter/codedna (style-genome).
- Four core modules: plan-format (the PLAN.mdx contract), discovery
  (intake, archetype, applicability matrix, interview), compliance
  (Anthropic Usage Policy gate and account safety), exemplar (the quality
  bar, worked).
- PLAN.mdx template with GFM-safe MDX body, GP-numbered checkbox tasks,
  waves, must-haves, executor rules, and a session log.
- Cross-tool packaging: canonical skill under `skills/godplans/`,
  `.agents/skills` and `.claude/skills` projections, `install.sh` with a
  six-destination matrix, generated `PROMPT.md` fallback for T3 Chat,
  Aider, and plain chat surfaces.
- Meta-linter (`scripts/lint.sh`) enforcing unicode cleanliness, version
  parity, spec-bound description length, module contract completeness,
  and PROMPT.md freshness; wired into CI with an installer smoke test.
