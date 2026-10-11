import type { Db } from './types';

export type SettingKey = 'active_profile_id' | 'retention_ack_at' | 'app_lock_enabled';

export async function getSetting(db: Db, key: SettingKey): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    key,
  );
  return row?.value ?? null;
}

export async function setSetting(db: Db, key: SettingKey, value: string): Promise<void> {
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value',
    key,
    value,
  );
}

export async function deleteSetting(db: Db, key: SettingKey): Promise<void> {
  await db.runAsync('DELETE FROM settings WHERE key = ?', key);
}
