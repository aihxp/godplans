# Agent memory (pillars) planning module

Plans the AGENTS.md loader plus the agents/ pillar tree the project ships at scaffold time, so executing agents load correct project memory from the first commit. The orchestrator loads this module for every archetype: the pillar SET varies by archetype, but the loader, the floor pillars, and the exclusion discipline are universal. The style genome arrives as pillar content inside agents/quality.md (see style-genome.md R-DNA-16), never as additions to the AGENTS.md loader or the CLAUDE.md redirect.

## Lineage

Descends from the Pillars standard (github.com/aihxp/pillars, spec v1.0.1) and its three operational skills: pillars-init (archetype detection, AGENTS.md drop, stub creation, exclusion defaults), pillars-author (evidence-based drafting of one pillar with approval gates and a no-fabrication rule), and pillars-verify (read-only drift audit of pillar claims against actual code). The discipline that carries over: agent memory is a thin constant-size loader plus per-domain files whose frontmatter routes loading; every concern is present, stubbed, or excluded with a reason, never silently absent; prescriptive content must earn its keep by being non-inferable from code; and every claim a pillar makes is checkable against the tree, so a plan that states facts the build will not produce creates drift at birth. godplans inverts the verify pass: instead of auditing pillars after the fact, the plan specifies pillars whose claims are true by construction.

## Decisions to force

1. Archetype declaration. Question: which of the eight standard archetypes is this project (CLI tool, internal API service, SaaS dashboard/web app, marketing site, mobile app, ML pipeline, OSS library, greenfield/custom)? Hard to reverse because the archetype fixes the Core-pillar applicability matrix, the starter exclusion list, and the primary Tier 3 pillar; changing it later invalidates the whole inventory. Options: pick one archetype and cite the file signals that will exist after scaffolding; or declare custom and skip exclusion defaults. Default: pick the single closest archetype; if two fit (Next.js as dashboard vs marketing site), resolve it as a discovery question, never guess.

2. Pillar inventory and exclusion set. Question: for each of the 9 Tier 1 Core pillars (stack, arch, data, api, ui, auth, quality, deploy, observe), is it authored, stubbed, or excluded, and which Tier 2 and Tier 3 pillars join them? Hard to reverse because pillars-verify flags code appearing in an excluded area as a finding, and a silently absent pillar degrades every future agent session. Options: full authoring at birth (greenfield knows enough), stubs with Gaps questions, or structured exclusion with a project-specific reason. Default: author what the plan already decides, stub what needs the user, exclude the archetype-inapplicable with concrete reasons; resolve every maybe cell explicitly.

3. Boundary assignments. Question: which pillar owns each piece of content (secrets in config not auth; product analytics separate from system observe; file layout in repo vs module shape in arch; transactional notifications vs marketing email; web UI in ui.md, CLI UX in cli.md; testing, errors, style bundled in quality)? Hard to reverse because content migrates poorly once agents have learned where to look, and wrong boundaries breed cross-pillar duplication. Options: follow the standard's tiebreakers or document a deviation. Default: follow the tiebreakers; deviations require a stated reason in the plan.

4. Coupling graph shape. Question: which pillars hard-couple via must_read_with (depth 1 only, max 3 per pillar) and what graduates to always_load? Hard to reverse because agents rely on frontmatter for predictable loading; hidden transitive deps or a fat always_load set are structural, not editorial, fixes. Options: keep the floor (context, repo) as the only always_load and use sparse must_read_with; or promote a widely shared dependency to always_load. Default: floor-only always_load; if 3 or more planned pillars would list the same dependency, promote it or restructure the boundary.

5. Instruction-file topology. Question: is AGENTS.md the sole instruction root, with CLAUDE.md and .cursorrules as one-line redirects, and for monorepos, is adoption root-level? Hard to reverse because parallel instruction documents fork the memory and drift independently. Options: single AGENTS.md root with redirects; or tool-native files as primary (non-compliant). Default: AGENTS.md root, redirects everywhere else, root-level adoption for monorepos (the standard is single-repo in v1).

6. Floor authoring depth. Question: are context.md and repo.md born as status: present or as stubs? Hard to reverse only in cost: stubs force every early agent session to pause and ask. Options: present at birth from plan content, or stubs. Default: present at birth; a greenfield plan already knows the domain vocabulary, invariants, and intended layout.

## Plan requirements

1. R-MEM-1: PLAN.mdx declares the project archetype from the standard 8-archetype table and cites the concrete signals (manifest fields, framework dependencies, directory shape) that will exist once scaffolded. Mapping from the godplans archetype set (SKILL.md Phase 2): cli-tool -> CLI tool, api-service -> internal API service, saas-dashboard -> SaaS dashboard/web app, marketing-site -> marketing site, mobile-app -> mobile app, ml-pipeline -> ML pipeline, library -> OSS library; extension, game, and hybrid map to greenfield/custom.
   Criterion: WHEN the archetype is declared, THE PLAN SHALL cite at least two file signals such that pillars-init detection on the finished repo would agree without asking.

