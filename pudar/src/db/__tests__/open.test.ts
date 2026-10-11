import { getSchemaVersion, SCHEMA_VERSION } from '../migrations';
import { openEncryptedDatabase, type DatabaseOpenDeps } from '../open';
import type { Db } from '../types';
import { createTestDb, type TestDb } from './test-db';

const EXISTING_KEY = '1'.repeat(64);
const NEW_KEY = '2'.repeat(64);
const NOT_A_DATABASE = new Error('Error code 26: file is not a database');

/**
 * Simulates SQLCipher on top of sql.js: the "file" only opens with the key it was created with.
 * `fileKey: null` means no file exists yet; `fileKey: 'plain'` means an unencrypted file.
 */
function fakeEnvironment(options: {
  storedKey: string | null;
  fileKey: string | null;
  cipher?: boolean;
  readKeyError?: Error;
}) {
  let fileKey = options.fileKey;
  let storedKey = options.storedKey;
  const opened: TestDb[] = [];
  const events: string[] = [];

  const openDatabase = async (): Promise<Db> => {
    const db = await createTestDb();
    opened.push(db);
    let appliedKey: string | null = null;
    const execAsync = db.execAsync.bind(db);
    const getFirstAsync = db.getFirstAsync.bind(db);

    db.execAsync = async (source) => {
      const match = /^PRAGMA key = "x'([0-9a-f]+)'"$/.exec(source);
      if (match) {
        appliedKey = match[1];
        return;
      }
      return execAsync(source);
    };
    db.getFirstAsync = (async (source: string, ...params: never[]) => {
      if (source.startsWith('SELECT count(*) AS n FROM sqlite_master')) {
        if (fileKey === null) {
          fileKey = appliedKey; // first write creates the file with this key
        } else if (fileKey !== appliedKey) {
          throw NOT_A_DATABASE;
        }
      }
      if (source === 'PRAGMA cipher_version') {
        return options.cipher === false ? null : { cipher_version: '4.6.1 community' };
      }
      return getFirstAsync(source, ...params);
    }) as Db['getFirstAsync'];
    return db;
  };

  const deps: DatabaseOpenDeps = {
    readKey: async () => {
      if (options.readKeyError) throw options.readKeyError;
      return storedKey;
    },
    generateKey: async () => NEW_KEY,
    storeKey: async (key) => {
      events.push('storeKey');
      storedKey = key;
    },
    openDatabase: async () => {
      events.push('open');
      return openDatabase();
    },
    deleteDatabase: async () => {
      events.push('delete');
      fileKey = null;
    },
    requireEncryption: true,
    warn: jest.fn(),
  };

  return { deps, opened, events, getStoredKey: () => storedKey };
}

describe('openEncryptedDatabase', () => {
  it('first launch: creates and stores a key before creating the file, then migrates', async () => {
    const env = fakeEnvironment({ storedKey: null, fileKey: null });
    const result = await openEncryptedDatabase(env.deps);

    expect(env.events).toEqual(['storeKey', 'open']);
    expect(env.getStoredKey()).toBe(NEW_KEY);
    expect(result).toMatchObject({ encrypted: true, resetUnreadable: false });
    expect(await getSchemaVersion(result.db)).toBe(SCHEMA_VERSION);
  });

  it('normal launch: opens with the existing key', async () => {
    const env = fakeEnvironment({ storedKey: EXISTING_KEY, fileKey: EXISTING_KEY });
    const result = await openEncryptedDatabase(env.deps);

    expect(env.events).toEqual(['open']);
    expect(result.resetUnreadable).toBe(false);
  });

  it('restored without the keychain: replaces the unreadable file and reports it', async () => {
    const env = fakeEnvironment({ storedKey: null, fileKey: 'key-from-another-device' });
    const result = await openEncryptedDatabase(env.deps);

    expect(env.events).toEqual(['storeKey', 'open', 'delete', 'open']);
    expect(env.opened[0].closed).toBe(true);
    expect(result.resetUnreadable).toBe(true);
    expect(await getSchemaVersion(result.db)).toBe(SCHEMA_VERSION);
  });

  it('NEVER deletes data when an existing key does not match', async () => {
    const env = fakeEnvironment({ storedKey: EXISTING_KEY, fileKey: 'something-else' });

    await expect(openEncryptedDatabase(env.deps)).rejects.toBe(NOT_A_DATABASE);
    expect(env.events).not.toContain('delete');
    expect(env.opened[0].closed).toBe(true);
  });

  it('NEVER deletes data or creates a key when the keychain read fails', async () => {
    const env = fakeEnvironment({
      storedKey: EXISTING_KEY,
      fileKey: EXISTING_KEY,
      readKeyError: new Error('Keychain unavailable'),
    });

    await expect(openEncryptedDatabase(env.deps)).rejects.toThrow('Keychain unavailable');
    expect(env.events).toEqual([]);
  });

  it('refuses to run unencrypted when encryption is required', async () => {
    const env = fakeEnvironment({ storedKey: null, fileKey: null, cipher: false });

    await expect(openEncryptedDatabase(env.deps)).rejects.toThrow(/SQLCipher is not available/);
    expect(env.opened[0].closed).toBe(true);
  });

  it('allows unencrypted development builds, with a warning', async () => {
    const env = fakeEnvironment({ storedKey: null, fileKey: null, cipher: false });
    env.deps.requireEncryption = false;

    const result = await openEncryptedDatabase(env.deps);
    expect(result.encrypted).toBe(false);
    expect(env.deps.warn).toHaveBeenCalledWith(expect.stringMatching(/NOT encrypted/));
  });
});
