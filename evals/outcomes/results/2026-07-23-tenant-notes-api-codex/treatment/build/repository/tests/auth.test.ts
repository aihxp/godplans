import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { auth, createFixture, createNote, TOKENS } from "./helpers/stores.ts";

describe("bearer authentication", () => {
  it("returns the same Problem Details shape for missing and invalid tokens", async () => {
    const fixture = createFixture();
    try {
      const missing = await fixture.app.inject({ method: "GET", url: "/v1/notes" });
      const invalid = await fixture.app.inject({
        method: "GET",
        url: "/v1/notes",
        headers: auth("x".repeat(32)),
      });
      assert.equal(missing.statusCode, 401);
      assert.equal(invalid.statusCode, 401);
      assert.equal(missing.headers["content-type"], "application/problem+json");
      assert.equal((missing.json() as { code: string }).code, "AUTHENTICATION_REQUIRED");
      assert.equal((invalid.json() as { code: string }).code, "AUTHENTICATION_REQUIRED");
    } finally {
      await fixture.cleanup();
    }
  });

  it("derives the owner and organization from a valid token", async () => {
    const fixture = createFixture();
    try {
      const response = await createNote(fixture.app, TOKENS.a2);
      const note = response.json() as { ownerId: string; organizationId: string };
      assert.equal(note.ownerId, "20000000-0000-4000-8000-000000000002");
      assert.equal(note.organizationId, "10000000-0000-4000-8000-000000000001");
    } finally {
      await fixture.cleanup();
    }
  });

  it("rejects an expired token with the generic authentication response", async () => {
    const fixture = createFixture();
    try {
      fixture.time.value = new Date("2026-07-23T20:00:01.000Z");
      const response = await fixture.app.inject({
        method: "GET",
        url: "/v1/notes",
        headers: auth(TOKENS.a1),
      });
      assert.equal(response.statusCode, 401);
      assert.equal((response.json() as { code: string }).code, "AUTHENTICATION_REQUIRED");
    } finally {
      await fixture.cleanup();
    }
  });

  it("throttles the thirty-first failed attempt and emits one spike event", async () => {
    const fixture = createFixture();
    try {
      let response;
      for (let index = 0; index < 31; index += 1) {
        response = await fixture.app.inject({
          method: "GET",
          url: "/v1/notes",
          remoteAddress: "192.0.2.1",
        });
      }
      assert.equal(response?.statusCode, 429);
      assert.equal((response?.json() as { code: string }).code, "AUTH_RATE_LIMITED");
      assert.equal(
        fixture.logs.filter((event) => event.event === "auth_denial_spike").length,
        1,
      );
    } finally {
      await fixture.cleanup();
    }
  });
});
