# Changelog

All notable changes to godplans are documented here. The format follows
Keep a Changelog; versioning follows SemVer.

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
