import type { LocalDate } from '@/lib/date';
import { RETENTION_MS } from '@/lib/fading';

import type { Db } from './types';

/** The editor's unsaved text for one profile (PRD D21). Never listed, never fades. */
export type Draft = {
  profileId: string;
  /** The date the editor was writing for. */
  date: LocalDate;
  /** The entry being edited, or null for a new entry. */
  entryId: string | null;
  content: string;
  updatedAt: number;
};

type DraftRow = {
  profile_id: string;
  date: string;
  entry_id: string | null;
  content: string;
  updated_at: number;
};

/** Drafts untouched this long are dropped instead of restored (PRD D21). */
export const DRAFT_MAX_AGE_MS = RETENTION_MS;

/** The profile's draft, or null. A draft older than 30 days is deleted rather than returned. */
export async function getDraft(db: Db, profileId: string, now: number): Promise<Draft | null> {
  const row = await db.getFirstAsync<DraftRow>(
    'SELECT profile_id, date, entry_id, content, updated_at FROM drafts WHERE profile_id = ?',
    profileId,
  );
  if (!row) return null;
  if (now - row.updated_at >= DRAFT_MAX_AGE_MS) {
    await deleteDraft(db, profileId);
    return null;
  }
  return {
    profileId: row.profile_id,
    date: row.date,
    entryId: row.entry_id,
    content: row.content,
    updatedAt: row.updated_at,
  };
}

/** Stores the draft, replacing the profile's previous one. Blank text deletes it instead. */
export async function saveDraft(
  db: Db,
  draft: Omit<Draft, 'updatedAt'>,
  now: number,
): Promise<void> {
  if (draft.content.trim().length === 0) {
    await deleteDraft(db, draft.profileId);
    return;
  }
  await db.runAsync(
    `INSERT INTO drafts (profile_id, date, entry_id, content, updated_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (profile_id) DO UPDATE SET
       date = excluded.date, entry_id = excluded.entry_id,
       content = excluded.content, updated_at = excluded.updated_at`,
    draft.profileId,
    draft.date,
    draft.entryId,
    draft.content,
    now,
  );
}

export async function deleteDraft(db: Db, profileId: string): Promise<void> {
  await db.runAsync('DELETE FROM drafts WHERE profile_id = ?', profileId);
}