2. R-MEM-2: PLAN.mdx schedules AGENTS.md at the repo root in the first commit, containing exactly the canonical four elements: reference to the Pillars standard, the 6-step loading protocol, the 4-state missing-pillar table, and a structured excluded: yaml block.
   Criterion: WHEN the AGENTS.md task is specified, THE PLAN SHALL require all four elements and SHALL forbid enumerating pillar names inside AGENTS.md.

3. R-MEM-3: PLAN.mdx resolves every Tier 1 Core pillar as authored, stubbed, or excluded; none is silently absent.
   Criterion: IF a Core pillar is neither authored nor stubbed, THE PLAN SHALL list it in the excluded: block with a reason.

4. R-MEM-4: PLAN.mdx specifies the excluded: list in structured {name, reason} form with project-specific reasons derived from the actual stack, not generic archetype boilerplate.
   Criterion: WHEN an exclusion is stated, THE PLAN SHALL give a concrete reason (e.g. "Vercel Analytics covers monitoring"), not a bare archetype default.

5. R-MEM-5: PLAN.mdx creates agents/context.md and agents/repo.md at status: present with always_load: true, authored from the plan's own objective, domain glossary, invariants, and repo layout section.
   Criterion: WHEN the scaffold phase is planned, THE PLAN SHALL include a task authoring both floor pillars at status: present, and SHALL NOT leave either as a stub.

6. R-MEM-6: PLAN.mdx enumerates the exact pillar inventory: every maybe cell of the Core applicability matrix resolved yes/no, the archetype's primary Tier 3 pillars included (cli.md for CLI tools, ml.md for ML pipelines, seo.md for marketing sites, payments.md for e-commerce, realtime.md for collab apps), and sub-pillars planned where patterns are known upfront (data/multi-tenant.md for multi-tenant SaaS, integrations/<service>.md past 3-5 significant integrations).
   Criterion: WHEN the inventory is listed, THE PLAN SHALL show a table of every planned pillar with tier, status at birth, and owning task.

7. R-MEM-7: PLAN.mdx specifies complete frontmatter for every planned pillar: pillar name equal to filename (lowercase noun, never a verb), status, always_load true only for context and repo, a covers list, a triggers list authored for recall with synonyms starting from the standard's per-pillar trigger tables, must_read_with capped at 3, and see_also.
   Criterion: WHEN a pillar file task is specified, THE PLAN SHALL state its full frontmatter, and every must_read_with reference SHALL resolve to a planned-present pillar or an excluded name.

8. R-MEM-8: PLAN.mdx mandates the exact 8-section body in every pillar (Scope, Context, Decisions, Rules, Workflows, Watchouts, Touchpoints, Gaps, in that order), unearned sections marked (none), no custom sections, Touchpoints mirroring frontmatter in plain English.
   Criterion: IF a pillar body is planned, THE PLAN SHALL require the 8 headings in order and SHALL reject any custom section.

9. R-MEM-9: PLAN.mdx records decision rationale (why this ORM, why this auth provider, why this deploy target) in its own Decisions section so each pillar's Decisions can be written truthfully at birth; anything genuinely undecided is planned as a Gaps entry, not fabricated.
   Criterion: WHEN a pillar's Decisions content is planned, THE PLAN SHALL trace each entry to a decision recorded in the plan; IF rationale is absent, THE PLAN SHALL route it to that pillar's Gaps as an ask-the-human item.

10. R-MEM-10: PLAN.mdx writes pillar Rules only for constraints not inferable from code and Context (the earn-your-keep test), such as a single allowed raw-SQL location or tenant_id required on tenant-scoped tables; Watchouts are (none) at birth with a Gaps note that they accumulate after incidents.
    Criterion: IF a planned Rule restates a fact an agent could infer from the tree ("we use Drizzle"), THE PLAN SHALL drop it; WHEN Watchouts are planned, THE PLAN SHALL set them to (none) at birth.

11. R-MEM-11: PLAN.mdx makes pillar Context sections the binding spec: declared stack versions, file locations, naming conventions, and service topology are identical to what the plan's build tasks produce, because pillars-verify checks manifests, paths, and 3-5 file convention samples.
    Criterion: IF a pillar claims a fact (path, dependency, convention), THE PLAN SHALL contain a build task whose Files or Acceptance lines produce exactly that fact.

12. R-MEM-12: PLAN.mdx assigns content to pillars per the standard's boundary tiebreakers: secrets and env vars in config.md not auth.md; product analytics separate from system observe; file layout in repo.md, module shape in arch.md; transactional notifications separate from marketing email; ui.md web-only with CLI UX in cli.md; quality bundled until depth justifies sub-pillars.
    Criterion: WHEN content is assigned across pillars, THE PLAN SHALL follow the tiebreakers or state a reasoned deviation; cross-boundary references SHALL go through Touchpoints, not duplicated prose.

