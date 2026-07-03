# About godplans

The long-form writeup: what godplans is, why it exists, and the design decisions behind it.

## The problem: remediation is the most expensive way to learn requirements

The AI coding ecosystem grew two families of tooling that rarely talk to each other. Arc tools (PRD writers, architecture designers, roadmap sequencers, scaffolders) decide things before and during the build. Auditors (code quality, security, database, LLM integration, SEO, UI, UX) score things after the build and hand back a prioritized list of what is wrong.

The auditor's report is always partly a bill for decisions nobody made. A missing tenant-isolation policy found after three weeks is a rewrite; the same requirement written into the plan before the first migration is one sentence. An inaccessible component library found at audit time is a sweep across every screen; an accessibility acceptance criterion on every UI task is just how the work gets done. The information in an audit report was almost all knowable at plan time. Nobody had collected it there.

godplans is that collection, done once, mechanically. It descends from eleven aihxp repositories (arc-ready and ready-suite for the arc tiers; codeauditor, secauditor, dbauditor, llmauditor, seoauditor, uiauditor, uxauditor for the audit dimensions; pillars for agent memory; codedna for the style genome) plus the plan discipline of BuilderIO's visual-plan skill. Every audit check in those skills was read, inverted into a plan-time requirement, and filed into the domain module that now enforces it. The seven auditors alone contributed several hundred concrete checks; those became the acceptance criteria a godplans plan distributes onto tasks.

The result is a definition, not a hope: a project is audit-proof when every check its auditors would run was an acceptance criterion on some task before the work started.

## The shape: one command, one file

godplans has no sub-commands. One invocation runs an eight-phase method: orient (greenfield, brownfield, or replan), compliance gate, intake and applicability, discovery (one batch of 3 to 5 questions, each with a recommended default), eighteen domain passes, the inversion pass, a self-audit gate where every applicable domain must score 85 of 100 against its module's rubric, and emission.

The output is one file, `.godplans/PLAN.mdx`. Not a directory of specs, not a wiki: one file an executing agent re-reads every session. Its body is GFM-safe MDX (plain GitHub-flavored markdown that parses as MDX), so it works in MDX pipelines and renders on GitHub after a rename to `.md`, with checkbox tasks, mermaid diagrams, and YAML frontmatter carrying machine state.

The plan is executable in a specific, testable sense: every task carries exact file paths, dependency edges, grep-verifiable acceptance criteria, one verify command whose exit code proves completion, and traceability to the requirements that justify it. The executor rules travel inside the plan itself, so the executing agent needs godplans installed not at all. Progress is derivable with grep. A phase ends with goal-backward must-haves (observable truths, required artifacts, wiring proof), because a checked box alone cannot distinguish an implementation from a placeholder.

## Design decisions worth recording

**Inversion over orchestration.** The obvious way to combine eleven skills is a pipeline that runs them in order. That preserves their after-the-fact character; the auditors would still grade finished work. godplans instead moved every check to the earliest moment it could bind: plan time. The auditors remain useful as end-of-project verification that the inversion held.

**One question batch.** Discovery tools drift toward interrogation. godplans spends its questions only on hard-to-reverse bets (data-model shape, tenancy, auth boundaries, public API commitments) and ships a recommended default with each, so "defaults" is a complete answer. Everything not asked becomes a flagged hypothesis with a validation task. Solo builders get a plan in minutes; teams get an assumptions ledger they can veto line by line.

**Applicability over completeness theater.** A CLI tool does not get an SEO section. Every domain is either planned or excluded with a reason specific to the project, recorded in a matrix. The alternative, filling every section for every project, is how plans become unread.

**The plan is the memory.** Frontmatter counters are derived from checkboxes; the session log is append-only; replan mode re-derives state from disk and never rewrites completed work. The chat is treated as untrusted cache. This is what makes the plan survive tool switches, context windows, and weeks of interruption.

**Policy compliance as a first-class module.** godplans screens every project against the Anthropic Usage Policy before planning it: hard stops for prohibited purposes, injected mitigation tasks for risky components (AI disclosure for consumer chatbots, robots.txt respect and rate limiting for crawlers, professional review in high-risk consumer domains). The skill also encodes the two behaviors most correlated with real account bans, never coaching a model past a refusal and never routing subscription OAuth outside official clients, as standing rules. A carve-out list prevents over-blocking legitimate work: authorized security testing, civic research, B2B tools.

**Mechanical enforcement of style.** The repository's own discipline is linted, not requested: no em or en dashes, no Unicode arrows, no emojis, no smart quotes anywhere; version parity across three locations; every reference module carrying its six contract sections; PROMPT.md always regenerated, never hand-edited. CI fails on violations. The skill asks plans to be checkable; the repo holds itself to the same standard.

## How it was built

godplans was designed and written by AI agents under human direction, in one session, using the same discipline it teaches: research first (eleven parallel research agents read the source skills, the Agent Skills ecosystem, the Anthropic policy corpus, and the plan-format state of the art), then a design document with every hard-to-reverse decision recorded, then parallel domain-module authors writing against a fixed contract, then mechanical verification. The lineage tables in each module's research are preserved in the repository history.

## Composing with siblings

- Plan with godplans, then execute with any agent following the embedded rules.
- Or execute with arc-ready's build tiers: the plan's tier sections map onto arc-ready's artifact contract.
- Run the seven auditors at the end as verification that the inversion held; their reports should come back clean, and where they do not, replan mode folds the findings into new tasks.
- pillars and codedna remain the living, in-repo forms of the agent-memory and style-genome sections the plan seeds.
