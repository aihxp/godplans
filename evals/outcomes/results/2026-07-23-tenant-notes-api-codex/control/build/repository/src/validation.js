const TITLE_MAX = 200;
const BODY_MAX = 50_000;

function characterLength(value) {
  return [...value].length;
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function unknownPropertyIssues(value, allowed) {
  return Object.keys(value)
    .filter((key) => !allowed.has(key))
    .sort()
    .map((key) => ({ path: key, message: 'is not allowed' }));
}

function validateTitle(value, required) {
  if (value === undefined) {
    return required ? [{ path: 'title', message: 'is required' }] : [];
  }
  if (typeof value !== 'string') {
    return [{ path: 'title', message: 'must be a string' }];
  }
  const trimmed = value.trim();
  const length = characterLength(trimmed);
  if (length === 0) {
    return [{ path: 'title', message: 'must not be empty' }];
  }
  if (length > TITLE_MAX) {
    return [{ path: 'title', message: `must be at most ${TITLE_MAX} characters` }];
  }
  return [];
}

function validateBody(value, required) {
  if (value === undefined) {
    return required ? [{ path: 'body', message: 'is required' }] : [];
  }
  if (typeof value !== 'string') {
    return [{ path: 'body', message: 'must be a string' }];
  }
  if (characterLength(value) > BODY_MAX) {
    return [{ path: 'body', message: `must be at most ${BODY_MAX} characters` }];
  }
  return [];
}

export function validateCreateNote(value) {
  if (!isObject(value)) {
    return { issues: [{ path: 'body', message: 'must be a JSON object' }] };
  }
  const issues = [
    ...validateTitle(value.title, true),
    ...validateBody(value.body, true),
    ...unknownPropertyIssues(value, new Set(['title', 'body']))
  ];
  if (issues.length > 0) return { issues };
  return { value: { title: value.title.trim(), body: value.body }, issues: [] };
}

export function validateUpdateNote(value) {
  if (!isObject(value)) {
    return { issues: [{ path: 'body', message: 'must be a JSON object' }] };
  }
  const issues = [
    ...validateTitle(value.title, false),
    ...validateBody(value.body, false),
    ...unknownPropertyIssues(value, new Set(['title', 'body']))
  ];
  if (value.title === undefined && value.body === undefined) {
    issues.unshift({ path: 'body', message: 'must contain title or body' });
  }
  if (issues.length > 0) return { issues };
  const result = {};
  if (value.title !== undefined) result.title = value.title.trim();
  if (value.body !== undefined) result.body = value.body;
  return { value: result, issues: [] };
}

export function validateNoteId(noteId) {
  const uuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuid.test(noteId)
    ? []
    : [{ path: 'noteId', message: 'must be a valid UUID' }];
}

export const limits = {
  payloadBytes: 65_536,
  titleCharacters: TITLE_MAX,
  bodyCharacters: BODY_MAX
};
