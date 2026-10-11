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

export async function getEntry(db: Db, id: string, now: number): Promise<JournalEntry | null> {
  const row = await db.getFirstAsync<EntryRow>(`SELECT ${COLUMNS} FROM journal_entries WHERE id = ?`, id);
  return row ? toEntry(row, now) : null;
}

/** All of a day's entries, newest first. A day can hold any number (PRD D5). */
export async function listEntriesForDate(
  db: Db,
  profileId: string,
  date: LocalDate,
  now: number,
): Promise<JournalEntry[]> {
  const rows = await db.getAllAsync<EntryRow>(
    `SELECT ${COLUMNS} FROM journal_entries WHERE profile_id = ? AND date = ?
     ORDER BY created_at DESC, id DESC`,
    profileId,
    date,
  );
  return rows.map((row) => toEntry(row, now));
}

/**
 * Which days in `[from, to]` have at least one entry. A day counts as faded only when every
 * entry on it has faded. Never includes text.
 */
export async function listEntryMarks(
  db: Db,
  profileId: string,
  from: LocalDate,
  to: LocalDate,
  now: number,
): Promise<Map<LocalDate, { faded: boolean }>> {
  const rows = await db.getAllAsync<{ date: string; live: number }>(
    `SELECT date, MAX(content IS NOT NULL AND retention_expires_at > ?) AS live
     FROM journal_entries WHERE profile_id = ? AND date BETWEEN ? AND ?
     GROUP BY date`,
    now,
    profileId,
    from,
    to,
  );
  return new Map(rows.map((row) => [row.date, { faded: row.live === 0 }]));
}

export class EntryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EntryValidationError';
  }
}

function validateContent(content: string) {
  if (content.trim().length === 0) {
    throw new EntryValidationError('Tulisan tidak boleh kosong.');
  }
  if (content.length > MAX_ENTRY_LENGTH) {
    throw new EntryValidationError(`Maksimal ${MAX_ENTRY_LENGTH} karakter.`);
  }
}

/** Adds a new entry to the day, with its own 30-day retention deadline (PRD D5). */
export async function createEntry(
  db: Db,
  profileId: string,
  date: LocalDate,
  content: string,
  context: { id: string; now: number },
): Promise<JournalEntry> {
  validateContent(content);
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

/**
 * Replaces an entry's text. Editing never moves `createdAt` or the retention deadline (PRD D7).
 * Callers decide writability; this only enforces the content rules.
 */
export async function updateEntry(
  db: Db,
  id: string,
  content: string,
  now: number,
): Promise<JournalEntry> {
  validateContent(content);
  const existing = await getEntry(db, id, now);
  if (!existing) {
    throw new EntryValidationError('Tulisan ini sudah tidak ada.');
  }
  if (isFaded(existing)) {
    throw new EntryValidationError('Tulisan ini sudah memudar.');
  }
  await db.runAsync('UPDATE journal_entries SET content = ?, updated_at = ? WHERE id = ?', content, now, id);
  return { ...existing, content, updatedAt: now };
}
