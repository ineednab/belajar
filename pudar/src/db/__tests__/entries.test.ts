import { configureConnection } from '../connection';
import { EntryValidationError, getEntryForDate, listEntryMarks, saveEntry } from '../entries';
import { migrate } from '../migrations';
import { createProfile } from '../profiles';
import { RETENTION_MS } from '@/lib/fading';
import { createTestDb, type TestDb } from './test-db';

const TODAY = '2026-10-11';
const T0 = 1_760_000_000_000;

describe('journal entries repository', () => {
  let db: TestDb;

  beforeEach(async () => {
    db = await createTestDb();
    await configureConnection(db);
    await migrate(db);
    const profile = { name: 'V', icon: null, accentColor: null, noContactStartDate: null };
    await createProfile(db, profile, { id: 'p1', now: T0, today: TODAY });
  });

  it('creates the entry with a 30-day retention deadline', async () => {
    const entry = await saveEntry(db, 'p1', TODAY, 'Hello', { id: 'e1', now: T0 });
    expect(entry).toMatchObject({ id: 'e1', content: 'Hello', createdAt: T0, retentionExpiresAt: T0 + RETENTION_MS });
    expect(await getEntryForDate(db, 'p1', TODAY, T0)).toEqual(entry);
  });

  it('edits text without moving createdAt or the deadline', async () => {
    await saveEntry(db, 'p1', TODAY, 'First', { id: 'e1', now: T0 });
    await saveEntry(db, 'p1', TODAY, 'Second', { id: 'unused', now: T0 + 5000 });

    const entry = await getEntryForDate(db, 'p1', TODAY, T0 + 5000);
    expect(entry).toMatchObject({
      id: 'e1',
      content: 'Second',
      createdAt: T0,
      updatedAt: T0 + 5000,
      retentionExpiresAt: T0 + RETENTION_MS,
    });
  });

  it('rejects empty and over-long text', async () => {
    await expect(saveEntry(db, 'p1', TODAY, '   ', { id: 'e1', now: T0 })).rejects.toBeInstanceOf(
      EntryValidationError,
    );
    await expect(
      saveEntry(db, 'p1', TODAY, 'x'.repeat(2001), { id: 'e1', now: T0 }),
    ).rejects.toBeInstanceOf(EntryValidationError);
    expect(await getEntryForDate(db, 'p1', TODAY, T0)).toBeNull();
  });

  it('never returns text once the deadline has passed, even before the purge', async () => {
    await saveEntry(db, 'p1', TODAY, 'Secret', { id: 'e1', now: T0 });
    const expiry = T0 + RETENTION_MS;

    expect((await getEntryForDate(db, 'p1', TODAY, expiry - 1))?.content).toBe('Secret');
    expect((await getEntryForDate(db, 'p1', TODAY, expiry))?.content).toBeNull();
    await expect(saveEntry(db, 'p1', TODAY, 'More', { id: 'x', now: expiry })).rejects.toBeInstanceOf(
      EntryValidationError,
    );
  });

  it('marks days with entries and whether they faded', async () => {
    await saveEntry(db, 'p1', '2026-10-01', 'Old', { id: 'e1', now: T0 });
    await saveEntry(db, 'p1', TODAY, 'New', { id: 'e2', now: T0 + RETENTION_MS });

    const marks = await listEntryMarks(db, 'p1', '2026-09-28', TODAY, T0 + RETENTION_MS);
    expect(marks.get('2026-10-01')).toEqual({ faded: true });
    expect(marks.get(TODAY)).toEqual({ faded: false });
    expect(marks.has('2026-10-02')).toBe(false);
  });
});
