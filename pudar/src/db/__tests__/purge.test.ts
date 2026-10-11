import { configureConnection } from '../connection';
import { getDraft, saveDraft } from '../drafts';
import { createEntry, getEntry } from '../entries';
import { migrate } from '../migrations';
import { createProfile } from '../profiles';
import { purgeExpired } from '../purge';
import { RETENTION_MS } from '@/lib/fading';
import { createTestDb, type TestDb } from './test-db';

const DAY = 24 * 60 * 60 * 1000;
const T0 = 1_760_000_000_000;

describe('purgeExpired', () => {
  let db: TestDb;

  beforeEach(async () => {
    db = await createTestDb();
    await configureConnection(db);
    await migrate(db);
    const profile = { name: 'V', icon: null, accentColor: null, noContactStartDate: null };
    await createProfile(db, profile, { id: 'p1', now: T0, today: '2026-09-10' });
  });

  async function rawContent(id: string) {
    const row = await db.getFirstAsync<{ content: string | null; faded_at: number | null }>(
      'SELECT content, faded_at FROM journal_entries WHERE id = ?',
      id,
    );
    return row;
  }

  it('erases text of an entry written 31 days ago and keeps the row', async () => {
    await createEntry(db, 'p1', '2026-09-10', 'Old words', { id: 'old', now: T0 });
    await createEntry(db, 'p1', '2026-10-01', 'New words', { id: 'new', now: T0 + 21 * DAY });
    const launch = T0 + 31 * DAY;

    expect(await purgeExpired(db, launch)).toBe(1);
    expect(await rawContent('old')).toEqual({ content: null, faded_at: launch });
    expect(await rawContent('new')).toEqual({ content: 'New words', faded_at: null });
    expect((await getEntry(db, 'old', launch))?.date).toBe('2026-09-10');
  });

  it('erases at exactly the deadline and is idempotent', async () => {
    await createEntry(db, 'p1', '2026-09-10', 'Words', { id: 'e1', now: T0 });
    expect(await purgeExpired(db, T0 + RETENTION_MS - 1)).toBe(0);
    expect(await purgeExpired(db, T0 + RETENTION_MS)).toBe(1);
    expect(await purgeExpired(db, T0 + RETENTION_MS + DAY)).toBe(0);
    expect((await rawContent('e1'))?.faded_at).toBe(T0 + RETENTION_MS);
  });

  it('keeps the lock flag on a faded entry', async () => {
    await createEntry(db, 'p1', '2026-09-10', 'Words', { id: 'e1', now: T0 });
    await db.runAsync("UPDATE journal_entries SET locked = 1 WHERE id = 'e1'");
    await purgeExpired(db, T0 + RETENTION_MS);
    expect((await getEntry(db, 'e1', T0 + RETENTION_MS))?.locked).toBe(true);
  });

  it('drops drafts untouched for 30 days', async () => {
    await saveDraft(db, { profileId: 'p1', date: '2026-09-10', entryId: null, content: 'draft' }, T0);
    await purgeExpired(db, T0 + RETENTION_MS - 1);
    const kept = await db.getFirstAsync<{ n: number }>('SELECT count(*) AS n FROM drafts');
    expect(kept?.n).toBe(1);
    await purgeExpired(db, T0 + RETENTION_MS);
    expect(await getDraft(db, 'p1', T0)).toBeNull();
  });
});
