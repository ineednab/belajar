import type { LocalDate } from '@/lib/date';

import type { Db } from './types';

/** The three per-day check-ins (PRD §6 Quick logs). */
export type QuickLogKey = 'thoughtOfThem' | 'hadACry' | 'choseMyself';

export type QuickLogs = Record<QuickLogKey, boolean>;

export const NO_QUICK_LOGS: QuickLogs = { thoughtOfThem: false, hadACry: false, choseMyself: false };

type DayRecordRow = {
  date: string;
  thought_of_them: number;
  had_a_cry: number;
  chose_myself: number;
};

function toQuickLogs(row: DayRecordRow): QuickLogs {
  return {
    thoughtOfThem: row.thought_of_them === 1,
    hadACry: row.had_a_cry === 1,
    choseMyself: row.chose_myself === 1,
  };
}

/** The day's quick logs, all off when there is no record. */
export async function getQuickLogs(db: Db, profileId: string, date: LocalDate): Promise<QuickLogs> {
  const row = await db.getFirstAsync<DayRecordRow>(
    `SELECT date, thought_of_them, had_a_cry, chose_myself
     FROM day_records WHERE profile_id = ? AND date = ?`,
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
    `SELECT date, thought_of_them, had_a_cry, chose_myself
     FROM day_records WHERE profile_id = ? AND date BETWEEN ? AND ?`,
    profileId,
    from,
    to,
  );
  return new Map(rows.map((row) => [row.date, toQuickLogs(row)]));
}

/**
 * Saves the day's quick logs immediately (PRD D1). When all three are off the row is deleted,
 * so there are no blank records.
 */
export async function saveQuickLogs(
  db: Db,
  profileId: string,
  date: LocalDate,
  logs: QuickLogs,
  now: number,
): Promise<void> {
  if (!logs.thoughtOfThem && !logs.hadACry && !logs.choseMyself) {
    await db.runAsync('DELETE FROM day_records WHERE profile_id = ? AND date = ?', profileId, date);
    return;
  }
  await db.runAsync(
    `INSERT INTO day_records (profile_id, date, thought_of_them, had_a_cry, chose_myself, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (profile_id, date) DO UPDATE SET
       thought_of_them = excluded.thought_of_them,
       had_a_cry = excluded.had_a_cry,
       chose_myself = excluded.chose_myself,
       updated_at = excluded.updated_at`,
    profileId,
    date,
    logs.thoughtOfThem ? 1 : 0,
    logs.hadACry ? 1 : 0,
    logs.choseMyself ? 1 : 0,
    now,
  );
}
