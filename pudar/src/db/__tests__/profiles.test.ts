import { configureConnection } from '../connection';
import { migrate } from '../migrations';
import {
  ProfileValidationError,
  createProfile,
  deleteProfile,
  getProfile,
  listProfiles,
  loadProfilesSnapshot,
  persistActiveProfileId,
  startAgainToday,
  updateProfile,
} from '../profiles';
import { getSetting } from '../settings';
import { createTestDb, type TestDb } from './test-db';

const TODAY = '2026-10-11';
const T0 = 1_760_000_000_000;
const input = { name: 'V', icon: 'moon', accentColor: '#D97C8B', noContactStartDate: '2026-10-02' };

async function count(db: TestDb, table: string): Promise<number> {
  const row = await db.getFirstAsync<{ n: number }>(`SELECT count(*) AS n FROM ${table}`);
  return row?.n ?? -1;
}

describe('profiles repository', () => {
  let db: TestDb;

  beforeEach(async () => {
    db = await createTestDb();
    await configureConnection(db);
    await migrate(db);
  });

  it('creates and reads back a profile', async () => {
    const created = await createProfile(db, { ...input, name: '  V  ' }, { id: 'p1', now: T0, today: TODAY });

    expect(created).toEqual({
      id: 'p1',
      name: 'V',
      icon: 'moon',
      accentColor: '#D97C8B',
      noContactStartDate: '2026-10-02',
      createdAt: T0,
      updatedAt: T0,
    });
    expect(await getProfile(db, 'p1')).toEqual(created);
  });

  it('lists profiles oldest first', async () => {
    await createProfile(db, { ...input, name: 'B' }, { id: 'b', now: T0 + 1, today: TODAY });
    await createProfile(db, { ...input, name: 'A' }, { id: 'a', now: T0, today: TODAY });
    expect((await listProfiles(db)).map((p) => p.name)).toEqual(['A', 'B']);
  });

  it('rejects invalid input without writing anything', async () => {
    await expect(
      createProfile(db, { ...input, name: ' ' }, { id: 'p1', now: T0, today: TODAY }),
    ).rejects.toBeInstanceOf(ProfileValidationError);
    await expect(
      createProfile(db, { ...input, noContactStartDate: '2026-10-12' }, { id: 'p1', now: T0, today: TODAY }),
    ).rejects.toThrow(/future/);
    expect(await count(db, 'profiles')).toBe(0);
  });

  it('accepts a 30-emoji name, which the CHECK constraint also allows', async () => {
    await createProfile(db, { ...input, name: '🌙'.repeat(30) }, { id: 'p1', now: T0, today: TODAY });
    expect((await getProfile(db, 'p1'))?.name).toBe('🌙'.repeat(30));
  });

  it('updates every editable field and updatedAt, keeping createdAt', async () => {
    await createProfile(db, input, { id: 'p1', now: T0, today: TODAY });
    await updateProfile(
      db,
      'p1',
      { name: 'A', icon: null, accentColor: null, noContactStartDate: null },
      { now: T0 + 5, today: TODAY },
    );

    expect(await getProfile(db, 'p1')).toEqual({
      id: 'p1',
      name: 'A',
      icon: null,
      accentColor: null,
      noContactStartDate: null,
      createdAt: T0,
      updatedAt: T0 + 5,
    });
  });

  it('fails to update a profile that does not exist', async () => {
    await expect(updateProfile(db, 'nope', input, { now: T0, today: TODAY })).rejects.toThrow(
      /not found/,
    );
  });

  it('start again sets the start date to today', async () => {
    await createProfile(db, input, { id: 'p1', now: T0, today: TODAY });
    await startAgainToday(db, 'p1', { now: T0 + 9, today: TODAY });

    const profile = await getProfile(db, 'p1');
    expect(profile?.noContactStartDate).toBe(TODAY);
    expect(profile?.updatedAt).toBe(T0 + 9);
  });

  it('deleting a profile removes its day records and entries, and only its own', async () => {
    await createProfile(db, input, { id: 'p1', now: T0, today: TODAY });
    await createProfile(db, { ...input, name: 'A' }, { id: 'p2', now: T0, today: TODAY });
    for (const profileId of ['p1', 'p2']) {
      await db.runAsync(
        "INSERT INTO day_records (profile_id, date, chose_myself, updated_at) VALUES (?, '2026-10-11', 1, ?)",
        profileId,
        T0,
      );
      await db.runAsync(
        `INSERT INTO journal_entries (id, profile_id, date, content, created_at, updated_at, retention_expires_at)
         VALUES (?, ?, '2026-10-11', 'words', ?, ?, ?)`,
        `e-${profileId}`,
        profileId,
        T0,
        T0,
        T0 + 1,
      );
    }

    await deleteProfile(db, 'p1');

    expect((await listProfiles(db)).map((p) => p.id)).toEqual(['p2']);
    expect(await count(db, 'day_records')).toBe(1);
    expect(await count(db, 'journal_entries')).toBe(1);
    const remaining = await db.getFirstAsync<{ profile_id: string }>(
      'SELECT profile_id FROM journal_entries',
    );
    expect(remaining?.profile_id).toBe('p2');
  });
});

describe('active profile', () => {
  let db: TestDb;

  beforeEach(async () => {
    db = await createTestDb();
    await configureConnection(db);
    await migrate(db);
  });

  it('is null with no profiles', async () => {
    expect(await loadProfilesSnapshot(db)).toEqual({ profiles: [], activeProfileId: null });
  });

  it('persists the chosen profile across loads (survives restart)', async () => {
    await createProfile(db, input, { id: 'p1', now: T0, today: TODAY });
    await createProfile(db, { ...input, name: 'A' }, { id: 'p2', now: T0 + 1, today: TODAY });
    await persistActiveProfileId(db, 'p2');

    expect((await loadProfilesSnapshot(db)).activeProfileId).toBe('p2');
  });

  it('falls back to the oldest profile and repairs the setting when the active one is deleted', async () => {
    await createProfile(db, input, { id: 'p1', now: T0, today: TODAY });
    await createProfile(db, { ...input, name: 'A' }, { id: 'p2', now: T0 + 1, today: TODAY });
    await persistActiveProfileId(db, 'p2');
    await deleteProfile(db, 'p2');

    expect((await loadProfilesSnapshot(db)).activeProfileId).toBe('p1');
    expect(await getSetting(db, 'active_profile_id')).toBe('p1');
  });

  it('clears the setting when the last profile is deleted', async () => {
    await createProfile(db, input, { id: 'p1', now: T0, today: TODAY });
    await persistActiveProfileId(db, 'p1');
    await deleteProfile(db, 'p1');

    expect(await loadProfilesSnapshot(db)).toEqual({ profiles: [], activeProfileId: null });
    expect(await getSetting(db, 'active_profile_id')).toBeNull();
  });
});
