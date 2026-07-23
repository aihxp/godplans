import { timingSafeEqual } from "node:crypto";
import { join } from "node:path";
import type { AppConfig } from "./config.ts";
import { getStorePaths } from "./config.ts";
import { AppError } from "./errors.ts";
import { openStore } from "./db/open-store.ts";
import { hashToken } from "./db/seed.ts";
import type { Logger, Principal } from "./types.ts";

type FailureWindow = {
  startedAt: number;
  count: number;
  didLogSpike: boolean;
};

type TokenRow = {
  token_hash: Uint8Array;
  user_id: string;
  organization_id: string;
  expires_at: string;
};

export class Authenticator {
  readonly #failures = new Map<string, FailureWindow>();
  readonly config: AppConfig;
  readonly logger: Logger;
  readonly now: () => Date;

  constructor(
    config: AppConfig,
    logger: Logger,
    now: () => Date = () => new Date(),
  ) {
    this.config = config;
    this.logger = logger;
    this.now = now;
    this.validateStores();
  }

  authenticate(header: string | undefined, ip: string): Principal {
    if (this.isThrottled(ip)) {
      throw new AppError(429, "AUTH_RATE_LIMITED", "Try again in one minute.");
    }
    const token = parseBearer(header);
    if (!token) return this.reject(ip);
    const matches = this.findMatches(hashToken(token));
    if (matches.length !== 1) return this.reject(ip);
    const match = matches[0];
    if (!match || new Date(match.row.expires_at) <= this.now()) {
      return this.reject(ip);
    }
    this.#failures.delete(ip);
    return {
      userId: match.row.user_id,
      organizationId: match.row.organization_id,
      storePath: match.storePath,
    };
  }

  validateStores(): void {
    const seenHashes = new Set<string>();
    let organizationCount = 0;
    for (const storePath of getStorePaths(this.config)) {
      const database = openStore(storePath, { readOnly: true });
      try {
        const rows = database.prepare(
          `SELECT a.token_hash, u.organization_id
           FROM access_tokens a JOIN users u ON u.public_id = a.user_id`,
        ).all() as { token_hash: Uint8Array; organization_id: string }[];
        const organizations = database.prepare(
          "SELECT COUNT(*) AS count FROM organizations",
        ).get() as { count: number };
        if (organizations.count !== 1) {
          throw new Error("Each store must contain exactly one organization");
        }
        organizationCount += organizations.count;
        for (const row of rows) {
          const key = Buffer.from(row.token_hash).toString("hex");
          if (seenHashes.has(key)) throw new Error("Duplicate token hash across stores");
          seenHashes.add(key);
        }
      } finally {
        database.close();
      }
    }
    if (organizationCount !== 2) throw new Error("Exactly two stores are required");
  }

  private findMatches(digest: Buffer) {
    const matches: { row: TokenRow; storePath: string }[] = [];
    for (const organization of this.config.identities.organizations) {
      const storePath = join(this.config.dataDir, organization.store);
      const database = openStore(storePath, { readOnly: true });
      try {
        const rows = database.prepare(
          `SELECT a.token_hash, a.user_id, a.expires_at, u.organization_id
           FROM access_tokens a JOIN users u ON u.public_id = a.user_id`,
        ).all() as TokenRow[];
        for (const row of rows) {
          const stored = Buffer.from(row.token_hash);
          if (stored.length === digest.length && timingSafeEqual(stored, digest)) {
            matches.push({ row, storePath });
          }
        }
      } finally {
        database.close();
      }
    }
    return matches;
  }

  private reject(ip: string): never {
    const current = this.recordFailure(ip);
    if (current.count > 30) {
      throw new AppError(429, "AUTH_RATE_LIMITED", "Try again in one minute.");
    }
    throw new AppError(
      401,
      "AUTHENTICATION_REQUIRED",
      "Provide a valid, unexpired bearer token.",
    );
  }

  private isThrottled(ip: string): boolean {
    return (this.getActiveFailure(ip)?.count ?? 0) > 30;
  }

  private recordFailure(ip: string): FailureWindow {
    this.pruneFailures();
    const failure = this.getActiveFailure(ip) ?? {
      startedAt: this.now().getTime(),
      count: 0,
      didLogSpike: false,
    };
    failure.count += 1;
    if (failure.count >= 10 && !failure.didLogSpike) {
      failure.didLogSpike = true;
      this.logger.write({ event: "auth_denial_spike", ip, outcome: "denied" });
    }
    this.#failures.set(ip, failure);
    return failure;
  }

  private getActiveFailure(ip: string): FailureWindow | undefined {
    const failure = this.#failures.get(ip);
    if (failure && this.now().getTime() - failure.startedAt < 60_000) {
      return failure;
    }
    if (failure) this.#failures.delete(ip);
    return undefined;
  }

  private pruneFailures(): void {
    for (const ip of this.#failures.keys()) this.getActiveFailure(ip);
    while (this.#failures.size >= 1_000) {
      const oldest = this.#failures.keys().next().value as string | undefined;
      if (!oldest) break;
      this.#failures.delete(oldest);
    }
  }
}

function parseBearer(header: string | undefined): string | undefined {
  if (!header) return undefined;
  const match = /^Bearer ([^\s]+)$/.exec(header);
  return match?.[1];
}
