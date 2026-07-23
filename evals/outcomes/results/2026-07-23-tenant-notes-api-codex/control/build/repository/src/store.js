import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

function mapNote(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    ownerId: row.owner_id,
    organizationId: row.organization_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function migrate(database) {
  const version = database.prepare('PRAGMA user_version').get().user_version;
  if (version > 1) {
    throw new Error(`Database schema version ${version} is newer than this application supports`);
  }
  if (version === 1) return;

  database.exec('BEGIN IMMEDIATE');
  try {
    database.exec(`
      CREATE TABLE organizations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
      ) STRICT;

      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL REFERENCES organizations(id),
        name TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        UNIQUE (id, organization_id)
      ) STRICT;

      CREATE TABLE notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        owner_id TEXT NOT NULL,
        organization_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (owner_id, organization_id)
          REFERENCES users(id, organization_id)
      ) STRICT;

      CREATE INDEX notes_organization_order
        ON notes (organization_id, created_at DESC, id ASC);

      PRAGMA user_version = 1;
    `);
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

export function openStore(dataFile) {
  mkdirSync(dirname(dataFile), { recursive: true });
  const database = new DatabaseSync(dataFile);

  try {
    database.exec(`
      PRAGMA foreign_keys = ON;
      PRAGMA journal_mode = WAL;
      PRAGMA busy_timeout = 2000;
      PRAGMA synchronous = FULL;
    `);
    migrate(database);
  } catch (error) {
    database.close();
    throw error;
  }

  const statements = {
    identityCounts: database.prepare(`
      SELECT
        (SELECT COUNT(*) FROM organizations) AS organizations,
        (SELECT COUNT(*) FROM users) AS users
    `),
    insertOrganization: database.prepare(
      'INSERT INTO organizations (id, name) VALUES (?, ?)'
    ),
    insertUser: database.prepare(`
      INSERT INTO users (id, organization_id, name, token_hash)
      VALUES (?, ?, ?, ?)
    `),
    userByTokenHash: database.prepare(`
      SELECT id, organization_id AS organizationId, name
      FROM users
      WHERE token_hash = ?
    `),
    createNote: database.prepare(`
      INSERT INTO notes
        (id, title, body, owner_id, organization_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `),
    listNotes: database.prepare(`
      SELECT *
      FROM notes
      WHERE organization_id = ?
      ORDER BY created_at DESC, id ASC
    `),
    getNote: database.prepare(`
      SELECT *
      FROM notes
      WHERE id = ? AND organization_id = ?
    `),
    updateTitle: database.prepare(`
      UPDATE notes
      SET title = ?, updated_at = ?
      WHERE id = ? AND organization_id = ?
    `),
    updateBody: database.prepare(`
      UPDATE notes
      SET body = ?, updated_at = ?
      WHERE id = ? AND organization_id = ?
    `),
    updateTitleAndBody: database.prepare(`
      UPDATE notes
      SET title = ?, body = ?, updated_at = ?
      WHERE id = ? AND organization_id = ?
    `),
    deleteNote: database.prepare(`
      DELETE FROM notes
      WHERE id = ? AND organization_id = ?
    `)
  };

  let closed = false;

  return {
    initializeIdentities({ organizations, users }) {
      const counts = statements.identityCounts.get();
      if (counts.organizations !== 0 || counts.users !== 0) {
        if (counts.organizations !== 2 || counts.users !== 4) {
          throw new Error(
            `Identity database must contain exactly 2 organizations and 4 users; found ${counts.organizations} and ${counts.users}`
          );
        }
        return false;
      }

      database.exec('BEGIN IMMEDIATE');
      try {
        for (const organization of organizations) {
          statements.insertOrganization.run(organization.id, organization.name);
        }
        for (const user of users) {
          statements.insertUser.run(
            user.id,
            user.organizationId,
            user.name,
            user.tokenHash
          );
        }
        database.exec('COMMIT');
        return true;
      } catch (error) {
        database.exec('ROLLBACK');
        throw error;
      }
    },

    findUserByTokenHash(tokenHash) {
      return statements.userByTokenHash.get(tokenHash) ?? null;
    },

    createNote({ id, title, body, ownerId, organizationId, now }) {
      statements.createNote.run(
        id,
        title,
        body,
        ownerId,
        organizationId,
        now,
        now
      );
      return mapNote(statements.getNote.get(id, organizationId));
    },

    listNotesForOrganization(organizationId) {
      return statements.listNotes.all(organizationId).map(mapNote);
    },

    getNoteForOrganization(noteId, organizationId) {
      return mapNote(statements.getNote.get(noteId, organizationId));
    },

    updateNoteForOrganization(noteId, organizationId, changes, now) {
      let result;
      if (changes.title !== undefined && changes.body !== undefined) {
        result = statements.updateTitleAndBody.run(
          changes.title,
          changes.body,
          now,
          noteId,
          organizationId
        );
      } else if (changes.title !== undefined) {
        result = statements.updateTitle.run(
          changes.title,
          now,
          noteId,
          organizationId
        );
      } else {
        result = statements.updateBody.run(
          changes.body,
          now,
          noteId,
          organizationId
        );
      }
      if (result.changes === 0) return null;
      return mapNote(statements.getNote.get(noteId, organizationId));
    },

    deleteNoteForOrganization(noteId, organizationId) {
      return statements.deleteNote.run(noteId, organizationId).changes > 0;
    },

    close() {
      if (!closed) {
        database.close();
        closed = true;
      }
    }
  };
}
