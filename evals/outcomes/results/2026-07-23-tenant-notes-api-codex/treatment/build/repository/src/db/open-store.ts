import { chmodSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const MIGRATION_PATH = resolve(
  dirname(new URL(import.meta.url).pathname),
  "migrations/0001-init.sql",
);

export function openStore(
  path: string,
  options: { create?: boolean; readOnly?: boolean } = {},
): DatabaseSync {
  if (options.create) {
    mkdirSync(dirname(path), { recursive: true });
  }
  const database = new DatabaseSync(path, {
    open: true,
    readOnly: options.readOnly ?? false,
  });
  database.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 1000;");
  if (options.create) {
    chmodSync(path, 0o600);
  }
  return database;
}

export function migrateStore(path: string): void {
  const database = openStore(path, { create: true });
  try {
    database.exec(readFileSync(MIGRATION_PATH, "utf8"));
  } finally {
    database.close();
  }
}

export function assertStoreExists(path: string): void {
  if (!existsSync(path)) {
    throw new Error(`Configured store does not exist: ${path}`);
  }
}

export function dropStoreSchema(path: string): void {
  const database = openStore(path);
  try {
    database.exec(`
      DROP TABLE IF EXISTS notes;
      DROP TABLE IF EXISTS access_tokens;
      DROP TABLE IF EXISTS users;
      DROP TABLE IF EXISTS organizations;
    `);
  } finally {
    database.close();
  }
}
