# Changelog

All notable changes to godplans are documented here. The format follows
Keep a Changelog; versioning follows SemVer.

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
