PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS organizations (
  public_id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS users (
  public_id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  UNIQUE (public_id, organization_id),
  FOREIGN KEY (organization_id) REFERENCES organizations(public_id) ON DELETE RESTRICT
) STRICT;

CREATE TABLE IF NOT EXISTS access_tokens (
  token_hash BLOB PRIMARY KEY NOT NULL CHECK (length(token_hash) = 32),
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(public_id) ON DELETE CASCADE
) STRICT;

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY,
  public_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  body TEXT NOT NULL CHECK (length(body) <= 10000),
  owner_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL CHECK (updated_at >= created_at),
  FOREIGN KEY (organization_id) REFERENCES organizations(public_id) ON DELETE RESTRICT,
  FOREIGN KEY (owner_id, organization_id)
    REFERENCES users(public_id, organization_id) ON DELETE RESTRICT
) STRICT;

CREATE INDEX IF NOT EXISTS access_tokens_user_id_idx
  ON access_tokens(user_id);
CREATE INDEX IF NOT EXISTS notes_owner_organization_idx
  ON notes(owner_id, organization_id);
CREATE INDEX IF NOT EXISTS notes_organization_list_idx
  ON notes(organization_id, created_at DESC, public_id DESC);
