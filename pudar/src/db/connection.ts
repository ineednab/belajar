import { getSchemaVersion } from './migrations';
import type { Db } from './types';

const HEX_KEY_PATTERN = /^[0-9a-f]{64}$/;

/**
 * Unlocks a SQLCipher database with a raw 256-bit key. Must be the first statement on the
 * connection. On a build without SQLCipher this pragma is silently ignored, which is why
 * `getCipherVersion` exists.
 */
export async function applyKey(db: Db, hexKey: string): Promise<void> {
  if (!HEX_KEY_PATTERN.test(hexKey)) {
    throw new Error('Database key must be 64 lowercase hex characters.');
  }
  await db.execAsync(`PRAGMA key = "x'${hexKey}'"`);
}

/** Throws SQLITE_NOTADB ("file is not a database") if the key does not match the file. */
export async function verifyReadable(db: Db): Promise<void> {
  await db.getFirstAsync('SELECT count(*) AS n FROM sqlite_master');
}

export function isNotADatabaseError(error: unknown): boolean {
  return error instanceof Error && /not a database|SQLITE_NOTADB/i.test(error.message);
}

/** The SQLCipher version, or null when the database is plain (unencrypted) SQLite. */
export async function getCipherVersion(db: Db): Promise<string | null> {
  const row = await db.getFirstAsync<{ cipher_version: string }>('PRAGMA cipher_version');
  return row?.cipher_version ?? null;
}

/** Per-connection settings (PRD §7). Must run outside a transaction. */
export async function configureConnection(db: Db): Promise<void> {
  await db.execAsync(
    'PRAGMA foreign_keys = ON; PRAGMA secure_delete = ON; PRAGMA journal_mode = WAL;',
  );
}

export type DbDiagnostics = {
  cipherVersion: string | null;
  foreignKeys: boolean;
  secureDelete: boolean;
  journalMode: string;
  schemaVersion: number;
};

export async function readDiagnostics(db: Db): Promise<DbDiagnostics> {
  const [cipherVersion, foreignKeys, secureDelete, journalMode, schemaVersion] =
    await Promise.all([
      getCipherVersion(db),
      db.getFirstAsync<{ foreign_keys: number }>('PRAGMA foreign_keys'),
      db.getFirstAsync<{ secure_delete: number }>('PRAGMA secure_delete'),
      db.getFirstAsync<{ journal_mode: string }>('PRAGMA journal_mode'),
      getSchemaVersion(db),
    ]);
  return {
    cipherVersion,
    foreignKeys: foreignKeys?.foreign_keys === 1,
    secureDelete: secureDelete?.secure_delete === 1,
    journalMode: journalMode?.journal_mode ?? 'unknown',
    schemaVersion,
  };
}
