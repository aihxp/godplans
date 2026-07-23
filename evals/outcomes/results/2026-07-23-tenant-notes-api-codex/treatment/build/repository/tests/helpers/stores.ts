import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "../../src/app.ts";
import { loadAppConfig } from "../../src/config.ts";
import { seedStores } from "../../src/db/seed.ts";

export const TOKENS = {
  a1: "a".repeat(32),
  a2: "b".repeat(32),
  b1: "c".repeat(32),
  b2: "d".repeat(32),
} as const;

export function createFixture() {
  const dataDir = mkdtempSync(join(tmpdir(), "tenant-notes-test-"));
  const config = loadAppConfig(dataDir);
  seedStores({
    config,
    tokens: {
      ORG_A_USER_1_TOKEN: TOKENS.a1,
      ORG_A_USER_2_TOKEN: TOKENS.a2,
      ORG_B_USER_1_TOKEN: TOKENS.b1,
      ORG_B_USER_2_TOKEN: TOKENS.b2,
    },
    now: new Date("2026-07-23T12:00:00.000Z"),
  });
  const time = { value: new Date("2026-07-23T12:01:00.000Z") };
  const ids = [
    "30000000-0000-4000-8000-000000000001",
    "30000000-0000-4000-8000-000000000002",
    "30000000-0000-4000-8000-000000000003",
    "30000000-0000-4000-8000-000000000004",
    "30000000-0000-4000-8000-000000000005",
  ];
  const logs: Record<string, unknown>[] = [];
  const app = createApp({
    config,
    clock: { now: () => time.value },
    ids: {
      next: () => {
        const id = ids.shift();
        if (!id) throw new Error("Test id sequence exhausted");
        return id;
      },
    },
    logger: { write: (event) => logs.push(event) },
  });
  return {
    app,
    config,
    dataDir,
    time,
    logs,
    cleanup: async () => {
      await app.close();
      rmSync(dataDir, { recursive: true, force: true });
    },
  };
}

export function auth(token: string): Record<string, string> {
  return { authorization: `Bearer ${token}` };
}

export async function createNote(
  app: ReturnType<typeof createApp>,
  token: string,
  title = "Title",
  body = "Body",
) {
  const response = await app.inject({
    method: "POST",
    url: "/v1/notes",
    headers: auth(token),
    payload: { title, body },
  });
  return response;
}
