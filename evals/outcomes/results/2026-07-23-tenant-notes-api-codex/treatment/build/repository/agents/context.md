---
pillar: context
status: present
always_load: true
covers: objective, glossary, tenant invariants, non-goals
triggers: notes api, tenant isolation, organization, principal
must_read_with:
see_also: repo, quality
---

# Scope

The local Tenant Notes API and its two fixed organizations.

# Context

One evaluator uses four seeded bearer credentials to exercise organization-wide
note CRUD. A cross-organization leak invalidates the result.

# Decisions

One SQLite file belongs to each organization. Authentication selects one file
and immutable principal. Members may operate peer-created notes; owner remains
the creator.

# Rules

Never accept owner or organization identity from request data. Every note query
uses the selected store and an organization predicate. Absent and
cross-organization ids return `NOTE_NOT_FOUND`.

# Workflows

Seed, build, start, exercise `/v1/notes`, then run `npm run verify`.

# Watchouts

(none)

# Touchpoints

`src/auth.ts`, `src/notes/`, `config/identities.json`, and the isolation tests.

# Gaps

(none)
