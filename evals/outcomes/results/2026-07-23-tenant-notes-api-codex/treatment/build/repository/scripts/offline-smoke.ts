import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "../src/app.ts";
import { loadAppConfig } from "../src/config.ts";
import { seedStores } from "../src/db/seed.ts";

const dataDir = mkdtempSync(join(tmpdir(), "tenant-notes-smoke-"));
const tokens = {
  ORG_A_USER_1_TOKEN: "a".repeat(32),
  ORG_A_USER_2_TOKEN: "b".repeat(32),
  ORG_B_USER_1_TOKEN: "c".repeat(32),
  ORG_B_USER_2_TOKEN: "d".repeat(32),
};

try {
  const config = loadAppConfig(dataDir);
  seedStores({ config, tokens, now: new Date("2026-07-23T12:00:00.000Z") });
  const app = createApp({
    config,
    clock: { now: () => new Date("2026-07-23T12:01:00.000Z") },
    ids: { next: () => "30000000-0000-4000-8000-000000000001" },
    logger: { write: () => undefined },
  });
  const created = await app.inject({
    method: "POST",
    url: "/v1/notes",
    headers: { authorization: `Bearer ${tokens.ORG_A_USER_1_TOKEN}` },
    payload: { title: "Offline", body: "Local persistence" },
  });
  assert.equal(created.statusCode, 201);
  const note = created.json() as { id: string };
  const read = await app.inject({
    method: "GET",
    url: `/v1/notes/${note.id}`,
    headers: { authorization: `Bearer ${tokens.ORG_A_USER_1_TOKEN}` },
  });
  assert.equal(read.statusCode, 200);
  await app.close();
  process.stdout.write("Offline create/read smoke passed.\n");
} finally {
  rmSync(dataDir, { recursive: true, force: true });
}
