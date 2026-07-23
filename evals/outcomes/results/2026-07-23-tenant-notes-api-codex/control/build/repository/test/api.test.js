import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { initialize } from '../src/init.js';
import { openStore } from '../src/store.js';
import {
  environment,
  ids,
  responseJson,
  sequence,
  startFixture,
  tokens
} from './helpers.js';

function assertErrorEnvelope(body, code) {
  assert.deepEqual(Object.keys(body), ['error']);
  assert.deepEqual(Object.keys(body.error), ['code', 'message', 'details']);
  assert.equal(body.error.code, code);
  assert.ok(typeof body.error.message === 'string');
  assert.ok(Array.isArray(body.error.details));
}

test('identity initialization is idempotent and owner membership is constrained', () => {
  const fixtureDirectory = mkdtempSync(join(tmpdir(), 'notes-identity-'));
  const file = join(fixtureDirectory, 'notes.sqlite');
  const store = openStore(file);
  try {
    const first = initialize({ store, environment, output() {} });
    const second = initialize({ store, environment, output() {} });
    assert.equal(first.created, true);
    assert.equal(second.created, false);

    const check = new DatabaseSync(file);
    try {
      check.exec('PRAGMA foreign_keys = ON');
      assert.throws(() => {
        check.prepare(`
          INSERT INTO notes
            (id, title, body, owner_id, organization_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          ids.first,
          'bad owner',
          '',
          'user-b1',
          'org-a',
          '2026-01-01T00:00:00.000Z',
          '2026-01-01T00:00:00.000Z'
        );
      }, /FOREIGN KEY/);
    } finally {
      check.close();
    }
  } finally {
    store.close();
    rmSync(fixtureDirectory, { recursive: true, force: true });
  }
});

test('all five operations return the same authentication failure', async (t) => {
  const fixture = await startFixture();
  t.after(() => fixture.stop({ remove: true }));
  const operations = [
    ['POST', '/notes', { title: 'x', body: '' }],
    ['GET', '/notes'],
    ['GET', `/notes/${ids.missing}`],
    ['PATCH', `/notes/${ids.missing}`, { title: 'x' }],
    ['DELETE', `/notes/${ids.missing}`]
  ];

  for (const [method, path, body] of operations) {
    for (const authorization of [undefined, 'Basic abc', 'Bearer unknown-token']) {
      const response = await fixture.request(path, {
        method,
        headers: authorization ? { Authorization: authorization } : {},
        body
      });
      assert.equal(response.status, 401);
      assert.equal(response.headers.get('www-authenticate'), 'Bearer');
      assert.deepEqual(await responseJson(response), {
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication is required',
          details: []
        }
      });
    }
  }
});

test('organization peers perform complete CRUD with immutable fields', async (t) => {
  const fixture = await startFixture({
    idFactory: sequence([ids.first]),
    clock: sequence([
      '2026-01-01T01:02:03.000Z',
      '2026-01-02T04:05:06.000Z'
    ])
  });
  t.after(() => fixture.stop({ remove: true }));

  const create = await fixture.request('/notes', {
    method: 'POST',
    token: tokens.a1,
    body: { title: '  Shared note  ', body: 'initial' }
  });
  assert.equal(create.status, 201);
  assert.equal(create.headers.get('location'), `/notes/${ids.first}`);
  const created = await responseJson(create);
  assert.deepEqual(created, {
    id: ids.first,
    title: 'Shared note',
    body: 'initial',
    ownerId: 'user-a1',
    organizationId: 'org-a',
    createdAt: '2026-01-01T01:02:03.000Z',
    updatedAt: '2026-01-01T01:02:03.000Z'
  });

  const list = await fixture.request('/notes', { token: tokens.a2 });
  assert.deepEqual(await responseJson(list), { notes: [created] });

  const read = await fixture.request(`/notes/${ids.first}`, {
    token: tokens.a2
  });
  assert.deepEqual(await responseJson(read), created);

  const patch = await fixture.request(`/notes/${ids.first}`, {
    method: 'PATCH',
    token: tokens.a2,
    body: { body: 'changed' }
  });
  const updated = await responseJson(patch);
  assert.deepEqual(updated, {
    ...created,
    body: 'changed',
    updatedAt: '2026-01-02T04:05:06.000Z'
  });

  const deletion = await fixture.request(`/notes/${ids.first}`, {
    method: 'DELETE',
    token: tokens.a2
  });
  assert.equal(deletion.status, 204);
  assert.equal(await deletion.text(), '');

  const missing = await fixture.request(`/notes/${ids.first}`, {
    token: tokens.a1
  });
  assert.equal(missing.status, 404);
  assertErrorEnvelope(await responseJson(missing), 'NOTE_NOT_FOUND');
});

test('list ordering is deterministic and organization scoped', async (t) => {
  const fixture = await startFixture({
    idFactory: sequence([ids.second, ids.first, ids.third]),
    clock: sequence([
      '2026-02-01T00:00:00.000Z',
      '2026-02-01T00:00:00.000Z',
      '2026-03-01T00:00:00.000Z'
    ])
  });
  t.after(() => fixture.stop({ remove: true }));

  for (const [token, title] of [
    [tokens.a1, 'A second ID'],
    [tokens.a2, 'A first ID'],
    [tokens.b1, 'B newer']
  ]) {
    const response = await fixture.request('/notes', {
      method: 'POST',
      token,
      body: { title, body: '' }
    });
    assert.equal(response.status, 201);
  }
  const response = await fixture.request('/notes', { token: tokens.a1 });
  const body = await responseJson(response);
  assert.deepEqual(body.notes.map((note) => note.id), [ids.first, ids.second]);
  assert.ok(body.notes.every((note) => note.organizationId === 'org-a'));
});

test('validation, routing, media type, payload, and internal errors are uniform', async (t) => {
  const fixture = await startFixture();
  t.after(() => fixture.stop({ remove: true }));

  const cases = [
    {
      options: { method: 'POST', token: tokens.a1, rawBody: '{' },
      path: '/notes',
      status: 400,
      code: 'INVALID_JSON'
    },
    {
      options: { method: 'POST', token: tokens.a1, body: [] },
      path: '/notes',
      status: 400,
      code: 'VALIDATION_ERROR'
    },
    {
      options: { method: 'POST', token: tokens.a1, body: { title: 'x' } },
      path: '/notes',
      status: 400,
      code: 'VALIDATION_ERROR'
    },
    {
      options: {
        method: 'POST',
        token: tokens.a1,
        body: { title: ' ', body: '', ownerId: 'user-b1' }
      },
      path: '/notes',
      status: 400,
      code: 'VALIDATION_ERROR'
    },
    {
      options: {
        method: 'POST',
        token: tokens.a1,
        body: { title: 'x'.repeat(201), body: '' }
      },
      path: '/notes',
      status: 400,
      code: 'VALIDATION_ERROR'
    },
    {
      options: {
        method: 'POST',
        token: tokens.a1,
        body: { title: 'x', body: 'x'.repeat(50_001) }
      },
      path: '/notes',
      status: 400,
      code: 'VALIDATION_ERROR'
    },
    {
      options: { method: 'PATCH', token: tokens.a1, body: {} },
      path: `/notes/${ids.missing}`,
      status: 400,
      code: 'VALIDATION_ERROR'
    },
    {
      options: { token: tokens.a1 },
      path: '/notes/not-a-uuid',
      status: 400,
      code: 'VALIDATION_ERROR'
    },
    {
      options: {
        method: 'POST',
        token: tokens.a1,
        rawBody: '{}',
        contentType: 'text/plain'
      },
      path: '/notes',
      status: 415,
      code: 'UNSUPPORTED_MEDIA_TYPE'
    },
    {
      options: {
        method: 'POST',
        token: tokens.a1,
        rawBody: 'x'.repeat(65_537)
      },
      path: '/notes',
      status: 413,
      code: 'PAYLOAD_TOO_LARGE'
    }
  ];

  for (const item of cases) {
    const response = await fixture.request(item.path, item.options);
    assert.equal(response.status, item.status);
    assertErrorEnvelope(await responseJson(response), item.code);
  }

  const route = await fixture.request('/other', { token: tokens.a1 });
  assert.equal(route.status, 404);
  assertErrorEnvelope(await responseJson(route), 'ROUTE_NOT_FOUND');

  const method = await fixture.request('/notes', {
    method: 'PUT',
    token: tokens.a1,
    body: {}
  });
  assert.equal(method.status, 405);
  assert.equal(method.headers.get('allow'), 'GET, POST');
  assertErrorEnvelope(await responseJson(method), 'METHOD_NOT_ALLOWED');
});

test('unexpected store failures expose no implementation details', async (t) => {
  const logged = [];
  const fixture = await startFixture({ logger: { error: (...args) => logged.push(args) } });
  t.after(() => fixture.stop({ remove: true }));
  fixture.store.listNotesForOrganization = () => {
    throw new Error('SQL token=/secret/path stack detail');
  };
  const response = await fixture.request('/notes', { token: tokens.a1 });
  assert.equal(response.status, 500);
  const text = await response.text();
  assert.doesNotMatch(text, /SQL|secret|stack|path|token/);
  assert.deepEqual(JSON.parse(text), {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      details: []
    }
  });
  assert.equal(logged.length, 1);
});
