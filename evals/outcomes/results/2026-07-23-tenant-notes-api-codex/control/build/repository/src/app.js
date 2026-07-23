import { authenticate } from './auth.js';
import {
  limits,
  validateCreateNote,
  validateNoteId,
  validateUpdateNote
} from './validation.js';

class HttpError extends Error {
  constructor(status, code, message, details = [], headers = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.headers = headers;
  }
}

const errors = {
  unauthenticated: () =>
    new HttpError(401, 'UNAUTHENTICATED', 'Authentication is required', [], {
      'WWW-Authenticate': 'Bearer'
    }),
  noteNotFound: () =>
    new HttpError(404, 'NOTE_NOT_FOUND', 'Note not found'),
  routeNotFound: () =>
    new HttpError(404, 'ROUTE_NOT_FOUND', 'Route not found'),
  methodNotAllowed: (allowed) =>
    new HttpError(405, 'METHOD_NOT_ALLOWED', 'Method not allowed', [], {
      Allow: allowed.join(', ')
    }),
  validation: (details) =>
    new HttpError(
      400,
      'VALIDATION_ERROR',
      'Request validation failed',
      details
    )
};

function json(response, status, value, headers = {}) {
  const body = JSON.stringify(value);
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    ...headers
  });
  response.end(body);
}

function sendError(response, error) {
  json(
    response,
    error.status,
    {
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    },
    error.headers
  );
}

function requireJsonContentType(request) {
  const contentType = request.headers['content-type'];
  if (
    typeof contentType !== 'string' ||
    !/^application\/json(?:\s*;\s*charset=[A-Za-z0-9._-]+)?$/i.test(contentType)
  ) {
    throw new HttpError(
      415,
      'UNSUPPORTED_MEDIA_TYPE',
      'Content-Type must be application/json'
    );
  }
}

async function readJson(request) {
  requireJsonContentType(request);

  const declaredLength = Number(request.headers['content-length']);
  if (
    Number.isFinite(declaredLength) &&
    declaredLength > limits.payloadBytes
  ) {
    request.resume();
    throw new HttpError(
      413,
      'PAYLOAD_TOO_LARGE',
      'Request payload is too large'
    );
  }

  const chunks = await new Promise((resolve, reject) => {
    const buffered = [];
    let size = 0;
    let settled = false;
    request.on('data', (chunk) => {
      if (settled) return;
      size += chunk.length;
      if (size > limits.payloadBytes) {
        settled = true;
        buffered.length = 0;
        reject(
          new HttpError(
            413,
            'PAYLOAD_TOO_LARGE',
            'Request payload is too large'
          )
        );
        return;
      }
      buffered.push(chunk);
    });
    request.on('end', () => {
      if (!settled) {
        settled = true;
        resolve(buffered);
      }
    });
    request.on('error', (error) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    });
  });

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'INVALID_JSON', 'Request body contains invalid JSON');
  }
}

function isoTimestamp(clock) {
  const value = clock();
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString();
}

function identifyRoute(pathname, method) {
  if (pathname === '/notes') {
    if (method === 'POST') return { operation: 'create' };
    if (method === 'GET') return { operation: 'list' };
    throw errors.methodNotAllowed(['GET', 'POST']);
  }

  const match = /^\/notes\/([^/]+)$/.exec(pathname);
  if (!match) throw errors.routeNotFound();
  if (method === 'GET') return { operation: 'read', noteId: match[1] };
  if (method === 'PATCH') return { operation: 'update', noteId: match[1] };
  if (method === 'DELETE') return { operation: 'delete', noteId: match[1] };
  throw errors.methodNotAllowed(['GET', 'PATCH', 'DELETE']);
}

export function createApp({
  store,
  clock = () => new Date(),
  idFactory,
  logger = console
}) {
  if (!store) throw new TypeError('store is required');
  if (!idFactory) throw new TypeError('idFactory is required');

  return async function app(request, response) {
    try {
      const url = new URL(request.url, 'http://localhost');
      const route = identifyRoute(url.pathname, request.method);
      const user = authenticate(request, store);
      if (!user) throw errors.unauthenticated();

      if (route.noteId) {
        const issues = validateNoteId(route.noteId);
        if (issues.length > 0) throw errors.validation(issues);
      }

      if (route.operation === 'create') {
        const validation = validateCreateNote(await readJson(request));
        if (validation.issues.length > 0) {
          throw errors.validation(validation.issues);
        }
        const note = store.createNote({
          id: idFactory(),
          ...validation.value,
          ownerId: user.id,
          organizationId: user.organizationId,
          now: isoTimestamp(clock)
        });
        json(response, 201, note, { Location: `/notes/${note.id}` });
        return;
      }

      if (route.operation === 'list') {
        json(response, 200, {
          notes: store.listNotesForOrganization(user.organizationId)
        });
        return;
      }

      if (route.operation === 'read') {
        const note = store.getNoteForOrganization(
          route.noteId,
          user.organizationId
        );
        if (!note) throw errors.noteNotFound();
        json(response, 200, note);
        return;
      }

      if (route.operation === 'update') {
        const validation = validateUpdateNote(await readJson(request));
        if (validation.issues.length > 0) {
          throw errors.validation(validation.issues);
        }
        const note = store.updateNoteForOrganization(
          route.noteId,
          user.organizationId,
          validation.value,
          isoTimestamp(clock)
        );
        if (!note) throw errors.noteNotFound();
        json(response, 200, note);
        return;
      }

      const deleted = store.deleteNoteForOrganization(
        route.noteId,
        user.organizationId
      );
      if (!deleted) throw errors.noteNotFound();
      response.writeHead(204);
      response.end();
    } catch (error) {
      if (error instanceof HttpError) {
        sendError(response, error);
        return;
      }
      logger.error('Unexpected request error', error);
      sendError(
        response,
        new HttpError(500, 'INTERNAL_ERROR', 'Internal server error')
      );
    }
  };
}
