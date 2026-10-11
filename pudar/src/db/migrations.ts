import type { Db } from './types';

/**
 * Schema migrations, indexed by the version they upgrade *from*.
 * Never edit a migration that has shipped; append a new one instead.
 * The schema is documented in docs/PRD.md §7.
 */
export const MIGRATIONS: readonly string[] = [
  // v0 → v1: initial schema
  `
  CREATE TABLE profiles (
    id                     TEXT PRIMARY KEY NOT NULL,
    name                   TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 30),
    icon                   TEXT,
    accent_color           TEXT,
    no_contact_start_date  TEXT,
    created_at             INTEGER NOT NULL,
    updated_at             INTEGER NOT NULL
  );

  CREATE TABLE day_records (
    profile_id       TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date             TEXT NOT NULL,
    thought_of_them  INTEGER NOT NULL DEFAULT 0 CHECK (thought_of_them IN (0, 1)),
    had_a_cry        INTEGER NOT NULL DEFAULT 0 CHECK (had_a_cry IN (0, 1)),
    chose_myself     INTEGER NOT NULL DEFAULT 0 CHECK (chose_myself IN (0, 1)),
    updated_at       INTEGER NOT NULL,
    PRIMARY KEY (profile_id, date)
  );

  CREATE TABLE journal_entries (
    id                    TEXT PRIMARY KEY NOT NULL,
    profile_id            TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date                  TEXT NOT NULL,
    content               TEXT CHECK (content IS NULL OR length(content) BETWEEN 1 AND 2000),
    created_at            INTEGER NOT NULL,
    updated_at            INTEGER NOT NULL,
    locked                INTEGER NOT NULL DEFAULT 0 CHECK (locked IN (0, 1)),
    retention_expires_at  INTEGER NOT NULL,
    faded_at              INTEGER,
    UNIQUE (profile_id, date)
  );

  CREATE INDEX idx_entries_profile_date ON journal_entries (profile_id, date DESC);
  CREATE INDEX idx_entries_pending_purge ON journal_entries (retention_expires_at)
    WHERE content IS NOT NULL;

  CREATE TABLE settings (
    key    TEXT PRIMARY KEY NOT NULL,
    value  TEXT NOT NULL
  );
  `,

  // v1 → v2: several entries per day (PRD D5, v1.3). SQLite can't drop a UNIQUE constraint,
  // so the table is rebuilt. Nothing references journal_entries, so the drop is safe.
  `
  CREATE TABLE journal_entries_v2 (
    id                    TEXT PRIMARY KEY NOT NULL,
    profile_id            TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date                  TEXT NOT NULL,
    content               TEXT CHECK (content IS NULL OR length(content) BETWEEN 1 AND 2000),
    created_at            INTEGER NOT NULL,
    updated_at            INTEGER NOT NULL,
    locked                INTEGER NOT NULL DEFAULT 0 CHECK (locked IN (0, 1)),
    retention_expires_at  INTEGER NOT NULL,
    faded_at              INTEGER
  );

  INSERT INTO journal_entries_v2
    SELECT id, profile_id, date, content, created_at, updated_at, locked, retention_expires_at, faded_at
    FROM journal_entries;

  DROP TABLE journal_entries;
  ALTER TABLE journal_entries_v2 RENAME TO journal_entries;

  CREATE INDEX idx_entries_profile_date ON journal_entries (profile_id, date DESC, created_at DESC);
  CREATE INDEX idx_entries_pending_purge ON journal_entries (retention_expires_at)
    WHERE content IS NOT NULL;
  `,

  // v2 → v3: one autosaved editor draft per profile (PRD D21). A draft is not an entry.
  `
  CREATE TABLE drafts (
    profile_id  TEXT PRIMARY KEY NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date        TEXT NOT NULL,
    entry_id    TEXT,
    content     TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 2000),
    updated_at  INTEGER NOT NULL
  );
  `,

  // v3 → v4: the six "Lainnya" quick logs (PRD D22), stored like the main three.
  `
  ALTER TABLE day_records ADD COLUMN wanted_to_chat  INTEGER NOT NULL DEFAULT 0 CHECK (wanted_to_chat IN (0, 1));
  ALTER TABLE day_records ADD COLUMN checked_socials INTEGER NOT NULL DEFAULT 0 CHECK (checked_socials IN (0, 1));
  ALTER TABLE day_records ADD COLUMN missed_them     INTEGER NOT NULL DEFAULT 0 CHECK (missed_them IN (0, 1));
  ALTER TABLE day_records ADD COLUMN felt_angry      INTEGER NOT NULL DEFAULT 0 CHECK (felt_angry IN (0, 1));
  ALTER TABLE day_records ADD COLUMN felt_relieved   INTEGER NOT NULL DEFAULT 0 CHECK (felt_relieved IN (0, 1));
  ALTER TABLE day_records ADD COLUMN slept_well      INTEGER NOT NULL DEFAULT 0 CHECK (slept_well IN (0, 1));
  `,

  // v4 → v5: closing and reopening a Pudar (PRD D23). closed_on is the local date it was closed,
  // where the no-contact counter stops.
  `
  ALTER TABLE profiles ADD COLUMN closed_at    INTEGER;
  ALTER TABLE profiles ADD COLUMN closed_on    TEXT;
  ALTER TABLE profiles ADD COLUMN reopen_count INTEGER NOT NULL DEFAULT 0 CHECK (reopen_count >= 0);
  `,
];

export const SCHEMA_VERSION = MIGRATIONS.length;

export async function getSchemaVersion(db: Db): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version ?? 0;
}

/** Applies pending migrations, each in its own transaction. Safe to call on every launch. */
export async function migrate(db: Db): Promise<{ from: number; to: number }> {
  const from = await getSchemaVersion(db);
  if (from > SCHEMA_VERSION) {
    throw new Error(
      `Database schema v${from} is newer than this version of Pudar (v${SCHEMA_VERSION}).`,
    );
  }
  for (let version = from; version < SCHEMA_VERSION; version++) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[version]);
      await db.execAsync(`PRAGMA user_version = ${version + 1}`);
    });
  }
  return { from, to: SCHEMA_VERSION };
}
