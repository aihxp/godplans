import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const document = JSON.parse(
  await readFile(new URL('../openapi.json', import.meta.url), 'utf8')
);

test('OpenAPI is the complete five-operation contract', () => {
  assert.match(document.openapi, /^3\.1\./);
  assert.deepEqual(Object.keys(document.paths).sort(), [
    '/notes',
    '/notes/{noteId}'
  ]);

  const operations = [];
  for (const path of Object.values(document.paths)) {
    for (const method of ['get', 'post', 'patch', 'delete']) {
      if (path[method]) operations.push(path[method]);
    }
  }
  assert.equal(operations.length, 5);
  assert.deepEqual(
    operations.map((operation) => operation.operationId).sort(),
    ['createNote', 'deleteNote', 'getNote', 'listNotes', 'updateNote']
  );
  for (const operation of operations) {
    assert.deepEqual(operation.security, [{ bearerAuth: [] }]);
  }
});

test('contract uses JSON request bodies and the shared Error schema', () => {
  assert.equal(
    document.components.securitySchemes.bearerAuth.scheme,
    'bearer'
  );
  assert.ok(document.components.schemas.Note);
  assert.ok(document.components.schemas.CreateNoteRequest);
  assert.ok(document.components.schemas.UpdateNoteRequest);
  assert.ok(document.components.schemas.NoteList);
  assert.ok(document.components.schemas.Error);

  assert.deepEqual(
    Object.keys(document.paths['/notes'].post.requestBody.content),
    ['application/json']
  );
  assert.deepEqual(
    Object.keys(document.paths['/notes/{noteId}'].patch.requestBody.content),
    ['application/json']
  );

  for (const response of Object.values(document.components.responses)) {
    assert.equal(
      response.content['application/json'].schema.$ref,
      '#/components/schemas/Error'
    );
  }
});
