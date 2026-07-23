import { openStore } from "../db/open-store.ts";
import type { Note, Principal } from "../types.ts";
import type { Cursor } from "./cursor.ts";

type NoteRow = {
  public_id: string;
  title: string;
  body: string;
  owner_id: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
};

export type CreateNoteRecord = {
  publicId: string;
  title: string;
  body: string;
  createdAt: string;
};

export type NotePatch = {
  title?: string;
  body?: string;
  updatedAt: string;
};

export class NoteRepository {
  create(principal: Principal, record: CreateNoteRecord): Note {
    const database = openStore(principal.storePath);
    try {
      database.prepare(
        `INSERT INTO notes
          (public_id, title, body, owner_id, organization_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        record.publicId,
        record.title,
        record.body,
        principal.userId,
        principal.organizationId,
        record.createdAt,
        record.createdAt,
      );
      return this.findWithDatabase(database, principal, record.publicId) as Note;
    } finally {
      database.close();
    }
  }

  find(principal: Principal, publicId: string): Note | undefined {
    const database = openStore(principal.storePath, { readOnly: true });
    try {
      return this.findWithDatabase(database, principal, publicId);
    } finally {
      database.close();
    }
  }

  list(
    principal: Principal,
    limit: number,
    cursor?: Cursor,
  ): { notes: Note[]; hasMore: boolean } {
    const database = openStore(principal.storePath, { readOnly: true });
    try {
      const rows = cursor
        ? database.prepare(
          `${SELECT_FIELDS} WHERE organization_id = ?
           AND (created_at < ? OR (created_at = ? AND public_id < ?))
           ORDER BY created_at DESC, public_id DESC LIMIT ?`,
        ).all(
          principal.organizationId,
          cursor.createdAt,
          cursor.createdAt,
          cursor.publicId,
          limit + 1,
        )
        : database.prepare(
          `${SELECT_FIELDS} WHERE organization_id = ?
           ORDER BY created_at DESC, public_id DESC LIMIT ?`,
        ).all(principal.organizationId, limit + 1);
      return {
        notes: (rows as NoteRow[]).slice(0, limit).map(toNote),
        hasMore: rows.length > limit,
      };
    } finally {
      database.close();
    }
  }

  update(principal: Principal, publicId: string, patch: NotePatch): Note | undefined {
    const database = openStore(principal.storePath);
    try {
      const result = database.prepare(
        `UPDATE notes SET
          title = COALESCE(?, title),
          body = COALESCE(?, body),
          updated_at = ?
         WHERE public_id = ? AND organization_id = ?`,
      ).run(
        patch.title ?? null,
        patch.body ?? null,
        patch.updatedAt,
        publicId,
        principal.organizationId,
      );
      if (result.changes === 0) return undefined;
      return this.findWithDatabase(database, principal, publicId);
    } finally {
      database.close();
    }
  }

  delete(principal: Principal, publicId: string): boolean {
    const database = openStore(principal.storePath);
    try {
      const result = database.prepare(
        "DELETE FROM notes WHERE public_id = ? AND organization_id = ?",
      ).run(publicId, principal.organizationId);
      return result.changes === 1;
    } finally {
      database.close();
    }
  }

  private findWithDatabase(
    database: ReturnType<typeof openStore>,
    principal: Principal,
    publicId: string,
  ): Note | undefined {
    const row = database.prepare(
      `${SELECT_FIELDS} WHERE public_id = ? AND organization_id = ?`,
    ).get(publicId, principal.organizationId) as NoteRow | undefined;
    return row ? toNote(row) : undefined;
  }
}

const SELECT_FIELDS = `SELECT public_id, title, body, owner_id,
  organization_id, created_at, updated_at FROM notes`;

function toNote(row: NoteRow): Note {
  return {
    id: row.public_id,
    title: row.title,
    body: row.body,
    ownerId: row.owner_id,
    organizationId: row.organization_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
