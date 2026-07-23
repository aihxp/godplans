# Local runbook

## Start and stop

Follow the README Quick Start with an explicit `DATA_DIR`. Stop with `SIGINT` or
`SIGTERM`; the process closes its listener. SQLite connections are request
scoped and closed in `finally`.

## Store unavailable

Signal: `/healthz` returns 503 with code `STORE_UNAVAILABLE`, or startup reports
a missing or invalid configured store.

1. Stop the process.
2. Confirm both `organization-a.sqlite` and `organization-b.sqlite` exist under
   `DATA_DIR`, are readable by the current user, and have mode `0600`.
3. Do not create an empty replacement for a store containing notes. Restore the
   known local test copy if one exists.
4. If this is a disposable evaluation, rerun `npm run seed`.
5. Restart and require `/healthz` to return 200 before continuing.

## Authentication denial spike

Ten failed authentications from an IP in one minute emit
`auth_denial_spike`. More than 30 failures in that window return 429.

Confirm that the caller uses one of the most recently seeded token values and
that token age is under eight hours. Logs deliberately contain neither bearer
tokens nor note title/body content. Rotate tokens by the README procedure if
exposure is suspected.

## Recovery and rollback

There is no backup promise. For evaluator data, stop the process and restore
both store files from the same known test copy. Never copy a live SQLite file.
Run `npm run verify` after restoration. Notes use hard delete and cannot be
recovered through the API.
