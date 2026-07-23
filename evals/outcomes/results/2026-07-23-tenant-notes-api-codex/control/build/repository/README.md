# Offline Multi-Tenant Notes API

A small, durable JSON API for organization-shared notes. It binds only to the
loopback interface, stores data in a local SQLite file, and has no runtime
dependencies beyond Node.js.

## Requirements

- Node.js 22.13 or newer in the Node 22 release line (`.nvmrc` is included)
- No package installation, network service, container, or external database

The project intentionally uses the built-in `node:sqlite` module. `openapi.json`
is the only machine-readable API contract.

## Initialize and run

From the repository root:

```sh
nvm use
npm run init
npm test
npm start
```

On first initialization, any token not supplied through the environment is
generated with 256 bits of randomness and printed once. Save those values:
SQLite stores only their SHA-256 hashes. Later initialization does not replace
tokens or print them again.

For reproducible local credentials, set all four values before initialization:

```sh
export TOKEN_USER_A1='replace-with-a-long-random-token-a1'
export TOKEN_USER_A2='replace-with-a-long-random-token-a2'
export TOKEN_USER_B1='replace-with-a-long-random-token-b1'
export TOKEN_USER_B2='replace-with-a-long-random-token-b2'
npm run init
```

The fixed identities are:

| Organization | User | Token variable |
| --- | --- | --- |
| Organization A | User A1 | `TOKEN_USER_A1` |
| Organization A | User A2 | `TOKEN_USER_A2` |
| Organization B | User B1 | `TOKEN_USER_B1` |
| Organization B | User B2 | `TOKEN_USER_B2` |

Both users in an organization can operate on all notes in that organization.
The creating user remains recorded as the immutable `ownerId`.

## Configuration

| Variable | Default | Meaning |
| --- | --- | --- |
| `DATA_FILE` | `./data/notes.sqlite` | On-disk SQLite database path |
| `PORT` | `3000` | Loopback HTTP port |
| `TOKEN_USER_A1` … `TOKEN_USER_B2` | generated on first initialization | Initial bearer tokens |

The server listens on `127.0.0.1` only. Stop it with `Ctrl-C`; `SIGINT` and
`SIGTERM` both close the HTTP server and database cleanly.

## Example requests

Create a note:

```sh
curl -i http://127.0.0.1:3000/notes \
  -H "Authorization: Bearer $TOKEN_USER_A1" \
  -H 'Content-Type: application/json' \
  --data '{"title":"Local checklist","body":"Run the test suite"}'
```

List Organization A's notes as its other user:

```sh
curl http://127.0.0.1:3000/notes \
  -H "Authorization: Bearer $TOKEN_USER_A2"
```

Read, update, and delete using the `id` returned by create:

```sh
curl http://127.0.0.1:3000/notes/NOTE_ID \
  -H "Authorization: Bearer $TOKEN_USER_A2"

curl -X PATCH http://127.0.0.1:3000/notes/NOTE_ID \
  -H "Authorization: Bearer $TOKEN_USER_A2" \
  -H 'Content-Type: application/json' \
  --data '{"body":"Tests passed"}'

curl -i -X DELETE http://127.0.0.1:3000/notes/NOTE_ID \
  -H "Authorization: Bearer $TOKEN_USER_A1"
```

An authenticated user receives the same `404 NOTE_NOT_FOUND` response for an
unknown note and for a note owned by another organization.

## Tests

```sh
npm test
```

The deterministic test suite uses temporary file-backed databases and covers
the OpenAPI inventory, initialization, foreign-key membership enforcement,
authentication, CRUD, validation and payload bounds, shared error envelopes,
organization isolation in both directions, internal-error redaction, ordering,
and clean database restarts. It uses ephemeral loopback servers normally; in a
restricted sandbox that rejects loopback binding, the same HTTP handler is
exercised directly.
