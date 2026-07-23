import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { hashToken } from './auth.js';
import { openStore } from './store.js';

export const identityDefinitions = [
  { id: 'user-a1', organizationId: 'org-a', name: 'User A1', env: 'TOKEN_USER_A1' },
  { id: 'user-a2', organizationId: 'org-a', name: 'User A2', env: 'TOKEN_USER_A2' },
  { id: 'user-b1', organizationId: 'org-b', name: 'User B1', env: 'TOKEN_USER_B1' },
  { id: 'user-b2', organizationId: 'org-b', name: 'User B2', env: 'TOKEN_USER_B2' }
];

export function initialize({
  store,
  environment = process.env,
  generateToken = () => randomBytes(32).toString('base64url'),
  output = console.log
}) {
  const generated = [];
  const users = identityDefinitions.map((definition) => {
    const supplied = environment[definition.env];
    const token = supplied && supplied.length > 0 ? supplied : generateToken();
    if (!supplied) generated.push({ ...definition, token });
    return {
      id: definition.id,
      organizationId: definition.organizationId,
      name: definition.name,
      tokenHash: hashToken(token)
    };
  });

  const created = store.initializeIdentities({
    organizations: [
      { id: 'org-a', name: 'Organization A' },
      { id: 'org-b', name: 'Organization B' }
    ],
    users
  });

  if (created) {
    if (generated.length > 0) {
      output('Generated API tokens (shown only this once):');
      for (const user of generated) output(`${user.env}=${user.token}`);
    }
    output('Initialized 2 organizations and 4 users.');
  } else {
    output('Identity data is already initialized; no tokens were changed.');
  }
  return { created, generated };
}

function isMainModule() {
  return process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isMainModule()) {
  const store = openStore(resolve(process.env.DATA_FILE ?? './data/notes.sqlite'));
  try {
    initialize({ store });
  } finally {
    store.close();
  }
}
