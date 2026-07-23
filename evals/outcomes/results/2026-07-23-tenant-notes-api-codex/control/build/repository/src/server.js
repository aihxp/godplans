import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { createApp } from './app.js';
import { initialize } from './init.js';
import { openStore } from './store.js';

const dataFile = resolve(process.env.DATA_FILE ?? './data/notes.sqlite');
const port = Number(process.env.PORT ?? 3000);

if (!Number.isInteger(port) || port < 0 || port > 65_535) {
  console.error('PORT must be an integer between 0 and 65535');
  process.exit(1);
}

let store;
try {
  store = openStore(dataFile);
} catch (error) {
  if (error?.code === 'ERR_UNKNOWN_BUILTIN_MODULE') {
    console.error('This application requires Node.js 22.13 or newer with node:sqlite.');
  } else {
    console.error('Unable to open the notes database:', error.message);
  }
  process.exit(1);
}

try {
  initialize({ store });
} catch (error) {
  console.error('Unable to initialize identities:', error.message);
  store.close();
  process.exit(1);
}

const server = createServer(
  createApp({ store, clock: () => new Date(), idFactory: randomUUID })
);

let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  server.close(() => {
    store.close();
    process.exit(0);
  });
}

server.on('error', (error) => {
  console.error('HTTP server error:', error.message);
  store.close();
  process.exit(1);
});

server.listen(port, '127.0.0.1', () => {
  const address = server.address();
  console.log(`Notes API listening on http://127.0.0.1:${address.port}`);
  console.log(`Database: ${dataFile}`);
});

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
