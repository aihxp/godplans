import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { auth, createFixture, createNote, TOKENS } from "./helpers/stores.ts";

describe("known-id tenant isolation", () => {
  it("omits organization B's note from organization A's list", async () => {
    const fixture = createFixture();
    try {
      const created = await createNote(fixture.app, TOKENS.b1, "B secret", "Private");
      const note = created.json() as { id: string };
      const list = await fixture.app.inject({
        method: "GET",
        url: "/v1/notes",
        headers: auth(TOKENS.a1),
      });
      assert.ok(!(list.body).includes(note.id));
      assert.equal((await get(fixture, note.id, TOKENS.b1)).statusCode, 200);
    } finally {
      await fixture.cleanup();
    }
  });

  it("returns indistinguishable 404 for a known cross-organization id", async () => {
    const fixture = createFixture();
    try {
      const created = await createNote(fixture.app, TOKENS.b1, "B secret", "Private");
      const original = created.json() as Record<string, unknown> & { id: string };
      const absentId = "30000000-0000-4000-8000-000000000099";
      const denied = await get(fixture, original.id, TOKENS.a1);
      const absent = await get(fixture, absentId, TOKENS.a1);
      assert.equal(denied.statusCode, 404);
      const deniedProblem = denied.json() as Record<string, unknown>;
      const absentProblem = absent.json() as Record<string, unknown>;
      assert.deepEqual(
        { ...deniedProblem, instance: "<request-path>" },
        { ...absentProblem, instance: "<request-path>" },
      );
      assert.deepEqual((await get(fixture, original.id, TOKENS.b1)).json(), original);
    } finally {
      await fixture.cleanup();
    }
  });

  it("denies known-id patch and preserves every organization B field", async () => {
    const fixture = createFixture();
    try {
      const created = await createNote(fixture.app, TOKENS.b1, "B secret", "Private");
      const original = created.json() as Record<string, unknown> & { id: string };
      const denied = await fixture.app.inject({
        method: "PATCH",
        url: `/v1/notes/${original.id}`,
        headers: auth(TOKENS.a1),
        payload: { title: "Stolen", body: "Changed" },
      });
      assert.equal(denied.statusCode, 404);
      assert.deepEqual((await get(fixture, original.id, TOKENS.b1)).json(), original);
    } finally {
      await fixture.cleanup();
    }
  });

  it("denies known-id delete and preserves every organization B field", async () => {
    const fixture = createFixture();
    try {
      const created = await createNote(fixture.app, TOKENS.b1, "B secret", "Private");
      const original = created.json() as Record<string, unknown> & { id: string };
      const denied = await fixture.app.inject({
        method: "DELETE",
        url: `/v1/notes/${original.id}`,
        headers: auth(TOKENS.a1),
      });
      assert.equal(denied.statusCode, 404);
      assert.deepEqual((await get(fixture, original.id, TOKENS.b1)).json(), original);
    } finally {
      await fixture.cleanup();
    }
  });

  it("rejects owner and organization injection without creating a note", async () => {
    const fixture = createFixture();
    try {
      for (const key of ["ownerId", "organizationId"]) {
        const denied = await fixture.app.inject({
          method: "POST",
          url: "/v1/notes",
          headers: auth(TOKENS.a1),
          payload: { title: "Injected", body: "Denied", [key]: "x" },
        });
        assert.equal(denied.statusCode, 400);
      }
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
});

function get(
  fixture: ReturnType<typeof createFixture>,
  id: string,
  token: string,
) {
  return fixture.app.inject({
    method: "GET",
    url: `/v1/notes/${id}`,
    headers: auth(token),
  });
}
