import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type IdentityUser = {
  publicId: string;
  name: string;
  tokenEnv: string;
};

export type IdentityOrganization = {
  publicId: string;
  name: string;
  store: string;
  users: IdentityUser[];
};

export type IdentityConfig = {
  organizations: IdentityOrganization[];
};

export type AppConfig = {
  dataDir: string;
  identities: IdentityConfig;
};

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_IDENTITIES_PATH = resolve(MODULE_DIR, "../config/identities.json");

export function loadIdentityConfig(path = DEFAULT_IDENTITIES_PATH): IdentityConfig {
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
  if (!isIdentityConfig(parsed)) {
    throw new Error("Identity configuration is invalid");
  }
  return parsed;
}

export function loadAppConfig(
  dataDir = process.env.DATA_DIR ?? resolve("data"),
): AppConfig {
  return { dataDir: resolve(dataDir), identities: loadIdentityConfig() };
}

export function getStorePaths(config: AppConfig): string[] {
  return config.identities.organizations.map((item) =>
    join(config.dataDir, item.store),
  );
}

function isIdentityConfig(value: unknown): value is IdentityConfig {
  if (!isRecord(value) || !Array.isArray(value.organizations)) {
    return false;
  }
  return value.organizations.length === 2 &&
    value.organizations.every(isOrganization);
}

function isOrganization(value: unknown): value is IdentityOrganization {
  return isRecord(value) &&
    typeof value.publicId === "string" &&
    typeof value.name === "string" &&
    typeof value.store === "string" &&
    Array.isArray(value.users) &&
    value.users.length === 2 &&
    value.users.every(isUser);
}

function isUser(value: unknown): value is IdentityUser {
  return isRecord(value) &&
    typeof value.publicId === "string" &&
    typeof value.name === "string" &&
    typeof value.tokenEnv === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
