import { configureConnection } from '../connection';
import {
  createEntry,
  EntryValidationError,
  getEntry,
  listEntriesForDate,
  listEntryMarks,
  updateEntry,
} from '../entries';
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

  it('creates an entry with a 30-day retention deadline', async () => {
    const entry = await createEntry(db, 'p1', TODAY, 'Hello', { id: 'e1', now: T0 });
    expect(entry).toMatchObject({ id: 'e1', content: 'Hello', createdAt: T0, retentionExpiresAt: T0 + RETENTION_MS });
    expect(await getEntry(db, 'e1', T0)).toEqual(entry);
  });

  it('keeps several entries on one day, newest first, each with its own deadline', async () => {
    await createEntry(db, 'p1', TODAY, 'Morning', { id: 'e1', now: T0 });
    await createEntry(db, 'p1', TODAY, 'Night', { id: 'e2', now: T0 + 60_000 });
    await createEntry(db, 'p1', '2026-10-10', 'Yesterday', { id: 'e3', now: T0 });

    const entries = await listEntriesForDate(db, 'p1', TODAY, T0 + 60_000);
    expect(entries.map((e) => [e.id, e.content, e.retentionExpiresAt])).toEqual([
      ['e2', 'Night', T0 + 60_000 + RETENTION_MS],
      ['e1', 'Morning', T0 + RETENTION_MS],
    ]);
  });

  it('edits text without moving createdAt or the deadline', async () => {
    await createEntry(db, 'p1', TODAY, 'First', { id: 'e1', now: T0 });
    await updateEntry(db, 'e1', 'Second', T0 + 5000);

    expect(await getEntry(db, 'e1', T0 + 5000)).toMatchObject({
      content: 'Second',
      createdAt: T0,
      updatedAt: T0 + 5000,
      retentionExpiresAt: T0 + RETENTION_MS,
    });
  });

  it('rejects empty and over-long text', async () => {
    await expect(createEntry(db, 'p1', TODAY, '   ', { id: 'e1', now: T0 })).rejects.toBeInstanceOf(
      EntryValidationError,
    );
    await expect(
      createEntry(db, 'p1', TODAY, 'x'.repeat(2001), { id: 'e1', now: T0 }),
    ).rejects.toBeInstanceOf(EntryValidationError);
    expect(await listEntriesForDate(db, 'p1', TODAY, T0)).toEqual([]);

    await createEntry(db, 'p1', TODAY, 'Ok', { id: 'e1', now: T0 });
    await expect(updateEntry(db, 'e1', '', T0)).rejects.toBeInstanceOf(EntryValidationError);
  });

  it('never returns text once the deadline has passed, even before the purge', async () => {
    await createEntry(db, 'p1', TODAY, 'Secret', { id: 'e1', now: T0 });
    const expiry = T0 + RETENTION_MS;

    expect((await getEntry(db, 'e1', expiry - 1))?.content).toBe('Secret');
    expect((await getEntry(db, 'e1', expiry))?.content).toBeNull();
    expect((await listEntriesForDate(db, 'p1', TODAY, expiry))[0].content).toBeNull();
    await expect(updateEntry(db, 'e1', 'More', expiry)).rejects.toBeInstanceOf(EntryValidationError);
  });

  it('marks a day faded only when every entry on it has faded', async () => {
    await createEntry(db, 'p1', '2026-10-01', 'Old', { id: 'e1', now: T0 });
    await createEntry(db, 'p1', '2026-10-05', 'Old too', { id: 'e2', now: T0 });
    await createEntry(db, 'p1', '2026-10-05', 'Newer', { id: 'e3', now: T0 + RETENTION_MS });

    const marks = await listEntryMarks(db, 'p1', '2026-09-28', TODAY, T0 + RETENTION_MS);
    expect(marks.get('2026-10-01')).toEqual({ faded: true });
    expect(marks.get('2026-10-05')).toEqual({ faded: false });
    expect(marks.has('2026-10-02')).toBe(false);
  });
});