13. R-MEM-13: PLAN.mdx keeps the coupling graph clean by design: no pillar exceeds 3 must_read_with entries, shared dependencies are promoted to always_load or the boundary restructured, and sub-pillars explicitly declare must_read_with: [parent] when the parent is required (it is never auto-loaded).
    Criterion: IF a planned pillar would need more than 3 must_read_with entries, THE PLAN SHALL restructure the boundary before emission.

14. R-MEM-14: PLAN.mdx schedules the exclusion lifecycle against the roadmap: any milestone that introduces code into a currently excluded area also removes that exclusion and authors the pillar in the same milestone.
    Criterion: WHEN a phase adds code to an excluded area (e.g. a web UI in milestone 3), THE PLAN SHALL include, in that same phase, a task updating AGENTS.md excluded: and authoring the pillar.

15. R-MEM-15: PLAN.mdx specifies any CLAUDE.md, .cursorrules, or similar tool file as a one-line redirect to AGENTS.md and ./agents/, never a parallel instruction document, and records the monorepo decision (root-level adoption) if applicable.
    Criterion: IF a tool-native instruction file is planned, THE PLAN SHALL specify its entire content as a redirect line.

16. R-MEM-16: PLAN.mdx bakes structural conformance into CI from day one: the generated tree passes the Pillars validator (frontmatter schema, pillar/filename agreement, covers present, triggers present unless always_load, status enum, exact 8-heading order, floor pillars present with always_load: true, resolvable must_read_with references).
    Criterion: WHEN CI is planned, THE PLAN SHALL include a job running validate_pillars.py (vendored or fetched) that fails the build on any ERROR finding.

17. R-MEM-17: PLAN.mdx defines pillar maintenance as part of the delivery workflow: new decisions land in the owning pillar's Decisions, new hard constraints in Rules, incidents produce Watchouts, resolved Gaps entries are removed, and pillars-verify runs are scheduled after each major refactor or milestone with a target of zero drift, zero rule violations, no stale exclusions.
    Criterion: WHEN phases are laid out, THE PLAN SHALL name the pillar-update step in each phase's Must-haves and SHALL schedule a pillars-verify run in the final Verification phase.

18. R-MEM-18: PLAN.mdx states the executing-agent contract: agents follow the 6-step loading protocol and the 4-state table (present: comply; stub: ask before deciding; excluded: proceed; absent-but-triggered: infer, state the assumption, recommend the pillar), and pause on a missing floor pillar rather than degrading silently.
    Criterion: WHEN the Agent memory section is emitted, THE PLAN SHALL state there that the AGENTS.md protocol is binding for all build tasks; the Rules for executing agents block stays verbatim per plan-format.md and receives no additions.

## Task seeds

- [ ] GP-xxx Write AGENTS.md loader at repo root
  - Files: AGENTS.md
  - Acceptance: contains Pillars standard reference, 6-step loading protocol, 4-state missing-pillar table, structured excluded: yaml block with {name, reason} entries; contains no enumeration of pillar names outside the excluded block
  - Verify: grep -q 'excluded:' AGENTS.md && grep -qi 'always_load' AGENTS.md && test -d agents
  - Requirements: R-MEM-2, R-MEM-3, R-MEM-4

- [ ] GP-xxx Author floor pillars context.md and repo.md at status present
  - Files: agents/context.md, agents/repo.md
  - Acceptance: both files have YAML frontmatter with pillar matching filename, status: present, always_load: true, covers list; both bodies have the 8 headings in order; context.md carries the domain glossary and product invariants from the plan; repo.md carries the planned file layout and naming conventions
  - Verify: grep -c 'always_load: true' agents/context.md agents/repo.md | grep -vq ':0'
  - Requirements: R-MEM-5, R-MEM-8, R-MEM-11

