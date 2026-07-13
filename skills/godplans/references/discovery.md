# Discovery module: intake, archetype, applicability, interview

Loaded in Phase 2 and Phase 3. Turns a raw idea (or an existing codebase) into the facts the domain passes need: mode, archetype, scale, the applicability matrix, and the small set of answers only the user can give. Discovery is where godplans earns the single-command promise: one focused question batch, then decisions.

## Mode detection (Phase 0 recap)

- `.godplans/PLAN.mdx` exists -> replan. Follow the replan protocol in `plan-format.md`.
- Source manifests exist (`package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `Gemfile`, `pom.xml`, `mix.exs`, `Package.swift`) -> brownfield.
- Otherwise -> greenfield.

Brownfield fingerprint, read-only, before any planning: stack and versions from manifests; directory shape and module boundaries; entry points; test and CI setup; the style genome sample (naming, file organization, error-handling idiom, comment density) from 5 to 10 representative source files; anything under `agents/`, `AGENTS.md`, `CLAUDE.md`, or `.cursor/rules/` that records existing conventions. The plan extends what exists; a brownfield plan that reads like a greenfield plan has failed before it ships.

## Archetype detection

Pick the closest archetype; hybrids name a primary and a secondary. The archetype drives the applicability matrix defaults.

| Archetype | Signals | Typical exclusions |
|---|---|---|
| cli-tool | runs in a terminal, no server, distributed as a binary or package | seo, ui (terminal output is ux, not ui), launch (often), llm |
| library | consumed by other code; the API is the product | seo, ui, observe (consumer-side), launch (registry release instead) |
| api-service | HTTP or RPC surface, no first-party frontend | seo, ui |
| saas-dashboard | authenticated web app over domain data | none by default |
| marketing-site | public content, conversion goals, little state | database (often), llm (often) |
| mobile-app | app-store distribution, native or cross-platform | seo (store listing replaces it) |
| ml-pipeline | batch or streaming data and model flows | seo, ui (unless it has an ops console) |
| extension | lives inside a host (browser, editor, platform) | seo, deploy becomes store publishing |
| game | real-time loop, assets, scenes | seo (store listing), database varies |

Signals beat labels: a "CLI tool" with a companion web dashboard is a hybrid and gets both matrices merged, dashboard rules winning conflicts.

## Scale calibration

State it in the plan; every module's requirements scale with it.

- **weekend**: throwaway or personal utility. Plan depth: decisions and a short task list. Weekend plans have at most 3 phases and 8 tasks. Sum task appetites to the user's stated capacity, combine related implementation and documentation work, and keep only requirements that materially alter behavior, public compatibility, security, or verification. Security still applies (secrets, injection), compliance still applies, and observability collapses to local error reporting or logs.
- **side-project**: real users possible, one maintainer. Deploy, backups, and error tracking are planned; SOC 2 is not.
- **funded-product**: paying users, a team, uptime matters. The full applicable matrix, honest SLOs, launch plan.
- **enterprise**: compliance regimes, multiple teams, audits. Everything, plus the compliance mapping the security module demands.

Calibration is a ceiling-setter, not an excuse: a weekend project with user passwords still hashes them with argon2id. It is also a scope ceiling: rubric coverage cannot manufacture work that exceeds the declared capacity. Cheap corners are cut openly, in the plan, as named decisions ("no staging environment: acceptable for side-project scale, revisit at 100 users"), never silently.

## The applicability matrix

Every domain gets a row. Applicable means the domain pass runs and its requirements bind. Excluded requires a reason specific to this project; "not needed" is banned by the substitution test.

```markdown
## Applicability matrix

| Domain | Status | Reason |
|---|---|---|
| product | applicable | |
| architecture | applicable | |
| stack | applicable | |
| database | applicable | |
| security | applicable | security is never excluded, only scaled |
| llm | excluded | no model calls anywhere in the product |
| ux | applicable | |
| ui | applicable | |
| seo | excluded | internal tool behind SSO; nothing to index |
| code-quality | applicable | never excluded, only scaled |
| style-genome | applicable | |
| agent-memory | applicable | |
| repo | applicable | |
| build | applicable | |
| roadmap | applicable | |
| deploy | applicable | |
| observe | applicable | |
| launch | excluded | internal tool; adoption is an email, not a launch |
```

Hard rules: security, code-quality, style-genome, repo, roadmap are never excluded (they scale down instead). seo requires a public crawlable surface. llm requires actual model integration; "we might add AI later" is a roadmap entry, not an llm pass. ui requires rendered pixels the project owns.

## The interview

One batch, 3 to 5 questions, only questions that change the plan. Rules:

1. **Spend questions on hard-to-reverse bets.** Data-model shape, multi-tenancy, auth boundary, public API commitments, pricing model when it constrains architecture. Never spend a question on something a module can decide with a stated default (formatter choice, test runner).
2. **Every question ships a recommended default**, so "defaults" is a complete answer. Format: the question, why it matters (one line), options, the recommendation marked.
3. **Batch, do not drip.** One message with all questions. Follow-ups only when an answer creates a genuine fork.
4. **Everything not asked becomes a stated assumption**, flagged in the plan as a hypothesis with a validation plan. The assumptions ledger goes into the Decisions section, labeled.
5. **Brownfield asks less.** The codebase already answered most questions; asking the user something the code answers is a discovery failure.
6. **Non-interactive fallback.** When no user is available to answer (CI, autonomous runs), take every default, mark all of them as hypotheses, and say so at the top of the plan.

Question quality bar, by example. Bad: "What database do you want?" (module decides with a default). Good: "Is a workspace's data ever visible across workspaces (shared boards, cross-org reporting)? Recommendation: no, hard tenant isolation; this decides the schema and every query." Bad: "Do you want tests?" (never a question). Good: "Is the public API versioned from day one? Recommendation: yes, `/v1/` prefix; unversioned public APIs are the most expensive reversal in this archetype."

## Output of discovery

By the end of Phase 3 the following exist, ready for the domain passes:

- Mode, archetype (with hybrid note), scale calibration.
- The applicability matrix, complete.
- The user's answers, verbatim where load-bearing.
- The assumptions ledger: every default taken, each flagged as a hypothesis.
- The hard-to-reverse bets list, each either answered or queued for the Decisions section.
- Brownfield only: the fingerprint summary (stack, structure, style genome extract, existing conventions files).

## Anti-patterns refused

- **The interrogation**: ten questions before any value. Refused: one batch, defaults offered, move.
- **The mind-reader**: zero questions, silent guesses on hard-to-reverse bets. Refused: bets get asked or get flagged as hypotheses, never silently assumed.
- **The generic matrix**: applicability copied from the archetype table without looking at the project. Refused: reasons must survive the substitution test.
- **Brownfield amnesia**: planning as if the codebase were empty. Refused: the fingerprint runs first and the plan cites real files.
- **Scale theater**: enterprise ceremony on a weekend project, or weekend sloppiness on a funded product. Refused: calibration is stated and modules scale to it.
