# ADR 001: Local tenant isolation

Status: accepted

## Context

The evaluator must prove that a user in one of two fixed organizations cannot
observe or mutate a note in the other organization, even with its real public
id. Runtime and tests must remain local and restart-safe, with no database
service.

## Decision

Use one SQLite file per organization. Authentication hashes the supplied bearer
token, searches token rows in the fixed two-store registry, and binds one
immutable principal and store path. Notes operations open only that selected
file and also predicate every query and mutation on the principal's organization
id. Composite foreign keys prevent a note owner from belonging to another
organization.

Flip point: a third organization is required, store-open time exceeds 100 ms
p95, a second process writes the files, or demand exceeds 10 requests per
second.

Blast radius: changing this decision replaces authentication lookup, the store
registry, every repository constructor, migrations, seed layout, and tenant
isolation tests.

## Consequences

Physical separation makes a missed shared-table filter insufficient to expose
the other organization's data. The fixed store registry is intentionally not a
general provisioning system. Authentication performs two small local token
reads; note operations retain no cross-store connection.

## Rejected alternatives

- One shared embedded database was rejected because SQLite cannot enforce
  application row-level security if a predicate is missed.
- PostgreSQL with forced row-level security was rejected because it adds a
  network service and violates the offline local execution constraint.
