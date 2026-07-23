import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  ids,
  responseJson,
  sequence,
  startFixture,
  tokens
} from './helpers.js';

test('created and updated notes survive clean process-equivalent restarts', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'notes-restart-'));
  const dataFile = join(directory, 'notes.sqlite');
  try {
    let fixture = await startFixture({
      directory,
      dataFile,
      idFactory: sequence([ids.first]),
      clock: sequence(['2026-05-01T00:00:00.000Z'])
    });
    const create = await fixture.request('/notes', {
      method: 'POST',
      token: tokens.a1,
      body: { title: 'Durable', body: 'before restart' }
    });
    const original = await responseJson(create);
    await fixture.stop();

    fixture = await startFixture({
      directory,
      dataFile,
      clock: sequence(['2026-05-02T00:00:00.000Z'])
    });
    const read = await fixture.request(`/notes/${ids.first}`, {
      token: tokens.a2
    });
    assert.deepEqual(await responseJson(read), original);
    const update = await fixture.request(`/notes/${ids.first}`, {
      method: 'PATCH',
      token: tokens.a2,
      body: { body: 'after restart' }
    });
    const updated = await responseJson(update);
    await fixture.stop();

    fixture = await startFixture({ directory, dataFile });
    const finalRead = await fixture.request(`/notes/${ids.first}`, {
      token: tokens.a1
    });
    assert.deepEqual(await responseJson(finalRead), updated);
    await fixture.stop();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
