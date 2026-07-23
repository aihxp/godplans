import { AppError } from "../errors.ts";
import type { Clock, IdSource, Note, Principal } from "../types.ts";
import { decodeCursor, encodeCursor } from "./cursor.ts";
import { NoteRepository } from "./repository.ts";

export type NoteInput = { title: string; body: string };
export type PatchInput = { title?: string; body?: string };

export class NotesService {
  readonly repository: NoteRepository;
  readonly clock: Clock;
  readonly ids: IdSource;

  constructor(
    repository: NoteRepository,
    clock: Clock,
    ids: IdSource,
  ) {
    this.repository = repository;
    this.clock = clock;
    this.ids = ids;
  }

  create(principal: Principal, input: NoteInput): Note {
    return this.repository.create(principal, {
      publicId: this.ids.next(),
      title: input.title,
      body: input.body,
      createdAt: this.clock.now().toISOString(),
    });
  }

  get(principal: Principal, noteId: string): Note {
    return this.repository.find(principal, noteId) ?? notFound();
  }

  list(
    principal: Principal,
    limit: number,
    cursorValue?: string,
  ): { items: Note[]; nextCursor?: string } {
    const cursor = cursorValue ? decodeCursor(cursorValue) : undefined;
    const page = this.repository.list(principal, limit, cursor);
    const result: { items: Note[]; nextCursor?: string } = { items: page.notes };
    const last = page.notes.at(-1);
    if (page.hasMore && last) {
      result.nextCursor = encodeCursor({
        createdAt: last.createdAt,
        publicId: last.id,
      });
    }
    return result;
  }

  update(principal: Principal, noteId: string, input: PatchInput): Note {
    const note = this.repository.update(principal, noteId, {
      ...input,
      updatedAt: this.clock.now().toISOString(),
    });
    return note ?? notFound();
  }

  delete(principal: Principal, noteId: string): void {
    if (!this.repository.delete(principal, noteId)) notFound();
  }
}

function notFound(): never {
  throw new AppError(
    404,
    "NOTE_NOT_FOUND",
    "No note was found for this organization and id.",
  );
}
