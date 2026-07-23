import assert from "node:assert/strict";
import { statSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { createApp } from "../src/app.ts";
import { openStore } from "../src/db/open-store.ts";
import { seedStores } from "../src/db/seed.ts";
import { createFixture, TOKENS } from "./helpers/stores.ts";

describe("tenant stores", () => {
  it("create two constrained mode-0600 stores with two users each", async () => {
    const fixture = createFixture();
    try {
      for (const organization of fixture.config.identities.organizations) {
        const path = join(fixture.dataDir, organization.store);
        assert.equal(statSync(path).mode & 0o777, 0o600);
        const database = openStore(path, { readOnly: true });
        const users = database.prepare("SELECT COUNT(*) AS count FROM users").get() as {
          count: number;
        };
        const foreignKeys = database.prepare("PRAGMA foreign_keys").get() as {
          foreign_keys: number;
        };
        assert.equal(users.count, 2);
        assert.equal(foreignKeys.foreign_keys, 1);
        database.close();
      }
    } finally {
      await fixture.cleanup();
    }
  });

  it("rejects duplicate tokens before modifying stores", async () => {
    const fixture = createFixture();
    try {
      assert.throws(
        () =>
          seedStores({
            config: fixture.config,
            tokens: {
              ORG_A_USER_1_TOKEN: TOKENS.a1,
              ORG_A_USER_2_TOKEN: TOKENS.a1,
              ORG_B_USER_1_TOKEN: TOKENS.b1,
              ORG_B_USER_2_TOKEN: TOKENS.b2,
            },
          }),
        /distinct/,
      );
    } finally {
      await fixture.cleanup();
    }
  });

  it("fails application startup when a token hash appears in both stores", async () => {
    const fixture = createFixture();
    try {
      const firstPath = join(
        fixture.dataDir,
        fixture.config.identities.organizations[0]?.store ?? "",
      );
      const secondPath = join(
        fixture.dataDir,
        fixture.config.identities.organizations[1]?.store ?? "",
      );
      const first = openStore(firstPath, { readOnly: true });
      const row = first.prepare("SELECT token_hash FROM access_tokens LIMIT 1").get() as {
        token_hash: Uint8Array;
      };
      first.close();
      const second = openStore(secondPath);
      second.prepare(
        "UPDATE access_tokens SET token_hash = ? WHERE rowid = (SELECT rowid FROM access_tokens LIMIT 1)",
      ).run(row.token_hash);
      second.close();
      assert.throws(
        () => createApp({ config: fixture.config, logger: { write: () => undefined } }),
        /Duplicate token hash/,
      );
    } finally {
      await fixture.cleanup();
    }
  });
});
