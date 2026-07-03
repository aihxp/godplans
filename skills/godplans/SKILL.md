---
name: godplans
description: "Produce a complete, agent-executable master plan (PLAN.mdx) for a software project before any code is written. One command runs discovery, forces every hard-to-reverse decision, and plans product, architecture, roadmap, stack, repo, build, deploy, observability, launch, security, code quality, style genome, database, LLM integration, SEO, UI, UX, and agent memory upfront, with every after-the-fact audit inverted into plan-time acceptance criteria so the finished project passes those audits on first run. Emits checkbox tasks with verify commands any coding agent can execute. Use when the user says: plan this project, godplans, master plan, plan everything upfront, idea to plan, plan before code, audit-proof plan, replan, or starts a greenfield project or major feature. Refuses plan theater (sections filled, decisions absent), vague tasks without verification, and projects whose core purpose violates the Anthropic Usage Policy."
license: MIT
metadata:
  version: "1.0.0"
  author: aihxp
  homepage: https://github.com/aihxp/godplans
---

> Invocation: `/godplans` in Claude Code, Cursor, VS Code, Zed, and Factory; `$godplans` in Codex; `@godplans` in Windsurf; auto-triggered elsewhere. Treat any text after the command as the argument: an idea, a path, or a constraint. There are no sub-commands.

# godplans

Plan everything before anything. godplans is a planning superskill: it runs the entire decision arc of a software project upfront and emits one master plan, `.godplans/PLAN.mdx`, that a coding agent can execute task by task, checkbox by checkbox, without needing anything else decided along the way.

The core move is inversion. Auditors run after the work exists and tell you what is wrong. godplans takes every dimension those auditors check (code quality, security, database, LLM integration, SEO, UI, UX) and every discipline the arc tiers enforce (PRD, architecture, roadmap, stack, repo, build, deploy, observability, launch, hardening) and converts each check into a plan-time requirement with an acceptance criterion on a concrete task. A project built from a godplans plan passes its audits on the first run because the audit was satisfied by design, not by remediation.

godplans descends from: aihxp/arc-ready and aihxp/ready-suite (the tier disciplines), aihxp/codeauditor, secauditor, dbauditor, llmauditor, seoauditor, uiauditor, and uxauditor (the inverted audit dimensions), aihxp/pillars (agent memory), aihxp/codedna (style genome), and BuilderIO visual-plan (plan discipline and the visual layer).

## Ground rules (non-negotiable)

1. **Planning is read-only.** Make no source edits while building the plan. The only files godplans writes are under `.godplans/`.
2. **Every plan element is exactly one of three things**: a grounded decision with rationale, a flagged hypothesis with a validation plan, or a named open question with a recommended default. Anything that is none of the three is theater; rewrite or delete it.
3. **The substitution test.** For any sentence in the plan, substitute a near-equivalent (a competitor, another framework, another product). If it still reads plausibly, it decides nothing specific and fails. Cut it or make it specific.
4. **Standalone-plan rule.** No revision language, no chat-context dependencies. A reader who never saw this conversation must understand the plan completely.
5. **Decide the hard-to-reverse bets first.** Wire formats, public identifiers, data-model shape, auth and ownership boundaries come before anything scoped or cosmetic.
6. **Reuse-first.** Every task names what it reuses (existing schema, components, helpers, services) before what it adds.
7. **Never pad, never stub.** No single-step plans, no filler sections, no placeholder content. If a domain does not apply, exclude it with a stated reason; do not fill it with generic prose.
8. **Read the module before authoring.** Each domain has a reference module under `references/`. Read it at the moment you author that plan section. Do not author from memory; the modules carry the inverted audit checks, and memory drifts.
9. **Compliance is standing.** Follow `references/compliance.md` for the whole session: never coach a model past a refusal, never route subscription OAuth outside official clients, and screen the project itself against the Anthropic Usage Policy before planning it.

## Method

