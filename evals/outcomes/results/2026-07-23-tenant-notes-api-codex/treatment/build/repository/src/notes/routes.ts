import type { Principal } from "../types.ts";
import { validateCreateBody, validateListQuery, validateNoteId, validatePatchBody } from "../schemas.ts";
import type { NotesService } from "./service.ts";

export function executeNotesRoute(
  service: NotesService,
  request: {
    method: string;
    pathname: string;
    query: URLSearchParams;
    payload: unknown;
  },
  principal: Principal,
): { statusCode: number; body?: unknown; action: string; target?: string } | undefined {
  if (request.pathname === "/v1/notes") {
    if (request.method === "POST") {
      return {
        statusCode: 201,
        body: service.create(principal, validateCreateBody(request.payload)),
        action: "note.create",
      };
    }
    if (request.method === "GET") {
      const query = validateListQuery(request.query);
      return {
        statusCode: 200,
        body: service.list(principal, query.limit, query.cursor),
        action: "note.list",
      };
    }
    return undefined;
  }
  const match = /^\/v1\/notes\/([^/]+)$/.exec(request.pathname);
  if (!match?.[1]) return undefined;
  const noteId = validateNoteId(decodeURIComponent(match[1]));
  if (request.method === "GET") {
    return { statusCode: 200, body: service.get(principal, noteId), action: "note.read", target: noteId };
  }
  if (request.method === "PATCH") {
    return {
      statusCode: 200,
      body: service.update(principal, noteId, validatePatchBody(request.payload)),
      action: "note.update",
      target: noteId,
    };
  }
  if (request.method === "DELETE") {
    service.delete(principal, noteId);
    return { statusCode: 204, action: "note.delete", target: noteId };
  }
  return undefined;
}
