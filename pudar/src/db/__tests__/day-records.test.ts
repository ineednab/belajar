import { configureConnection } from '../connection';
import { getQuickLogs, listQuickLogs, NO_QUICK_LOGS, saveQuickLogs } from '../day-records';
import { migrate } from '../migrations';
import { createProfile } from '../profiles';
import { createTestDb, type TestDb } from './test-db';

const TODAY = '2026-10-11';
const T0 = 1_760_000_000_000;

async function rows(db: TestDb): Promise<number> {
  const row = await db.getFirstAsync<{ n: number }>('SELECT count(*) AS n FROM day_records');
  return row?.n ?? -1;
}

describe('day records repository', () => {
  let db: TestDb;

  beforeEach(async () => {
    db = await createTestDb();
    await configureConnection(db);
    await migrate(db);
    const profile = { name: 'V', icon: null, accentColor: null, noContactStartDate: null };
    await createProfile(db, profile, { id: 'p1', now: T0, today: TODAY });
    await createProfile(db, profile, { id: 'p2', now: T0, today: TODAY });
  });

  it('reads all off when the day has no record', async () => {
    expect(await getQuickLogs(db, 'p1', TODAY)).toEqual(NO_QUICK_LOGS);
  });

  it('saves and updates the day in place', async () => {
    await saveQuickLogs(db, 'p1', TODAY, { ...NO_QUICK_LOGS, choseMyself: true }, T0);
    await saveQuickLogs(db, 'p1', TODAY, { ...NO_QUICK_LOGS, thoughtOfThem: true, choseMyself: true }, T0 + 1);

    expect(await getQuickLogs(db, 'p1', TODAY)).toEqual({
      ...NO_QUICK_LOGS,
      thoughtOfThem: true,
      choseMyself: true,
    });
    expect(await rows(db)).toBe(1);
  });

  it('stores the Lainnya logs like the main three', async () => {
    await saveQuickLogs(db, 'p1', TODAY, { ...NO_QUICK_LOGS, wantedToChat: true, sleptWell: true }, T0);
    expect(await getQuickLogs(db, 'p1', TODAY)).toEqual({ ...NO_QUICK_LOGS, wantedToChat: true, sleptWell: true });

    await saveQuickLogs(db, 'p1', TODAY, { ...NO_QUICK_LOGS, sleptWell: true }, T0 + 1);
    expect((await getQuickLogs(db, 'p1', TODAY)).wantedToChat).toBe(false);
    expect(await rows(db)).toBe(1);
  });

  it('deletes the row when every log is turned off', async () => {
    await saveQuickLogs(db, 'p1', TODAY, { ...NO_QUICK_LOGS, hadACry: true }, T0);
    await saveQuickLogs(db, 'p1', TODAY, NO_QUICK_LOGS, T0 + 1);
    expect(await rows(db)).toBe(0);
  });

  it('keeps profiles and days independent', async () => {
    await saveQuickLogs(db, 'p1', TODAY, { ...NO_QUICK_LOGS, hadACry: true }, T0);
    await saveQuickLogs(db, 'p1', '2026-10-09', { ...NO_QUICK_LOGS, thoughtOfThem: true }, T0);
    await saveQuickLogs(db, 'p2', TODAY, { ...NO_QUICK_LOGS, choseMyself: true }, T0);

    const week = await listQuickLogs(db, 'p1', '2026-10-05', TODAY);
    expect([...week.keys()].sort()).toEqual(['2026-10-09', TODAY]);
    expect(week.get(TODAY)?.choseMyself).toBe(false);
  });
});
