import { createHash } from 'node:crypto';

export function hashToken(token) {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

function authorizationValues(request) {
  const values = [];
  for (let index = 0; index < request.rawHeaders.length; index += 2) {
    if (request.rawHeaders[index].toLowerCase() === 'authorization') {
      values.push(request.rawHeaders[index + 1]);
    }
  }
  return values;
}

export function authenticate(request, store) {
  const values = authorizationValues(request);
  if (values.length !== 1) return null;

  const match = /^Bearer ([^\s,]+)$/.exec(values[0]);
  if (!match) return null;

  return store.findUserByTokenHash(hashToken(match[1]));
}
