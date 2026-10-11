import {
  applyKey,
  configureConnection,
  getCipherVersion,
  isNotADatabaseError,
  verifyReadable,
} from './connection';
import { migrate } from './migrations';
import type { Db } from './types';

export type DatabaseOpenDeps = {
  readKey(): Promise<string | null>;
  generateKey(): Promise<string>;
  storeKey(key: string): Promise<void>;
  deleteKey(): Promise<void>;
  openDatabase(): Promise<Db>;
  deleteDatabase(): Promise<void>;
  /** Refuse to open without SQLCipher. True in production builds. */
  requireEncryption: boolean;
  warn(message: string): void;
};

export type OpenedDatabase = {
  db: Db;
  encrypted: boolean;
  /**
   * True when an existing database file could not be read with a freshly created key and was
   * replaced (PRD §9.3: restored from a backup that did not include the keychain).
   */
  resetUnreadable: boolean;
};

/**
 * Opens the journal database: key → unlock → encryption check → pragmas → migrations.
 *
 * Data is only ever discarded when the keychain had *no* key and the file can't be read with the
 * new one. If a key exists and doesn't work, or the keychain itself fails, the error propagates
 * and nothing is deleted.
 */
export async function openEncryptedDatabase(deps: DatabaseOpenDeps): Promise<OpenedDatabase> {
  let key = await deps.readKey();
  const keyIsNew = key === null;
  if (key === null) {
    key = await deps.generateKey();
    // Store before the database file exists, so a crash can't leave a file with no key.
    await deps.storeKey(key);
  }

  let resetUnreadable = false;
  let db = await deps.openDatabase();
  try {
    await unlock(db, key);
  } catch (error) {
    await db.closeAsync();
    if (!keyIsNew || !isNotADatabaseError(error)) {
      throw error;
    }
    await deps.deleteDatabase();
    db = await deps.openDatabase();
    await unlock(db, key);
    resetUnreadable = true;
  }

  const cipherVersion = await getCipherVersion(db);
  if (cipherVersion === null) {
    if (deps.requireEncryption) {
      await db.closeAsync();
      throw new Error('SQLCipher is not available. Refusing to store journal data unencrypted.');
    }
    deps.warn('Pudar database is NOT encrypted (SQLCipher unavailable). Development only.');
  }

  await configureConnection(db);
  await migrate(db);
  return { db, encrypted: cipherVersion !== null, resetUnreadable };
}

async function unlock(db: Db, key: string): Promise<void> {
  await applyKey(db, key);
  await verifyReadable(db);
}

/**
 * "Hapus semua data" (PRD §6 Settings, Epic 7): close the connection, delete the database file,
 * then delete the key. The next open starts from first launch with a new key.
 *
 * The file goes first. If deleting it fails, the key is still there and nothing is lost by
 * trying again. If deleting the key fails afterwards, the data is already gone and the next
 * launch simply reuses the old key for an empty database.
 */
export async function deleteAllData(
  db: Db,
  deps: Pick<DatabaseOpenDeps, 'deleteDatabase' | 'deleteKey'>,
): Promise<void> {
  await db.closeAsync();
  await deps.deleteDatabase();
  await deps.deleteKey();
}
