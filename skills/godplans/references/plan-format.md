# PLAN.mdx format contract

The single output of godplans is `.godplans/PLAN.mdx`. This module is the binding contract for that file: structure, task grammar, visual layer, MDX safety, and the executor rules embedded in every plan. Read this whole file before assembling a plan; do not author the plan from memory of it.

## Why MDX, and the GFM-safe rule

The plan ships as `.mdx` so it drops straight into MDX pipelines (Docusaurus, Nextra, Fumadocs) and MDX-native plan viewers. But the body is written **GFM-safe**: plain GitHub-flavored markdown that is simultaneously valid MDX. No JSX components, no ESM imports, no expressions. The same bytes parse as `.mdx` and render as `.md`. A user who wants GitHub's rich rendering renames the file to `PLAN.md` and loses nothing.

GFM-safe means these MDX hazards are banned in prose:

- No bare `<` followed by a letter (MDX reads it as a JSX tag and fails). Write `less than`, or put the expression in backticks.
- No bare `{` or `}` in prose (MDX reads them as expressions). Put anything with braces in backticks or fenced code.
- No capitalized tag-like tokens such as writing a generic type without backticks. All code fragments, generics, paths, and shell snippets go in backticks or fences, where MDX leaves them alone.
- HTML comments do not survive MDX. Do not use them; the plan has no hidden content.

Also banned everywhere in the plan, matching godplans house style: em dashes, en dashes, Unicode arrows (ASCII `->` only), box-drawing characters, emojis, smart quotes, and the ellipsis character.

## Frontmatter (machine state)

```yaml
---
name: <project-slug>
plan_version: 1
status: planning        # planning | approved | executing | done
created: YYYY-MM-DD
updated: YYYY-MM-DD
mode: greenfield        # greenfield | brownfield | replan
archetype: saas-dashboard
domains_applicable: [product, architecture, stack, database, security, ...]
domains_excluded:
  - name: seo
    reason: internal tool behind SSO; no public surface to index
progress:
  phases_total: 0
  phases_done: 0
  tasks_total: 0
  tasks_done: 0
---
```

Frontmatter is the digest, not the truth. The truth is the checkboxes; `progress` counters are derived from them and updated in the same edit that flips a box. If they ever disagree, recount from the checkboxes.

## Document skeleton, in order

1. `# <Project> master plan` and a one-paragraph objective ending with an observable definition of done.
2. `## Scope and non-goals`. Non-goals are named, not implied.
3. `## Compliance gate`. One short section: pass, or the mitigations injected (with task IDs).
4. `## Applicability matrix`. The full table: every domain, applicable or excluded, with reason.
5. `## Decisions`. Hard-to-reverse bets first: wire formats, public identifiers, data-model shape, auth and ownership boundaries. Each entry is a decision with rationale, a hypothesis with a validation plan, or a pointer to Open Questions. Where options were weighed, show the comparison in a small table.
6. `## Requirements`. Numbered user stories with EARS acceptance criteria: `R-1.1: WHEN <trigger> THE SYSTEM SHALL <observable behavior>`. Task `Requirements:` lines point here and at module IDs (R-SEC-4 style).
7. `## Architecture`. The mermaid visuals (see Visual layer) plus the prose that the diagrams support.
8. `## Style genome`. Naming, idioms, structure conventions the first commit must already follow.
9. `## Agent memory`. The AGENTS.md and pillar files the scaffold phase will emit.
10. `## Phases`. The task body; see Task grammar.
11. `## Open Questions`. Exactly one such section, at the bottom, the only enumeration of open decisions. Each question carries options and a recommended default. Committed decisions never appear here. A complex plan with zero open questions is acceptable only when every meaningful decision has been explicitly made above.
12. `## Rules for executing agents`. Copied verbatim from this module (below).
13. `## Session log`. Append-only, one line per session.

## Task grammar

Tasks live under phase headings, grouped into waves. The format is fixed; executors parse it.

```markdown
## Phase 2: Auth and accounts

Goal: a user can sign up, log in, and own their data. Blocks Phase 3.

### Wave 2.1

- [ ] GP-201 [W2.1] Create user model and migration
  - Files: src/db/schema/users.ts, migrations/0002_users.sql
  - Depends on: GP-104
  - Reuses: drizzle client from src/db/client.ts
  - Acceptance: schema exports `users` table; migration applies cleanly on empty db; email column has unique index
  - Verify: `npm run db:migrate && npm run db:check`
  - Requirements: R-2.1, R-DB-3, R-SEC-12

- [ ] GP-202 [P] [W2.1] Add password hashing helper
  - Files: src/auth/hash.ts, src/auth/hash.test.ts
  - Depends on: none
  - Acceptance: uses argon2id; test vector passes; no plaintext ever logged
  - Verify: `npm test -- hash.test.ts`
  - Requirements: R-SEC-6

Checkpoint: signup flow works end to end against a local db.

Must-haves:
- Truth: a new user row appears after signup (manual: `curl -X POST /api/signup`)
- Artifact: src/auth/hash.ts exports `hashPassword` and `verifyPassword`
- Link: signup route imports from src/auth/hash.ts, not an inline hash
```

