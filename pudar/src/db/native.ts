import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';

import type { DatabaseOpenDeps } from './open';

const DATABASE_NAME = 'pudar.db';
const KEY_NAME = 'pudar.database-key.v1';

/**
 * WHEN_UNLOCKED (not *_THIS_DEVICE_ONLY) so the key travels with an encrypted iCloud or Finder
 * backup and journal data survives a move to a new iPhone (PRD §9.3).
 */
const KEY_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED,
};

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export const nativeDatabaseDeps: DatabaseOpenDeps = {
  readKey: () => SecureStore.getItemAsync(KEY_NAME, KEY_OPTIONS),
  generateKey: async () => toHex(await Crypto.getRandomBytesAsync(32)),
  storeKey: (key) => SecureStore.setItemAsync(KEY_NAME, key, KEY_OPTIONS),
  deleteKey: () => SecureStore.deleteItemAsync(KEY_NAME, KEY_OPTIONS),
  openDatabase: () => SQLite.openDatabaseAsync(DATABASE_NAME),
  deleteDatabase: () => SQLite.deleteDatabaseAsync(DATABASE_NAME),
  requireEncryption: !__DEV__,
  warn: (message) => console.warn(message),
};
