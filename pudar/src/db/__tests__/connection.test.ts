import {
  applyKey,
  configureConnection,
  isNotADatabaseError,
  readDiagnostics,
} from '../connection';
import { migrate, SCHEMA_VERSION } from '../migrations';
import { createTestDb } from './test-db';

const KEY = 'a'.repeat(64);

describe('applyKey', () => {
  it('accepts a 64-character lowercase hex key', async () => {
    const db = await createTestDb();
    await expect(applyKey(db, KEY)).resolves.toBeUndefined();
  });

  it.each([
    ['too short', 'ab'],
    ['uppercase', 'A'.repeat(64)],
    ['an injection attempt', `${'a'.repeat(60)}'"; DROP TABLE x; --`],
  ])('rejects a key that is %s, before touching the database', async (_, key) => {
    const db = await createTestDb();
    const exec = jest.spyOn(db, 'execAsync');
    await expect(applyKey(db, key)).rejects.toThrow(/64 lowercase hex/);
    expect(exec).not.toHaveBeenCalled();
  });
});

describe('isNotADatabaseError', () => {
  it('recognises SQLITE_NOTADB messages', () => {
    expect(isNotADatabaseError(new Error('Error code 26: file is not a database'))).toBe(true);
    expect(isNotADatabaseError(new Error('SQLITE_NOTADB'))).toBe(true);
  });

  it('ignores other errors', () => {
    expect(isNotADatabaseError(new Error('database is locked'))).toBe(false);
    expect(isNotADatabaseError('file is not a database')).toBe(false);
  });
});

describe('configureConnection', () => {
  it('enables foreign keys and secure delete', async () => {
    const db = await createTestDb();
    await configureConnection(db);
    await migrate(db);

    const diagnostics = await readDiagnostics(db);
    expect(diagnostics).toMatchObject({
      cipherVersion: null, // sql.js has no SQLCipher
      foreignKeys: true,
      secureDelete: true,
      schemaVersion: SCHEMA_VERSION,
    });
  });
});
