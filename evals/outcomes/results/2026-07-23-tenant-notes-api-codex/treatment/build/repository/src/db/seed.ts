import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AppConfig, IdentityOrganization } from "../config.ts";
import { loadAppConfig } from "../config.ts";
import { migrateStore, openStore } from "./open-store.ts";

export type SeedOptions = {
  config: AppConfig;
  tokens: Record<string, string | undefined>;
  now?: Date;
};

export function seedStores(options: SeedOptions): void {
  const entries = collectTokens(options);
  assertDistinctTokens(entries.map((item) => item.token));
  const expiresAt = new Date(
    (options.now ?? new Date()).getTime() + 8 * 60 * 60 * 1000,
  ).toISOString();
  for (const organization of options.config.identities.organizations) {
    const storePath = join(options.config.dataDir, organization.store);
    migrateStore(storePath);
    seedOrganization(storePath, organization, entries, expiresAt);
  }
}

function collectTokens(options: SeedOptions) {
  return options.config.identities.organizations.flatMap((organization) =>
    organization.users.map((user) => {
      const token = options.tokens[user.tokenEnv];
      if (!token || Buffer.byteLength(token) < 32) {
        throw new Error(`${user.tokenEnv} must contain at least 32 bytes`);
      }
      return { userId: user.publicId, token };
    })
  );
}

function assertDistinctTokens(tokens: string[]): void {
  const hashes = tokens.map(hashToken);
  if (new Set(hashes.map((hash) => hash.toString("hex"))).size !== hashes.length) {
    throw new Error("Bearer tokens must be distinct");
  }
}

function seedOrganization(
  storePath: string,
  organization: IdentityOrganization,
  entries: { userId: string; token: string }[],
  expiresAt: string,
): void {
  const database = openStore(storePath);
  try {
    database.exec("BEGIN IMMEDIATE");
    database.prepare(
      "INSERT OR REPLACE INTO organizations(public_id, name) VALUES (?, ?)",
    ).run(organization.publicId, organization.name);
    for (const user of organization.users) {
      database.prepare(
        "INSERT OR REPLACE INTO users(public_id, organization_id, name) VALUES (?, ?, ?)",
      ).run(user.publicId, organization.publicId, user.name);
      const token = entries.find((item) => item.userId === user.publicId);
      if (!token) throw new Error("Seed token was not collected");
      database.prepare("DELETE FROM access_tokens WHERE user_id = ?").run(user.publicId);
      database.prepare(
        "INSERT INTO access_tokens(token_hash, user_id, expires_at) VALUES (?, ?, ?)",
      ).run(hashToken(token.token), user.publicId, expiresAt);
    }
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  } finally {
    database.close();
  }
}

export function hashToken(token: string): Buffer {
  return createHash("sha256").update(token).digest();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedStores({ config: loadAppConfig(), tokens: process.env });
  process.stdout.write("Seeded two organization stores.\n");
}
