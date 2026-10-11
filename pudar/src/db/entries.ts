import type { LocalDate } from '@/lib/date';
import { MAX_ENTRY_LENGTH, retentionExpiresAt } from '@/lib/fading';

import type { Db } from './types';

export type JournalEntry = {
  id: string;
  profileId: string;
  date: LocalDate;
  /** `null` once the entry has faded, whether or not the purge has run yet (PRD D11). */
  content: string | null;
  createdAt: number;
  updatedAt: number;
  locked: boolean;
  retentionExpiresAt: number;
  fadedAt: number | null;
};

type EntryRow = {
  id: string;
  profile_id: string;
  date: string;
  content: string | null;
  created_at: number;
  updated_at: number;
  locked: number;
  retention_expires_at: number;
  faded_at: number | null;
};

const COLUMNS =
  'id, profile_id, date, content, created_at, updated_at, locked, retention_expires_at, faded_at';

/** The only way rows leave this module, so expired text never reaches the UI. */
function toEntry(row: EntryRow, now: number): JournalEntry {
  const expired = now >= row.retention_expires_at;
  return {
    id: row.id,
    profileId: row.profile_id,
    date: row.date,
    content: expired ? null : row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    locked: row.locked === 1,
    retentionExpiresAt: row.retention_expires_at,
    fadedAt: row.faded_at,
  };
}

export function isFaded(entry: JournalEntry): boolean {
  return entry.content === null;
}

export async function getEntryForDate(
  db: Db,
  profileId: string,
  date: LocalDate,
  now: number,
): Promise<JournalEntry | null> {
  const row = await db.getFirstAsync<EntryRow>(
    `SELECT ${COLUMNS} FROM journal_entries WHERE profile_id = ? AND date = ?`,
    profileId,
    date,
  );
  return row ? toEntry(row, now) : null;
}

/** Which days in `[from, to]` have an entry, and whether it has faded. Never includes text. */
export async function listEntryMarks(
  db: Db,
  profileId: string,
  from: LocalDate,
  to: LocalDate,
  now: number,
): Promise<Map<LocalDate, { faded: boolean }>> {
  const rows = await db.getAllAsync<{ date: string; has_content: number; retention_expires_at: number }>(
    `SELECT date, content IS NOT NULL AS has_content, retention_expires_at
     FROM journal_entries WHERE profile_id = ? AND date BETWEEN ? AND ?`,
    profileId,
    from,
    to,
  );
  return new Map(
    rows.map((row) => [row.date, { faded: row.has_content === 0 || now >= row.retention_expires_at }]),
  );
}

export class EntryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EntryValidationError';
  }
}

/**
 * Creates the day's entry, or updates its text. Editing never moves `createdAt` or the
 * retention deadline (PRD D7). Callers decide writability; this only enforces the content rules.
 */
export async function saveEntry(
  db: Db,
  profileId: string,
  date: LocalDate,
  content: string,
  context: { id: string; now: number },
): Promise<JournalEntry> {
  if (content.trim().length === 0) {
    throw new EntryValidationError('An entry needs some text.');
  }
  if (content.length > MAX_ENTRY_LENGTH) {
    throw new EntryValidationError(`Keep it to ${MAX_ENTRY_LENGTH} characters.`);
  }
  const existing = await getEntryForDate(db, profileId, date, context.now);
  if (existing) {
    if (isFaded(existing)) {
      throw new EntryValidationError('This entry has faded.');
    }
    await db.runAsync(
      'UPDATE journal_entries SET content = ?, updated_at = ? WHERE id = ?',
      content,
      context.now,
      existing.id,
    );
    return { ...existing, content, updatedAt: context.now };
  }
  const entry: JournalEntry = {
    id: context.id,
    profileId,
    date,
    content,
    createdAt: context.now,
    updatedAt: context.now,
    locked: false,
    retentionExpiresAt: retentionExpiresAt(context.now),
    fadedAt: null,
  };
  await db.runAsync(
    `INSERT INTO journal_entries (${COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, 0, ?, NULL)`,
    entry.id,
    profileId,
    date,
    content,
    entry.createdAt,
    entry.updatedAt,
    entry.retentionExpiresAt,
  );
  return entry;
}
