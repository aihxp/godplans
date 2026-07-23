import assert from "node:assert/strict";
import { chmodSync, renameSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { createApp } from "../src/app.ts";
import { auth, createFixture, createNote, TOKENS } from "./helpers/stores.ts";

describe("restart and local operations", () => {
  it("retains a note when the application is reconstructed", async () => {
    const fixture = createFixture();
    try {
      const created = await createNote(fixture.app, TOKENS.a1, "Persistent", "Still here");
      const original = created.json() as { id: string };
      await fixture.app.close();
      const restarted = createApp({
        config: fixture.config,
        logger: { write: () => undefined },
      });
      const read = await restarted.inject({
        method: "GET",
        url: `/v1/notes/${original.id}`,
        headers: auth(TOKENS.a1),
      });
      assert.deepEqual(read.json(), created.json());
      await restarted.close();
    } finally {
      await fixture.cleanup();
    }
  });

  it("reports health only when both configured stores answer", async () => {
    const fixture = createFixture();
    const storePath = join(
      fixture.dataDir,
      fixture.config.identities.organizations[1]?.store ?? "",
    );
    const movedPath = `${storePath}.unavailable`;
    try {
      const healthy = await fixture.app.inject({ method: "GET", url: "/healthz" });
      assert.equal(healthy.statusCode, 200);
      renameSync(storePath, movedPath);
      const unhealthy = await fixture.app.inject({ method: "GET", url: "/healthz" });
      assert.equal(unhealthy.statusCode, 503);
      assert.equal((unhealthy.json() as { code: string }).code, "STORE_UNAVAILABLE");
      renameSync(movedPath, storePath);
      chmodSync(storePath, 0o600);
    } finally {
      await fixture.cleanup();
    }
  });

  it("logs mutation context without token or note content", async () => {
    const fixture = createFixture();
    try {
      await createNote(fixture.app, TOKENS.a1, "Sensitive title", "Sensitive body");
      const serialized = JSON.stringify(fixture.logs);
      assert.match(serialized, /note\.create/);
      assert.match(serialized, /organization/);
      assert.doesNotMatch(serialized, /Sensitive/);
      assert.doesNotMatch(serialized, new RegExp(TOKENS.a1));
    } finally {
      await fixture.cleanup();
    }
  });

});
