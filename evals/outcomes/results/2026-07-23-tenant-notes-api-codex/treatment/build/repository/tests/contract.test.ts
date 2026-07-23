import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { openApiDocument } from "../src/routes/contract.ts";
import { auth, createFixture, TOKENS } from "./helpers/stores.ts";

describe("HTTP contract", () => {
  it("matches the committed OpenAPI document", () => {
    assert.deepEqual(JSON.parse(readFileSync("openapi.json", "utf8")), openApiDocument);
  });

  it("rejects identity injection and unknown fields", async () => {
    const fixture = createFixture();
    try {
      const response = await fixture.app.inject({
        method: "POST",
        url: "/v1/notes",
        headers: auth(TOKENS.a1),
        payload: {
          title: "No",
          body: "No",
          organizationId: "10000000-0000-4000-8000-000000000002",
        },
      });
      const problem = response.json() as { code: string; errors: unknown[] };
      assert.equal(response.statusCode, 400);
      assert.equal(problem.code, "VALIDATION_FAILED");
      assert.equal(problem.errors.length, 1);
      const list = await fixture.app.inject({
        method: "GET",
        url: "/v1/notes",
        headers: auth(TOKENS.a1),
      });
      assert.deepEqual((list.json() as { items: unknown[] }).items, []);
    } finally {
      await fixture.cleanup();
    }
  });

  it("sets private-response headers without wildcard CORS", async () => {
    const fixture = createFixture();
    try {
      const response = await fixture.app.inject({
        method: "GET",
        url: "/v1/notes",
        headers: auth(TOKENS.a1),
      });
      assert.equal(response.headers["cache-control"], "no-store");
      assert.equal(response.headers["x-content-type-options"], "nosniff");
      assert.equal(response.headers["access-control-allow-origin"], undefined);
    } finally {
      await fixture.cleanup();
    }
  });
});