Run the phases in order. Do not skip a phase; a phase that does not apply still gets a one-line disposition so the trail is complete.

### Phase 0: Orient

Detect what exists. Look for:

- `.godplans/PLAN.mdx` -> **replan mode** (see Modes below).
- Source code (manifests like `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`) -> **brownfield mode**.
- Neither -> **greenfield mode**.

Record the mode. In brownfield mode, fingerprint before planning: read the manifests, entry points, directory shape, and enough representative source to capture the existing stack, structure, and style genome (naming, idioms, formatting habits). The plan must extend what exists, not fight it. This pass is read-only.

### Phase 1: Compliance gate

Read `references/compliance.md` and screen the project idea against it before investing in discovery.

- **Hard stop**: the core purpose is prohibited (fake-review farms, engagement bots, phishing kits, scrapers that evade platform safeguards, undisclosed AI passing as human, malware). Say plainly why, cite the policy category, and stop. Do not produce a plan.
- **Mitigate**: the project is legitimate but has a risky component (consumer chatbot, high-risk consumer domain, web automation, scraping). Continue, and inject the module's mitigation requirements into the plan as mandatory tasks.
- **Pass**: note "Compliance gate: pass" and continue.

The result, one short section, goes into the plan.

### Phase 2: Intake and applicability

Read `references/discovery.md`. Establish:

1. **Archetype**: cli-tool, api-service, saas-dashboard, marketing-site, library, mobile-app, ml-pipeline, extension, game, or hybrid (see the module for the detection rules).
2. **Applicability matrix**: every planning domain in the table below is either applicable or excluded with a stated reason. A CLI tool excludes seo and ui with reasons; it does not get empty SEO sections. The matrix goes into the plan verbatim.
3. **Scale calibration**: weekend project, side project, funded product, or enterprise system. Requirements scale with the calibration; a guestbook does not get a compliance program.

### Phase 3: Discovery

Read `references/discovery.md` for the interview protocol. Ask at most one batch of 3 to 5 high-leverage questions, each with a recommended default so the user can answer "defaults" and proceed. Everything not asked becomes a stated assumption in the plan, flagged as a hypothesis. Surface the hard-to-reverse bets now; they are the questions worth spending the batch on.

### Phase 4: Domain passes

For each applicable domain, in this order, read its module and author that plan section:

| Order | Domain | Module | Descends from |
|---|---|---|---|
| 1 | Product (PRD) | `references/product.md` | prd-ready |
| 2 | Architecture | `references/architecture.md` | architecture-ready |
| 3 | Stack | `references/stack.md` | stack-ready |
| 4 | Database | `references/database.md` | dbauditor |
| 5 | Security | `references/security.md` | secauditor, harden-ready |
| 6 | LLM integration | `references/llm.md` | llmauditor |
| 7 | UX | `references/ux.md` | uxauditor |
| 8 | UI | `references/ui.md` | uiauditor |
| 9 | SEO and AI visibility | `references/seo.md` | seoauditor |
| 10 | Code quality | `references/code-quality.md` | codeauditor |
| 11 | Style genome | `references/style-genome.md` | codedna |
| 12 | Agent memory | `references/agent-memory.md` | pillars |
| 13 | Repository | `references/repo.md` | repo-ready |
| 14 | Application build | `references/build.md` | production-ready |
| 15 | Roadmap and tasks | `references/roadmap.md` | roadmap-ready, kickoff-ready |
| 16 | Deployment | `references/deploy.md` | deploy-ready |
| 17 | Observability | `references/observe.md` | observe-ready |
| 18 | Launch | `references/launch.md` | launch-ready |

Each module gives you: the decisions to force (answer them all), the plan requirements (satisfy them all or mark them excluded with reason), task seeds (instantiate the relevant ones), a self-audit rubric (used in Phase 6), and the anti-patterns it refuses (do not commit them).

Excluded domains get one line in the applicability matrix and nothing else.

### Phase 5: Inversion pass

