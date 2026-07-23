import { mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { createApp } from '../src/app.js';
import { initialize } from '../src/init.js';
import { openStore } from '../src/store.js';

export const tokens = {
  a1: 'test-token-a1',
  a2: 'test-token-a2',
  b1: 'test-token-b1',
  b2: 'test-token-b2'
};

export const environment = {
  TOKEN_USER_A1: tokens.a1,
  TOKEN_USER_A2: tokens.a2,
  TOKEN_USER_B1: tokens.b1,
  TOKEN_USER_B2: tokens.b2
};

export const ids = {
  first: '11111111-1111-4111-8111-111111111111',
  second: '22222222-2222-4222-8222-222222222222',
  third: '33333333-3333-4333-8333-333333333333',
  missing: '99999999-9999-4999-8999-999999999999'
};

export function sequence(values) {
  let index = 0;
  return () => {
    if (index >= values.length) throw new Error('Test sequence exhausted');
    return values[index++];
  };
}

export async function startFixture(options = {}) {
  const directory = options.directory ?? mkdtempSync(join(tmpdir(), 'notes-api-'));
  const dataFile = options.dataFile ?? join(directory, 'notes.sqlite');
  const store = openStore(dataFile);
  initialize({
    store,
    environment,
    output: () => {}
  });

  const idFactory = options.idFactory ?? sequence([
    ids.first,
    ids.second,
    ids.third
  ]);
  const clock = options.clock ?? sequence([
    '2026-01-01T00:00:00.000Z',
    '2026-01-02T00:00:00.000Z',
    '2026-01-03T00:00:00.000Z',
    '2026-01-04T00:00:00.000Z'
  ]);
  const logger = options.logger ?? { error() {} };
  const app = createApp({ store, idFactory, clock, logger });
  const server = createServer(app);
  let network = true;
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
  } catch (error) {
    if (error.code !== 'EPERM') throw error;
    network = false;
  }
  const address = network ? server.address() : null;

  async function directRequest(path, { method, headers, payload }) {
    const request = Readable.from(
      payload === undefined ? [] : [Buffer.from(payload)]
    );
    request.url = path;
    request.method = method;
    request.headers = {};
    request.rawHeaders = [];
    for (const [name, value] of Object.entries(headers)) {
      request.headers[name.toLowerCase()] = value;
      request.rawHeaders.push(name, value);
    }
    if (payload !== undefined && request.headers['content-length'] === undefined) {
      request.headers['content-length'] = String(Buffer.byteLength(payload));
      request.rawHeaders.push('Content-Length', request.headers['content-length']);
    }

    let status;
    const responseHeaders = {};
    let responseBody = Buffer.alloc(0);
    let finish;
    const finished = new Promise((resolve) => {
      finish = resolve;
    });
    const response = {
      writeHead(code, outgoingHeaders = {}) {
        status = code;
        for (const [name, value] of Object.entries(outgoingHeaders)) {
          responseHeaders[name] = String(value);
        }
      },
      end(value) {
        if (value !== undefined) responseBody = Buffer.from(value);
        finish();
      }
    };
    await app(request, response);
    await finished;
    return {
      status,
      headers: new Headers(responseHeaders),
      async text() {
        return responseBody.toString('utf8');
      }
    };
  }

  let stopped = false;
  return {
    directory,
    dataFile,
    store,
    server,
    baseUrl: network ? `http://127.0.0.1:${address.port}` : null,

    async request(path, {
      method = 'GET',
      token,
      body,
      rawBody,
      contentType,
      headers = {}
    } = {}) {
      const requestHeaders = { ...headers };
      if (token !== undefined) {
        requestHeaders.Authorization = `Bearer ${token}`;
      }
      let payload;
      if (rawBody !== undefined) {
        payload = rawBody;
      } else if (body !== undefined) {
        payload = JSON.stringify(body);
      }
      if (payload !== undefined && contentType !== null) {
        requestHeaders['Content-Type'] = contentType ?? 'application/json';
      }
      if (!network) {
        return directRequest(path, { method, headers: requestHeaders, payload });
      }
      return fetch(`${this.baseUrl}${path}`, {
        method,
        headers: requestHeaders,
        body: payload
      });
    },

    async stop({ remove = false } = {}) {
      if (!stopped) {
        if (network) {
          await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
          });
        }
        store.close();
        stopped = true;
      }
      if (remove) rmSync(directory, { recursive: true, force: true });
    }
  };
}

export async function responseJson(response) {
  return JSON.parse(await response.text());
}

export function bearer(token) {
  return { Authorization: `Bearer ${token}` };
}
