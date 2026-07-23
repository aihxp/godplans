# Tenant Notes API

A local, restart-safe HTTP API for organization-scoped notes. It ships exactly
two organizations and four seeded users. A bearer-authenticated member may
create, list, read, update, and delete notes in their organization. A known note
id from the other organization is indistinguishable from an absent id.

Requires Node.js 22.13 or newer. The package is private and `UNLICENSED`. It has
no third-party runtime or development dependencies and makes no external
runtime or test requests.

## Quick Start

1. Install the locked, dependency-free package:

   ```sh
   npm ci --ignore-scripts
   ```

2. Generate and export four distinct tokens (run the Node command four times):

   ```sh
   node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('base64url') + '\n')"
   export ORG_A_USER_1_TOKEN='first-value' ORG_A_USER_2_TOKEN='second-value'
   export ORG_B_USER_1_TOKEN='third-value' ORG_B_USER_2_TOKEN='fourth-value'
   ```

3. Create the two stores. Tokens expire eight hours after this command:

   ```sh
   DATA_DIR=./data npm run seed
   ```

4. Build and start the service:

   ```sh
   npm run build && DATA_DIR=./data npm start
   ```

5. Run the complete deterministic gate:

   ```sh
   npm run verify
   ```

The service listens on `http://127.0.0.1:3000`. Set `PORT` to change the port.

## HTTP examples

Use one of the exported token values:

```sh
curl -i -X POST http://127.0.0.1:3000/v1/notes \
  -H "Authorization: Bearer $ORG_A_USER_1_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"title":"Calibration","body":"Tenant-safe and persistent"}'

curl -i "http://127.0.0.1:3000/v1/notes?limit=20" \
  -H "Authorization: Bearer $ORG_A_USER_1_TOKEN"

curl -i http://127.0.0.1:3000/v1/notes/NOTE_ID \
  -H "Authorization: Bearer $ORG_A_USER_1_TOKEN"

curl -i -X PATCH http://127.0.0.1:3000/v1/notes/NOTE_ID \
  -H "Authorization: Bearer $ORG_A_USER_1_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"title":"Revised"}'

curl -i -X DELETE http://127.0.0.1:3000/v1/notes/NOTE_ID \
  -H "Authorization: Bearer $ORG_A_USER_1_TOKEN"
```

`GET /healthz` checks both stores. `GET /openapi.json` serves the same contract
committed as [openapi.json](openapi.json). Errors use
`application/problem+json`. POST is not retry-safe. GET and DELETE have their
ordinary HTTP retry semantics.

## Token rotation

Generate four new distinct values, export all four variables, stop the process,
and rerun `npm run seed` against the same `DATA_DIR`. The seed is idempotent for
organizations and users, replaces token rows, and leaves notes intact. Restart
the service after the seed completes. Never put token values in the repository.

## Design and operations

- [Tenant isolation ADR](docs/adr/001-local-tenant-isolation.md)
- [Local runbook](docs/runbook.md)
- [OpenAPI contract](openapi.json)

The built-in Node HTTP edge validates only documented fields, enforces a 16 KiB
body limit, and maps failures to one RFC 9457-style envelope. SQLite access is
behind the Notes repository; route code contains no SQL.
