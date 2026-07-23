import { ValidationError } from "./errors.ts";
import type { NoteInput, PatchInput } from "./notes/service.ts";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateNoteId(value: string): string {
  if (!UUID_PATTERN.test(value)) {
    throw new ValidationError([{ path: "params.noteId", message: "must be a UUID" }]);
  }
  return value;
}

export function validateCreateBody(value: unknown): NoteInput {
  const issues = validateObject(value, ["title", "body"]);
  if (isRecord(value)) {
    validateTitle(value.title, issues);
    validateBody(value.body, issues, true);
  }
  if (issues.length > 0) throw new ValidationError(issues);
  return value as NoteInput;
}

export function validatePatchBody(value: unknown): PatchInput {
  const issues = validateObject(value, ["title", "body"]);
  if (isRecord(value)) {
    if (!Object.hasOwn(value, "title") && !Object.hasOwn(value, "body")) {
      issues.push({ path: "body", message: "must include title or body" });
    }
    if (Object.hasOwn(value, "title")) validateTitle(value.title, issues);
    if (Object.hasOwn(value, "body")) validateBody(value.body, issues, false);
  }
  if (issues.length > 0) throw new ValidationError(issues);
  return value as PatchInput;
}

export function validateListQuery(
  query: URLSearchParams,
): { limit: number; cursor?: string } {
  const unknown = [...query.keys()].filter((key) => !["limit", "cursor"].includes(key));
  const limitValue = query.get("limit") ?? "20";
  const limit = Number(limitValue);
  const issues = unknown.map((key) => ({
    path: `query.${key}`,
    message: "is not allowed",
  }));
  if (!/^\d+$/.test(limitValue) || limit < 1 || limit > 50) {
    issues.push({ path: "query.limit", message: "must be an integer from 1 to 50" });
  }
  const cursor = query.get("cursor");
  if (cursor !== null && cursor.length === 0) {
    issues.push({ path: "query.cursor", message: "must not be empty" });
  }
  if (issues.length > 0) throw new ValidationError(issues);
  return cursor === null ? { limit } : { limit, cursor };
}

function validateObject(
  value: unknown,
  allowedKeys: string[],
): { path: string; message: string }[] {
  if (!isRecord(value) || Array.isArray(value)) {
    return [{ path: "body", message: "must be a JSON object" }];
  }
  return Object.keys(value)
    .filter((key) => !allowedKeys.includes(key))
    .map((key) => ({ path: `body.${key}`, message: "is not allowed" }));
}

function validateTitle(
  value: unknown,
  issues: { path: string; message: string }[],
): void {
  if (typeof value !== "string" || value.length < 1 || value.length > 200) {
    issues.push({ path: "body.title", message: "must contain 1 to 200 characters" });
  }
}

function validateBody(
  value: unknown,
  issues: { path: string; message: string }[],
  isRequired: boolean,
): void {
  if (
    (isRequired && typeof value !== "string") ||
    (!isRequired && typeof value !== "string") ||
    (typeof value === "string" && value.length > 10_000)
  ) {
    issues.push({ path: "body.body", message: "must be a string up to 10000 characters" });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
