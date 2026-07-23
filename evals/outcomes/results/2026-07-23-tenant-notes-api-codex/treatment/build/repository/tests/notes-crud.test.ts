import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { auth, createFixture, createNote, TOKENS } from "./helpers/stores.ts";

describe("note CRUD", () => {
  it("creates, reads, peer-updates, lists, and deletes a note", async () => {
    const fixture = createFixture();
    try {
      const created = await createNote(fixture.app, TOKENS.a1, "First", "Original");
      assert.equal(created.statusCode, 201);
      const original = created.json() as { id: string; ownerId: string };
      const read = await fixture.app.inject({
        method: "GET",
        url: `/v1/notes/${original.id}`,
        headers: auth(TOKENS.a2),
      });
      assert.equal(read.statusCode, 200);
      fixture.time.value = new Date("2026-07-23T12:02:00.000Z");
      const updated = await fixture.app.inject({
        method: "PATCH",
        url: `/v1/notes/${original.id}`,
        headers: auth(TOKENS.a2),
        payload: { title: "Peer update" },
      });
      const note = updated.json() as { title: string; ownerId: string; body: string };
      assert.equal(note.title, "Peer update");
      assert.equal(note.body, "Original");
      assert.equal(note.ownerId, original.ownerId);
      const listed = await fixture.app.inject({
        method: "GET",
        url: "/v1/notes",
        headers: auth(TOKENS.a1),
      });
      assert.equal((listed.json() as { items: unknown[] }).items.length, 1);
      const deleted = await fixture.app.inject({
        method: "DELETE",
        url: `/v1/notes/${original.id}`,
        headers: auth(TOKENS.a1),
      });
      assert.equal(deleted.statusCode, 204);
      const absent = await fixture.app.inject({
        method: "GET",
        url: `/v1/notes/${original.id}`,
        headers: auth(TOKENS.a1),
      });
      assert.equal(absent.statusCode, 404);
    } finally {
      await fixture.cleanup();
    }
  });

  it("paginates in stable descending creation and id order", async () => {
    const fixture = createFixture();
    try {
      const first = await createNote(fixture.app, TOKENS.a1, "One");
      const second = await createNote(fixture.app, TOKENS.a1, "Two");
      const third = await createNote(fixture.app, TOKENS.a1, "Three");
      const pageOne = await fixture.app.inject({
        method: "GET",
        url: "/v1/notes?limit=2",
        headers: auth(TOKENS.a1),
      });
      const one = pageOne.json() as { items: { id: string }[]; nextCursor: string };
      assert.deepEqual(
        one.items.map((note) => note.id),
        [(third.json() as { id: string }).id, (second.json() as { id: string }).id],
      );
      const pageTwo = await fixture.app.inject({
        method: "GET",
        url: `/v1/notes?limit=2&cursor=${encodeURIComponent(one.nextCursor)}`,
        headers: auth(TOKENS.a1),
      });
      const two = pageTwo.json() as { items: { id: string }[]; nextCursor?: string };
      assert.deepEqual(two.items.map((note) => note.id), [(first.json() as { id: string }).id]);
      assert.equal(two.nextCursor, undefined);
    } finally {
      await fixture.cleanup();
    }
  });
});
