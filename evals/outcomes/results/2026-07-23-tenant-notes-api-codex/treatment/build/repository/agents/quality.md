---
pillar: quality
status: present
always_load: false
covers: tests, error boundary, authentication, SQL, style
triggers: test, auth, sql, error, style, schema change, tenant isolation
must_read_with: context
see_also: repo
---

# Scope

Correctness, security, error, and style rules for the service.

# Context

The critical proof is known-id denial through the mounted HTTP application,
followed by a same-organization reread of unchanged data.

# Decisions

Node's test runner owns unit and integration execution. Tests inject the clock,
UUID sequence, data directory, and tokens. One root mapper emits Problem
Details.

# Rules

Unknown fields fail. POST accepts title and body; PATCH accepts at least one.
Bearer comparisons are constant-time. Logs exclude credentials and note
content. Prepared SQL includes organization predicates. Follow
[CODEDNA](../CODEDNA.md).

# Workflows

Run the narrow test first, then `npm run contract:check`, and finish with
`npm run verify`.

# Watchouts

(none)

# Touchpoints

`src/errors.ts`, `src/schemas.ts`, `src/auth.ts`, repositories, and `tests/`.

# Gaps

(none)

<!-- codedna:start -->
The enforced convention source is `CODEDNA.md`; refresh it when a convention
changing refactor or tool replacement lands.
<!-- codedna:end -->
