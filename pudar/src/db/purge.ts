import { DRAFT_MAX_AGE_MS } from './drafts';
import type { Db } from './types';

/**
 * Erases the text of every entry past its deadline and drops stale drafts (PRD §6 Purge, D21).
 * Idempotent. Runs on launch and whenever the app returns to the foreground. Returns how many
 * entries were erased.
 */
export async function purgeExpired(db: Db, now: number): Promise<number> {
  const result = await db.runAsync(
    `UPDATE journal_entries SET content = NULL, faded_at = ?
     WHERE content IS NOT NULL AND retention_expires_at <= ?`,
    now,
    now,
  );
  await db.runAsync('DELETE FROM drafts WHERE updated_at <= ?', now - DRAFT_MAX_AGE_MS);
  if (result.changes > 0) {
    // Don't leave erased text behind in the write-ahead log.
    await db.execAsync('PRAGMA wal_checkpoint(TRUNCATE)');
  }
  return result.changes;
}
