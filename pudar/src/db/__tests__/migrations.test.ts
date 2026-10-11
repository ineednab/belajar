import { configureConnection } from '../connection';
import { MIGRATIONS, SCHEMA_VERSION, getSchemaVersion, migrate } from '../migrations';
import { createTestDb, type TestDb } from './test-db';

const NOW = 1_760_000_000_000;

async function freshDb(): Promise<TestDb> {
  const db = await createTestDb();
  await configureConnection(db);
  await migrate(db);
  return db;
}

async function insertProfile(db: TestDb, id = 'p1', name = 'V') {
  await db.runAsync(
    'INSERT INTO profiles (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
    id,
    name,
    NOW,
    NOW,
  );
}

async function insertEntry(db: TestDb, id: string, date: string, content: string | null = 'hi') {
  await db.runAsync(
    `INSERT INTO journal_entries (id, profile_id, date, content, created_at, updated_at, retention_expires_at)
     VALUES (?, 'p1', ?, ?, ?, ?, ?)`,
    id,
    date,
    content,
    NOW,
    NOW,
    NOW + 1,
  );
}

async function count(db: TestDb, table: string): Promise<number> {
  const row = await db.getFirstAsync<{ n: number }>(`SELECT count(*) AS n FROM ${table}`);
  return row?.n ?? -1;
}

describe('migrate', () => {
  it('creates the current schema on an empty database', async () => {
    const db = await createTestDb();
    expect(await migrate(db)).toEqual({ from: 0, to: SCHEMA_VERSION });
    expect(await getSchemaVersion(db)).toBe(SCHEMA_VERSION);

    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    );
    expect(tables.map((t) => t.name)).toEqual([
      'day_records',
      'journal_entries',
      'profiles',
      'settings',
    ]);
  });

  it('keeps v1 entries when upgrading to v2', async () => {
    const db = await createTestDb();
    await configureConnection(db);
    await db.execAsync(MIGRATIONS[0]);
    await db.execAsync('PRAGMA user_version = 1');
    await insertProfile(db);
    await db.runAsync(
      `INSERT INTO journal_entries (id, profile_id, date, content, created_at, updated_at, locked, retention_expires_at)
       VALUES ('e1', 'p1', '2026-10-11', 'kept', ?, ?, 1, ?)`,
      NOW,
      NOW,
      NOW + 1,
    );

    expect(await migrate(db)).toEqual({ from: 1, to: SCHEMA_VERSION });
    const row = await db.getFirstAsync<{ content: string; locked: number }>(
      "SELECT content, locked FROM journal_entries WHERE id = 'e1'",
    );
    expect(row).toEqual({ content: 'kept', locked: 1 });
    await insertEntry(db, 'e2', '2026-10-11');
    await db.runAsync("DELETE FROM profiles WHERE id = 'p1'");
    expect(await count(db, 'journal_entries')).toBe(0);
  });

  it('is a no-op on an up-to-date database', async () => {
    const db = await freshDb();
    await insertProfile(db);
    expect(await migrate(db)).toEqual({ from: SCHEMA_VERSION, to: SCHEMA_VERSION });
    expect(await count(db, 'profiles')).toBe(1);
  });

  it('refuses a database from a newer app version', async () => {
    const db = await createTestDb();
    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION + 1}`);
    await expect(migrate(db)).rejects.toThrow(/newer than this version/);
  });

  it('rolls back a failed migration, leaving the version unchanged', async () => {
    const db = await createTestDb();
    const original = [...MIGRATIONS];
    (MIGRATIONS as string[]).push('CREATE TABLE half_done (id TEXT); SELECT * FROM missing_table;');
    try {
      await migrate(db).catch(() => undefined);
      expect(await getSchemaVersion(db)).toBe(SCHEMA_VERSION);
      const halfDone = await db.getFirstAsync(
        "SELECT name FROM sqlite_master WHERE name = 'half_done'",
      );
      expect(halfDone).toBeNull();
    } finally {
      (MIGRATIONS as string[]).splice(0, MIGRATIONS.length, ...original);
    }
  });
});

describe('schema constraints', () => {
  let db: TestDb;

  beforeEach(async () => {
    db = await freshDb();
    await insertProfile(db);
  });

  it('deleting a profile cascades to its day records and entries', async () => {
    await db.runAsync(
      "INSERT INTO day_records (profile_id, date, thought_of_them, updated_at) VALUES ('p1', '2026-10-11', 1, ?)",
      NOW,
    );
    await insertEntry(db, 'e1', '2026-10-11');

    await db.runAsync("DELETE FROM profiles WHERE id = 'p1'");

    expect(await count(db, 'day_records')).toBe(0);
    expect(await count(db, 'journal_entries')).toBe(0);
  });

  it('rejects entries for a profile that does not exist', async () => {
    await expect(
      db.runAsync(
        `INSERT INTO journal_entries (id, profile_id, date, content, created_at, updated_at, retention_expires_at)
         VALUES ('e1', 'nobody', '2026-10-11', 'hi', 0, 0, 1)`,
      ),
    ).rejects.toThrow(/FOREIGN KEY/);
  });

  it('allows several journal entries per profile per date (v2)', async () => {
    await insertEntry(db, 'e1', '2026-10-11');
    await insertEntry(db, 'e2', '2026-10-11');
    expect(await count(db, 'journal_entries')).toBe(2);
  });

  it('allows one day record per profile per date', async () => {
    const insert = () =>
      db.runAsync(
        "INSERT INTO day_records (profile_id, date, updated_at) VALUES ('p1', '2026-10-11', ?)",
        NOW,
      );
    await insert();
    await expect(insert()).rejects.toThrow(/UNIQUE|PRIMARY KEY/);
  });

  it('accepts null content (faded) and up to 2,000 characters', async () => {
    await insertEntry(db, 'e1', '2026-10-01', null);
    await insertEntry(db, 'e2', '2026-10-02', 'a'.repeat(2000));
  });

  it.each([
    ['empty content', ''],
    ['content over 2,000 characters', 'a'.repeat(2001)],
  ])('rejects %s', async (_, content) => {
    await expect(insertEntry(db, 'e1', '2026-10-11', content)).rejects.toThrow(/CHECK/);
  });

  it.each([
    ['an empty name', ''],
    ['a name over 30 characters', 'x'.repeat(31)],
  ])('rejects a profile with %s', async (_, name) => {
    await expect(insertProfile(db, 'p2', name)).rejects.toThrow(/CHECK/);
  });

  it('rejects non-boolean flags', async () => {
    await expect(
      db.runAsync(
        "INSERT INTO day_records (profile_id, date, had_a_cry, updated_at) VALUES ('p1', '2026-10-11', 2, ?)",
        NOW,
      ),
    ).rejects.toThrow(/CHECK/);
  });

  it('defaults new entries to unlocked and not faded', async () => {
    await insertEntry(db, 'e1', '2026-10-11');
    const row = await db.getFirstAsync<{ locked: number; faded_at: number | null }>(
      "SELECT locked, faded_at FROM journal_entries WHERE id = 'e1'",
    );
    expect(row).toEqual({ locked: 0, faded_at: null });
  });
});
