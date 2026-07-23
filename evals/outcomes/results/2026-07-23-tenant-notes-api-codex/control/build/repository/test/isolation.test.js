import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import {
  ids,
  responseJson,
  sequence,
  startFixture,
  tokens
} from './helpers.js';

async function create(fixture, token, title, body) {
  const response = await fixture.request('/notes', {
    method: 'POST',
    token,
    body: { title, body }
  });
  assert.equal(response.status, 201);
  return responseJson(response);
}

test('known note IDs do not cross the organization boundary in either direction', async (t) => {
  const fixture = await startFixture({
    idFactory: sequence([ids.first, ids.second]),
    clock: sequence([
      '2026-04-01T00:00:00.000Z',
      '2026-04-02T00:00:00.000Z',
      '2026-04-03T00:00:00.000Z',
      '2026-04-04T00:00:00.000Z',
      '2026-04-05T00:00:00.000Z',
      '2026-04-06T00:00:00.000Z'
    ])
  });
  t.after(() => fixture.stop({ remove: true }));

  const noteA = await create(fixture, tokens.a1, 'A control', 'A private body');
  const noteB = await create(fixture, tokens.b1, 'B original', 'B private body');

  for (const attacker of [tokens.a1, tokens.a2]) {
    const list = await fixture.request('/notes', { token: attacker });
    const listText = await list.text();
    assert.match(listText, /A control/);
    assert.doesNotMatch(listText, new RegExp(noteB.id));
    assert.doesNotMatch(listText, /B original|B private body/);

    const hidden = await fixture.request(`/notes/${noteB.id}`, {
      token: attacker
    });
    const absent = await fixture.request(`/notes/${ids.missing}`, {
      token: attacker
    });
    assert.equal(hidden.status, 404);
    assert.equal(absent.status, 404);
    const hiddenBody = await responseJson(hidden);
    const absentBody = await responseJson(absent);
    assert.deepEqual(hiddenBody, absentBody);
    assert.doesNotMatch(JSON.stringify(hiddenBody), /B original|B private|org-b|user-b1/);

    const patch = await fixture.request(`/notes/${noteB.id}`, {
      method: 'PATCH',
      token: attacker,
      body: { title: `attacker-${attacker}`, body: 'attacker body' }
    });
    assert.equal(patch.status, 404);
    assert.deepEqual(await responseJson(patch), absentBody);

    const afterPatch = await fixture.request(`/notes/${noteB.id}`, {
      token: tokens.b1
    });
    assert.deepEqual(await responseJson(afterPatch), noteB);

    const deletion = await fixture.request(`/notes/${noteB.id}`, {
      method: 'DELETE',
      token: attacker
    });
    assert.equal(deletion.status, 404);
    assert.deepEqual(await responseJson(deletion), absentBody);

    const afterDelete = await fixture.request(`/notes/${noteB.id}`, {
      token: tokens.b2
    });
    assert.deepEqual(await responseJson(afterDelete), noteB);

    const check = new DatabaseSync(fixture.dataFile);
    try {
      const rows = check.prepare('SELECT * FROM notes WHERE id = ?').all(noteB.id);
      assert.equal(rows.length, 1);
      assert.equal(rows[0].organization_id, 'org-b');
      assert.equal(rows[0].title, noteB.title);
      assert.equal(rows[0].body, noteB.body);
      assert.equal(rows[0].updated_at, noteB.updatedAt);
    } finally {
      check.close();
    }
  }

  for (const [method, body] of [
    ['GET', undefined],
    ['PATCH', { title: 'B attack' }],
    ['DELETE', undefined]
  ]) {
    const response = await fixture.request(`/notes/${noteA.id}`, {
      method,
      token: tokens.b1,
      body
    });
    assert.equal(response.status, 404);
    assert.equal((await responseJson(response)).error.code, 'NOTE_NOT_FOUND');
  }
  const stillA = await fixture.request(`/notes/${noteA.id}`, {
    token: tokens.a1
  });
  assert.deepEqual(await responseJson(stillA), noteA);
});

test('tenant and owner fields cannot be supplied during creation', async (t) => {
  const fixture = await startFixture();
  t.after(() => fixture.stop({ remove: true }));

  for (const unwanted of [
    { organizationId: 'org-b' },
    { ownerId: 'user-b1' }
  ]) {
    const response = await fixture.request('/notes', {
      method: 'POST',
      token: tokens.a1,
      body: { title: 'attempt', body: '', ...unwanted }
    });
    assert.equal(response.status, 400);
    const result = await responseJson(response);
    assert.equal(result.error.code, 'VALIDATION_ERROR');
    assert.equal(result.error.details.at(-1).message, 'is not allowed');
  }

  const check = new DatabaseSync(fixture.dataFile);
  try {
    assert.equal(check.prepare('SELECT COUNT(*) AS count FROM notes').get().count, 0);
  } finally {
    check.close();
  }
});
