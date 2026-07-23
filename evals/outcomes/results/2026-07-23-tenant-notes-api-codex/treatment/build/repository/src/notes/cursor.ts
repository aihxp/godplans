import { ValidationError } from "../errors.ts";

export type Cursor = {
  createdAt: string;
  publicId: string;
};

export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function decodeCursor(value: string): Cursor {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, "base64url").toString());
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as Record<string, unknown>).createdAt === "string" &&
      typeof (parsed as Record<string, unknown>).publicId === "string"
    ) {
      return parsed as Cursor;
    }
  } catch {
    // Invalid cursors share the request-validation response.
  }
  throw new ValidationError([{ path: "query.cursor", message: "must be an opaque cursor" }]);
}
