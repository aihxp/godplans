Plan a small multi-tenant notes API for a six-hour implementation evaluation.
It runs on Node.js 22 with no paid services and must stay runnable offline.

Two organizations each have two users. An authenticated user can create, list,
read, update, and delete notes only inside their own organization. Every note
has an opaque public id, title, body, owner id, organization id, created time,
and updated time. The API needs one machine-readable contract, one error
envelope, request validation, deterministic tests, and a restart-safe local
data store. Include the exact checks that prove a user from organization A
cannot read or mutate organization B's notes, even when the note id is known.

Keep the plan proportional to the six-hour cap. Do not plan a UI, SEO, public
launch, cloud deployment, billing, or enterprise compliance program.
