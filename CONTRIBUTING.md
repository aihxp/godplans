# Contributing to godplans

Thanks for wanting to improve godplans. This is a prompt-engineering
repository: the product is markdown that steers AI coding agents, so the
contribution rules are about discipline, not build systems.

## Ground rules

1. **The canonical skill lives at `skills/godplans/`.** The `.agents/` and
   `.claude/` directories are symlink projections; never edit through them.
2. **PROMPT.md is generated.** Change `skills/godplans/SKILL.md` or the
   inlined references, then run `bash scripts/build-prompt.sh` and commit
   the regenerated file.
3. **Style is mechanically enforced.** Run `bash scripts/lint.sh --all`
   before pushing. ASCII punctuation only: no em or en dashes, no Unicode
   arrows (write `->`), no emojis, no smart quotes, no box-drawing
   characters. CI fails on violations.
4. **Reference modules follow the six-section contract**: Lineage,
   Decisions to force, Plan requirements, Task seeds, Self-audit rubric,
   Anti-patterns refused. The linter checks presence; reviewers check
   substance.
5. **Every plan requirement must be checkable.** A requirement whose
   violation cannot be detected by reading a plan is opinion, not a
   requirement; it will be asked to change.
6. **The substitution test applies to contributions too.** Prose that reads
   equally true for any skill (or any project) is filler and gets cut.

## Making a change

1. Fork, branch from `main`.
2. Make the change in the canonical files.
3. `bash scripts/lint.sh --all --verbose` until green.
4. If SKILL.md or an inlined reference changed: `bash scripts/build-prompt.sh`.
5. If behavior changed: add a CHANGELOG entry under a new version heading and
   bump the version in SKILL.md frontmatter and its body version line
   (the linter enforces three-way parity).
6. Open a PR describing what planning failure the change prevents or what
   audit dimension it strengthens. "Makes it better" is a substitution-test
   failure.

## Reporting issues

Best issues name a concrete failure: "planned X, the emitted plan lacked Y,
the executing agent then did Z wrong." Attach the PLAN.mdx fragment when
possible (redact anything private).

## Scope

godplans plans; it does not build, deploy, or audit after the fact. Features
that make godplans execute plans, scaffold repos, or edit source will be
declined; that work belongs to the executing agent or to the sibling skills
godplans descends from.
