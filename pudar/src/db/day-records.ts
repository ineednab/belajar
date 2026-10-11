import type { LocalDate } from '@/lib/date';

import type { Db } from './types';

/** The three main per-day check-ins (PRD §6 Quick logs). */
export const MAIN_QUICK_LOG_KEYS = ['thoughtOfThem', 'hadACry', 'choseMyself'] as const;
/** The extra check-ins behind "Lainnya" (PRD D22). */
export const MORE_QUICK_LOG_KEYS = [
  'wantedToChat',
  'checkedSocials',
  'missedThem',
  'feltAngry',
  'feltRelieved',
  'sleptWell',
] as const;

export type QuickLogKey = (typeof MAIN_QUICK_LOG_KEYS)[number] | (typeof MORE_QUICK_LOG_KEYS)[number];

export type QuickLogs = Record<QuickLogKey, boolean>;

const COLUMN: Record<QuickLogKey, string> = {
  thoughtOfThem: 'thought_of_them',
  hadACry: 'had_a_cry',
  choseMyself: 'chose_myself',
  wantedToChat: 'wanted_to_chat',
  checkedSocials: 'checked_socials',
  missedThem: 'missed_them',
  feltAngry: 'felt_angry',
  feltRelieved: 'felt_relieved',
  sleptWell: 'slept_well',
};

const KEYS = [...MAIN_QUICK_LOG_KEYS, ...MORE_QUICK_LOG_KEYS];
const COLUMNS = KEYS.map((key) => COLUMN[key]);

export const NO_QUICK_LOGS: QuickLogs = Object.fromEntries(KEYS.map((key) => [key, false])) as QuickLogs;

type DayRecordRow = { date: string } & Record<string, number | string>;

function toQuickLogs(row: DayRecordRow): QuickLogs {
  return Object.fromEntries(KEYS.map((key) => [key, row[COLUMN[key]] === 1])) as QuickLogs;
}

/** The day's quick logs, all off when there is no record. */
export async function getQuickLogs(db: Db, profileId: string, date: LocalDate): Promise<QuickLogs> {
  const row = await db.getFirstAsync<DayRecordRow>(
    `SELECT date, ${COLUMNS.join(', ')} FROM day_records WHERE profile_id = ? AND date = ?`,
    profileId,
    date,
  );
  return row ? toQuickLogs(row) : { ...NO_QUICK_LOGS };
}

/** Quick logs for every recorded day in `[from, to]`, keyed by date. */
export async function listQuickLogs(
  db: Db,
  profileId: string,
  from: LocalDate,
  to: LocalDate,
): Promise<Map<LocalDate, QuickLogs>> {
  const rows = await db.getAllAsync<DayRecordRow>(
    `SELECT date, ${COLUMNS.join(', ')} FROM day_records WHERE profile_id = ? AND date BETWEEN ? AND ?`,
    profileId,
    from,
    to,
  );
  return new Map(rows.map((row) => [row.date, toQuickLogs(row)]));
}

/**
 * Saves the day's quick logs immediately (PRD D1). When all of them are off the row is deleted,
 * so there are no blank records.
 */
export async function saveQuickLogs(
  db: Db,
  profileId: string,
  date: LocalDate,
  logs: QuickLogs,
  now: number,
): Promise<void> {
  if (KEYS.every((key) => !logs[key])) {
    await db.runAsync('DELETE FROM day_records WHERE profile_id = ? AND date = ?', profileId, date);
    return;
  }
  await db.runAsync(
    `INSERT INTO day_records (profile_id, date, ${COLUMNS.join(', ')}, updated_at)
     VALUES (?, ?, ${COLUMNS.map(() => '?').join(', ')}, ?)
     ON CONFLICT (profile_id, date) DO UPDATE SET
       ${COLUMNS.map((column) => `${column} = excluded.${column}`).join(', ')},
       updated_at = excluded.updated_at`,
    profileId,
    date,
    ...KEYS.map((key) => (logs[key] ? 1 : 0)),
    now,
  );
}