- [ ] GP-xxx Author Core pillar set per inventory table
  - Files: agents/stack.md, agents/arch.md, agents/quality.md (plus data/api/auth/deploy/observe per inventory)
  - Acceptance: every planned-present pillar has full frontmatter (covers, triggers with synonyms, must_read_with <= 3, see_also) and the 8-section body; Decisions entries trace to plan decisions; undecided items appear in Gaps; Watchouts are (none)
  - Verify: grep -L 'triggers:' agents/*.md | grep -v -e context.md -e repo.md | wc -l | grep -q '^ *0$'
  - Requirements: R-MEM-6, R-MEM-7, R-MEM-8, R-MEM-9, R-MEM-10

- [ ] GP-xxx Author primary Tier 3 domain pillar
  - Files: agents/<domain>.md (cli.md, ml.md, seo.md, payments.md, or realtime.md per archetype)
  - Acceptance: frontmatter and 8-section body conform; content covers the concern that defines the product; boundary tiebreakers respected with Touchpoints cross-references instead of duplicated prose
  - Verify: test -f agents/<domain>.md && grep -q 'pillar: <domain>' agents/<domain>.md
  - Requirements: R-MEM-6, R-MEM-8, R-MEM-12

- [ ] GP-xxx Add Pillars structural validation to CI
  - Files: scripts/validate_pillars.py, .github/workflows/ci.yml
  - Acceptance: validator vendored from the pillars repo; CI job runs it against agents/ and fails on ERROR; floor-pillar and 8-heading checks active
  - Verify: python3 scripts/validate_pillars.py && grep -q 'validate_pillars' .github/workflows/ci.yml
  - Requirements: R-MEM-16

- [ ] GP-xxx Reduce tool-native instruction files to redirects
  - Files: CLAUDE.md
  - Acceptance: file body is a single redirect line pointing at AGENTS.md and ./agents/; no parallel rules content
  - Verify: test "$(grep -vc '^$' CLAUDE.md)" -le 2 && grep -q 'AGENTS.md' CLAUDE.md
  - Requirements: R-MEM-15

- [ ] GP-xxx Run drift audit in final verification phase
  - Files: none (read-only audit)
  - Acceptance: pillars-verify (or the equivalent prompt) run against the finished tree reports zero drift, zero rule violations, and no code in excluded areas
  - Verify: python3 scripts/validate_pillars.py && git ls-files 'src/components/*' | wc -l | grep -q '^ *0$' # sample stale-exclusion probe when ui is excluded
  - Requirements: R-MEM-14, R-MEM-17

## Self-audit rubric

- Archetype and applicability (15): archetype declared with two or more concrete file signals; every Core pillar resolved authored/stubbed/excluded; every maybe cell explicitly decided; primary Tier 3 pillar included.
- Loader conformance (15): AGENTS.md task specifies exactly the four canonical elements, no pillar enumeration, structured exclusions with project-specific reasons.
- Floor pillars (10): context.md and repo.md planned at status: present, always_load: true, authored from the plan's own glossary, invariants, and layout.
- Frontmatter and body format (15): every planned pillar has complete frontmatter (name = filename, covers, recall-oriented triggers, must_read_with <= 3 resolvable), 8 sections in order, (none) markers, Touchpoints mirroring.
- Truthfulness discipline (15): Decisions trace to recorded plan rationale, no fabrication; Rules pass earn-your-keep; Watchouts (none) at birth; undecided items in Gaps as ask-the-human entries.
- Drift-proofing (15): every pillar claim is produced by a named build task; boundary tiebreakers followed; coupling graph clean (no >3 must_read_with, shared deps promoted).
- Lifecycle and CI (15): exclusion removals scheduled in the milestone that adds the code; validator wired into CI; maintenance workflow named in phase Must-haves; verify run in the final phase.

## Anti-patterns refused

- Silent pillar absence: a Core pillar that is neither authored, stubbed, nor excluded. Refusal: the plan forces a three-way decision per pillar; the inventory table has no blank rows.
- Fabricated rationale: Decisions or Watchouts invented to fill sections. Refusal: unknown rationale is planned into Gaps as an explicit question; Watchouts start at (none).
- Loader bloat: AGENTS.md enumerating pillars or accumulating rules, growing with the project. Refusal: the plan pins AGENTS.md to the constant-size four-element canonical text; routing lives in per-file frontmatter.
- Born drifted: the plan's pillar claims describe a stack, path, or convention no build task produces. Refusal: every claim maps to a task's Files or Acceptance line; unmapped claims are cut or converted to Gaps.
- Boundary creep: auth content written into data.md, secrets into auth.md, marketing email into notifications. Refusal: content is reassigned per the tiebreakers and linked via Touchpoints.
- Coupling smell: a pillar with more than 3 must_read_with entries, or several pillars sharing the same hidden dependency. Refusal: restructure the boundary or promote the shared dependency to always_load before emission.
- Stale exclusion by schedule: a roadmap phase adds code to an excluded area with no exclusion removal planned. Refusal: the exclusion update and pillar authoring task land in the same phase.
- Rules as rails: Rules restating inferable facts, putting the agent on rails instead of preventing drift. Refusal: each Rule must fail the inference test or it is deleted; (none) is the honest default.
- Parallel instruction forks: a hand-built CLAUDE.md or .cursorrules carrying its own rules alongside AGENTS.md. Refusal: tool-native files are planned as one-line redirects; existing ones are reduced, never deleted.
- Guessed archetype: ambiguous detection (dashboard vs marketing site) resolved by assumption. Refusal: the ambiguity becomes a discovery question or a named open question with a recommended default; the exclusion set is never guessed.
