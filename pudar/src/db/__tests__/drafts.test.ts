import { configureConnection } from '../connection';
import { deleteDraft, DRAFT_MAX_AGE_MS, getDraft, saveDraft } from '../drafts';
import { migrate } from '../migrations';
import { createProfile, deleteProfile } from '../profiles';
import { createTestDb, type TestDb } from './test-db';

const TODAY = '2026-10-11';
const T0 = 1_760_000_000_000;

describe('drafts repository', () => {
  let db: TestDb;

  beforeEach(async () => {
    db = await createTestDb();
    await configureConnection(db);
    await migrate(db);
    const profile = { name: 'V', icon: null, accentColor: null, noContactStartDate: null };
    await createProfile(db, profile, { id: 'p1', now: T0, today: TODAY });
    await createProfile(db, { ...profile, name: 'M' }, { id: 'p2', now: T0, today: TODAY });
  });

  it('keeps one draft per profile, replacing the previous one', async () => {
    await saveDraft(db, { profileId: 'p1', date: TODAY, entryId: null, content: 'first' }, T0);
    await saveDraft(db, { profileId: 'p1', date: TODAY, entryId: 'e1', content: 'second' }, T0 + 1);
    await saveDraft(db, { profileId: 'p2', date: TODAY, entryId: null, content: 'other' }, T0);

    expect(await getDraft(db, 'p1', T0 + 1)).toEqual({
      profileId: 'p1',
      date: TODAY,
      entryId: 'e1',
      content: 'second',
      updatedAt: T0 + 1,
    });
    expect((await getDraft(db, 'p2', T0))?.content).toBe('other');
  });

  it('deletes the draft when the text is blank or on request', async () => {
    await saveDraft(db, { profileId: 'p1', date: TODAY, entryId: null, content: 'hi' }, T0);
    await saveDraft(db, { profileId: 'p1', date: TODAY, entryId: null, content: '  ' }, T0);
    expect(await getDraft(db, 'p1', T0)).toBeNull();

    await saveDraft(db, { profileId: 'p1', date: TODAY, entryId: null, content: 'hi' }, T0);
    await deleteDraft(db, 'p1');
    expect(await getDraft(db, 'p1', T0)).toBeNull();
  });

  it('drops drafts untouched for 30 days', async () => {
    await saveDraft(db, { profileId: 'p1', date: TODAY, entryId: null, content: 'old' }, T0);
    expect(await getDraft(db, 'p1', T0 + DRAFT_MAX_AGE_MS - 1)).not.toBeNull();
    expect(await getDraft(db, 'p1', T0 + DRAFT_MAX_AGE_MS)).toBeNull();
    expect(await getDraft(db, 'p1', T0)).toBeNull();
  });

  it('goes with its profile', async () => {
    await saveDraft(db, { profileId: 'p1', date: TODAY, entryId: null, content: 'hi' }, T0);
    await deleteProfile(db, 'p1');
    const row = await db.getFirstAsync<{ n: number }>('SELECT count(*) AS n FROM drafts');
    expect(row?.n).toBe(0);
  });
});
