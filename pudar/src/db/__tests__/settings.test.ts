import { configureConnection } from '../connection';
import { migrate } from '../migrations';
import { deleteSetting, getSetting, setSetting } from '../settings';
import { createTestDb, type TestDb } from './test-db';

describe('settings', () => {
  let db: TestDb;

  beforeEach(async () => {
    db = await createTestDb();
    await configureConnection(db);
    await migrate(db);
  });

  it('returns null for a missing key', async () => {
    expect(await getSetting(db, 'active_profile_id')).toBeNull();
  });

  it('stores, overwrites and deletes a value', async () => {
    await setSetting(db, 'active_profile_id', 'p1');
    expect(await getSetting(db, 'active_profile_id')).toBe('p1');

    await setSetting(db, 'active_profile_id', 'p2');
    expect(await getSetting(db, 'active_profile_id')).toBe('p2');

    await deleteSetting(db, 'active_profile_id');
    expect(await getSetting(db, 'active_profile_id')).toBeNull();
  });

  it('keeps keys independent', async () => {
    await setSetting(db, 'retention_ack_at', '1760000000000');
    await setSetting(db, 'active_profile_id', 'p1');
    expect(await getSetting(db, 'retention_ack_at')).toBe('1760000000000');
  });
});