Grammar rules:

- **IDs**: `GP-<phase><two digits>`, zero-padded, unique, stable forever. Never renumber. Grep-unique: `grep -n "GP-201" PLAN.mdx` finds exactly the task and its references.
- **`[P]`**: parallel-safe. Only when the task touches files disjoint from every other unchecked task in the same wave.
- **`[W<phase>.<wave>]`**: the wave tag. Waves within a phase run in order; tasks within a wave marked `[P]` may run concurrently.
- **Files**: exact paths. Brownfield plans name real existing files.
- **Depends on**: task IDs or `none`. No reflexive chains; a dependency exists because the work cannot start without it, not because the tasks are neighbors.
- **Acceptance**: 2 to 4 grep-verifiable or observable conditions. "Works correctly" is banned; "returns 401 without a session cookie" ships.
- **Verify**: one exact command whose exit code proves the task, in backticks. Manual checks state the exact manual path ("open /settings, toggle dark mode, reload").
- **Requirements**: comma-separated IDs from the Requirements section and domain modules. Every task traces to at least one requirement; a task tracing to nothing is scope creep.
- **Checkpoint**: every phase ends with one independently observable outcome.
- **Must-haves**: goal-backward proof: observable truths, required artifacts, and key links showing the pieces are wired, because a checked box alone cannot distinguish a real implementation from a placeholder.
- The final phase of every plan is **Verification**: run the full test suite, lint, build, and at least one end-to-end smoke that names the real command or the exact manual path.

## Visual layer

Diagrams are mermaid in fenced blocks, GitHub-native. Use them where they carry decisions, next to the prose they support:

- `graph TD` for components and trust boundaries (annotate the boundary edges).
- `erDiagram` for the data model.
- `sequenceDiagram` for the one or two load-bearing flows.
- `gantt` for phase and wave sequencing when the plan has calendar pressure; otherwise skip it.

The visual-surface gate, inherited from visual-plan: backend-only and library plans get no decorative top diagram; visuals appear inline, local to the claims they support. UI-bearing plans may lead with a screen-flow diagram. Never render a default left-to-right box chain to look busy; a diagram that decides nothing is deleted prose.

Chat surfaces often show mermaid as a code block, so the surrounding text must stand alone; tables and dependency lists carry the same facts.

## Rules for executing agents

This block is copied verbatim into every emitted plan, under `## Rules for executing agents`, wrapped in a GFM alert:

```markdown
> [!IMPORTANT]
> This plan is the source of truth. The chat is not.
>
> 1. Before any work: read the frontmatter, then find the first unchecked task in wave order. Re-derive state from checkboxes; trust nothing remembered.
> 2. One task at a time. Respect Depends on. Run tasks marked [P] concurrently only when their Files lists are disjoint.
> 3. Run the task's Verify command. Only after it passes, flip [ ] to [x] and update the frontmatter counters and `updated:` date in the same edit. Never batch check-offs.
> 4. If Verify fails: the box stays unchecked. Append an indented `- Note (YYYY-MM-DD):` line under the task saying what happened.
> 5. Scope changes are not improvised. Patch the plan first (new task IDs, struck-through superseded tasks with a reason), then execute the patch.
> 6. Never renumber, reword, or uncheck a completed task.
> 7. At session end: append one line to `## Session log`: date, tasks completed, where you stopped, what is next.
> 8. Re-read the current phase before starting it; re-read Decisions before touching anything they govern.
```

## Machine checks

An emitted plan must pass these before it is presented:

```bash
# progress counters match reality
open=$(grep -c '^- \[ \] GP-' PLAN.mdx); done=$(grep -c '^- \[x\] GP-' PLAN.mdx)
# every task has a Verify line
grep -A6 '^- \[ \] GP-' PLAN.mdx | grep -c 'Verify:'
# no banned characters
LC_ALL=C grep -nP '[\x{2013}\x{2014}\x{2018}\x{2019}\x{201C}\x{201D}\x{2026}\x{2192}\x{FE0F}\x{1F300}-\x{1FAFF}]' PLAN.mdx && exit 1
# task IDs unique
grep -o 'GP-[0-9]*' PLAN.mdx | sort | uniq -d
```

Duplicate IDs, tasks without Verify lines, counter drift, or banned characters block emission.

## Size discipline

The plan is re-read every session; bloat is a tax on every future turn. Budgets: objective under 150 words; no phase over 12 tasks (split it); no more than 7 phases before considering a second milestone plan; Open Questions under 10 entries (more means discovery is not done); Session log lines under 140 characters. When a plan outgrows these budgets, cut completed phases into `.godplans/archive/PLAN-v<n>.mdx` and keep the live plan lean.

## Replan protocol

When PLAN.mdx already exists: read it fully, recount progress from checkboxes, read the session log, then apply the delta. Completed work is history and never altered. New work gets fresh IDs continuing the sequence. Superseded unstarted tasks are struck through (`~~- [ ] GP-310 ...~~` plus a reason line), not deleted, so the audit trail survives. Bump `plan_version`, log the delta in the session log, and re-run the Phase 6 self-audit on any section that changed.
