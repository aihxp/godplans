---
pillar: repo
status: present
always_load: true
covers: file layout, commands, local data exclusions
triggers: repository, command, add file, layout
must_read_with:
see_also: context, quality
---

# Scope

Repository structure and local evaluator commands.

# Context

Source is in `src/`, executable checks in `scripts/`, black-box tests in
`tests/`, and evaluator documentation in `docs/`.

# Decisions

`npm run verify` is the authoritative gate. Runtime and checks have no
third-party packages or external service.

# Rules

Do not commit `data/`, SQLite files, tokens, `node_modules/`, or `dist/`.
Routes never contain SQL. New environment inputs and response fields update
README or `openapi.json` in the same change.

# Workflows

Use `npm ci`, `npm run seed`, `npm run build`, `npm start`, and
`npm run verify`.

# Watchouts

(none)

# Touchpoints

`package.json`, `.gitignore`, README, scripts, and contract.

# Gaps

(none)
