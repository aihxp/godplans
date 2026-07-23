# Code DNA

Version 1, 2026-07-23. Enforced rules are checked by the package scripts;
observed rules describe the canonical note slice.

1. Use organization, user, access token, and note as the domain nouns.
2. Derive organization and owner only from the authenticated principal.
3. Keep SQL in repositories and include organization predicates.
4. Use named exports and direct relative imports; do not create barrel files.
5. Use explicit Problem Details codes at the single error boundary.
6. Validate external values once at HTTP, configuration, or database edges.
7. Prefer early returns and small, single-purpose functions.
8. Keep files below 400 lines and avoid structural nesting beyond four levels.
9. Tests assert observable data and denial aftermath without snapshots.
10. Never log bearer tokens, note titles, or note bodies.

Canonical route delegation:

```ts
const query = validateListQuery(request.query);
return { statusCode: 200, body: service.list(principal, query.limit, query.cursor) };
```

Canonical scoped mutation:

```ts
DELETE FROM notes
WHERE public_id = ? AND organization_id = ?
```