Walk every applicable module's Plan requirements section and verify each requirement landed somewhere concrete: a decision in the Decisions section, an acceptance criterion on a task, or an entry in Open Questions with a recommended default. Distribute requirement IDs (R-PRD-3, R-SEC-12, R-DB-4) onto tasks via their `Requirements:` lines so traceability is grep-able. A requirement that landed nowhere is a hole; fix it before Phase 6.

### Phase 6: Self-audit gate

Read `references/exemplar.md` first; it is the calibration for what full marks mean. Then score the draft plan against every applicable module's rubric, 0 to 100 per domain. Any domain below 85: revise that section and rescore. Do not lower the bar; raise the plan. Print the scorecard in chat when done. A plan that would not survive its own descendant auditors does not ship.

### Phase 7: Emit and hand off

1. Read `references/plan-format.md` and `templates/PLAN.template.mdx`. Assemble `.godplans/PLAN.mdx` per that contract: frontmatter machine state, mermaid visuals where they carry weight, phases and waves, GP-numbered checkbox tasks with Files, Depends on, Acceptance, Verify, and Requirements lines, one Open Questions section at the bottom, executor rules, session log.
2. Validate mechanically before presenting: every task has a Verify command; every requirement ID cited on a task exists in a module; checkbox count matches the frontmatter counters; no banned characters (see plan-format.md).
3. Present in chat: the objective, the mode and archetype, the applicability matrix, the scorecard, task and phase counts, the open questions with recommended defaults, and the executor protocol in three lines. Presenting the plan is the sign-off request; wait for approval before anyone builds.

## Modes

- **Greenfield**: the full method above.
- **Brownfield**: Phase 0 fingerprints the existing codebase first. The style genome is extracted, not invented; the stack section records what is and plans only deliberate changes; tasks reference real existing files. The plan extends the codebase, never restarts it.
- **Replan**: `.godplans/PLAN.mdx` exists. Re-derive state from disk: count checked and unchecked tasks, read the session log, then reconcile. Completed tasks are never renumbered, reworded, or unchecked. New and changed work gets new task IDs. Superseded unstarted tasks are struck through with a one-line reason, not deleted. Bump the plan version and record the delta in the session log.

## After the plan: execution

godplans plans; it does not build. The emitted PLAN.mdx is self-sufficient: it carries its own executor rules, so any coding agent (this one, or another tool entirely) can execute it by reading the file. When the user asks you to execute a godplans plan, follow the "Rules for executing agents" section inside PLAN.mdx itself, not this skill. When execution drifts from the plan, the plan is patched (replan mode), because the document, not the chat, is the source of truth.

## What godplans refuses

- **Plan theater**: sections filled, decisions absent. Every section either decides something specific or names the open question.
- **Invisible plans**: prose that substitutes cleanly into any other project. Specificity is the discipline.
- **Vague tasks**: any task without grep-verifiable acceptance criteria and an exact verify command does not ship.
- **Feature laundry lists**: features without prioritization and sequencing are not a roadmap.
- **Scope leak at plan time**: godplans does not write application code, scaffold repos, or run deploys. It plans them.
- **Policy-violating projects**: the Phase 1 gate is not advisory. Prohibited purposes get a refusal with the policy category named.
- **Silent domain skipping**: a domain is either planned or excluded with a reason in the matrix. Never silently absent.

## File map

| File | Role |
|---|---|
| `SKILL.md` | This orchestrator |
| `references/plan-format.md` | The PLAN.mdx contract: structure, task format, MDX safety, executor rules |
| `references/discovery.md` | Intake, archetype detection, applicability matrix, interview protocol |
| `references/compliance.md` | Anthropic Usage Policy gate and account-safety rules |
| `references/exemplar.md` | Worked GOOD and BAD plan fragments; the quality bar |
| `references/<domain>.md` | 18 domain modules (see Phase 4 table) |
| `templates/PLAN.template.mdx` | The skeleton PLAN.mdx |

## Skill version: 1.0.0
