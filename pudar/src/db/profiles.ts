import type { LocalDate } from '@/lib/date';
import {
  hasErrors,
  normalizeProfileInput,
  resolveActiveProfileId,
  validateProfileInput,
  type ProfileInput,
} from '@/lib/profile';

import { deleteSetting, getSetting, setSetting } from './settings';
import type { Db } from './types';

export type Profile = {
  id: string;
  name: string;
  icon: string | null;
  accentColor: string | null;
  noContactStartDate: LocalDate | null;
  createdAt: number;
  updatedAt: number;
  /** Set while the Pudar is closed ("Aku sudah selesai dengan orang ini", PRD D23). */
  closedAt: number | null;
  /** The local date it was closed; the counter stops here. */
  closedOn: LocalDate | null;
  /** How many times it was opened again after closing. */
  reopenCount: number;
};

type ProfileRow = {
  id: string;
  name: string;
  icon: string | null;
  accent_color: string | null;
  no_contact_start_date: string | null;
  created_at: number;
  updated_at: number;
  closed_at: number | null;
  closed_on: string | null;
  reopen_count: number;
};

const COLUMNS =
  'id, name, icon, accent_color, no_contact_start_date, created_at, updated_at, closed_at, closed_on, reopen_count';

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    accentColor: row.accent_color,
    noContactStartDate: row.no_contact_start_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    closedAt: row.closed_at,
    closedOn: row.closed_on,
    reopenCount: row.reopen_count,
  };
}

export function isClosed(profile: Pick<Profile, 'closedAt'>): boolean {
  return profile.closedAt !== null;
}

export class ProfileValidationError extends Error {
  constructor(readonly errors: ReturnType<typeof validateProfileInput>) {
    super(`Invalid profile: ${Object.values(errors).join(' ')}`);
    this.name = 'ProfileValidationError';
  }
}

function validated(input: ProfileInput, today: LocalDate): ProfileInput {
  const errors = validateProfileInput(input, today);
  if (hasErrors(errors)) {
    throw new ProfileValidationError(errors);
  }
  return normalizeProfileInput(input);
}

/** Oldest first, so the order stays stable as profiles are added. */
export async function listProfiles(db: Db): Promise<Profile[]> {
  const rows = await db.getAllAsync<ProfileRow>(
    `SELECT ${COLUMNS} FROM profiles ORDER BY created_at ASC, id ASC`,
  );
  return rows.map(toProfile);
}

export async function getProfile(db: Db, id: string): Promise<Profile | null> {
  const row = await db.getFirstAsync<ProfileRow>(
    `SELECT ${COLUMNS} FROM profiles WHERE id = ?`,
    id,
  );
  return row ? toProfile(row) : null;
}

export async function createProfile(
  db: Db,
  input: ProfileInput,
  context: { id: string; now: number; today: LocalDate },
): Promise<Profile> {
  const { name, icon, accentColor, noContactStartDate } = validated(input, context.today);
  await db.runAsync(
    `INSERT INTO profiles (id, name, icon, accent_color, no_contact_start_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    context.id,
    name,
    icon,
    accentColor,
    noContactStartDate,
    context.now,
    context.now,
  );
  return {
    id: context.id,
    name,
    icon,
    accentColor,
    noContactStartDate,
    createdAt: context.now,
    updatedAt: context.now,
    closedAt: null,
    closedOn: null,
    reopenCount: 0,
  };
}

export async function updateProfile(
  db: Db,
  id: string,
  input: ProfileInput,
  context: { now: number; today: LocalDate },
): Promise<void> {
  const { name, icon, accentColor, noContactStartDate } = validated(input, context.today);
  const { changes } = await db.runAsync(
    `UPDATE profiles
     SET name = ?, icon = ?, accent_color = ?, no_contact_start_date = ?, updated_at = ?
     WHERE id = ?`,
    name,
    icon,
    accentColor,
    noContactStartDate,
    context.now,
    id,
  );
  if (changes === 0) {
    throw new Error('Profile not found.');
  }
}

/** "Start again from today" (PRD D16). No previous start dates are kept. */
export async function startAgainToday(
  db: Db,
  id: string,
  context: { now: number; today: LocalDate },
): Promise<void> {
  await db.runAsync(
    'UPDATE profiles SET no_contact_start_date = ?, updated_at = ? WHERE id = ?',
    context.today,
    context.now,
    id,
  );
}

/**
 * "Aku sudah selesai dengan orang ini" (PRD D23): the Pudar becomes read-only history and its
 * counter stops at `today`. Entries keep fading on schedule. Closing twice changes nothing.
 */
export async function closeProfile(
  db: Db,
  id: string,
  context: { now: number; today: LocalDate },
): Promise<void> {
  await db.runAsync(
    `UPDATE profiles SET closed_at = ?, closed_on = ?, updated_at = ?
     WHERE id = ? AND closed_at IS NULL`,
    context.now,
    context.today,
    context.now,
    id,
  );
}

/** "Buka lagi": the Pudar is writable again and the reopen is counted (PRD D23). */
export async function reopenProfile(db: Db, id: string, now: number): Promise<void> {
  await db.runAsync(
    `UPDATE profiles SET closed_at = NULL, closed_on = NULL, reopen_count = reopen_count + 1, updated_at = ?
     WHERE id = ? AND closed_at IS NOT NULL`,
    now,
    id,
  );
}

/** Throws if the profile is closed, so nothing new is written to read-only history. */
export async function assertProfileOpen(db: Db, id: string): Promise<void> {
  const row = await db.getFirstAsync<{ closed_at: number | null }>(
    'SELECT closed_at FROM profiles WHERE id = ?',
    id,
  );
  if (row && row.closed_at !== null) {
    throw new ProfileClosedError();
  }
}

export class ProfileClosedError extends Error {
  constructor() {
    super('Pudar ini sudah selesai, jadi hanya bisa dibaca.');
    this.name = 'ProfileClosedError';
  }
}

/** Permanently deletes the profile; its day records and entries go with it (ON DELETE CASCADE). */
export async function deleteProfile(db: Db, id: string): Promise<void> {
  await db.runAsync('DELETE FROM profiles WHERE id = ?', id);
}

export type ProfilesSnapshot = { profiles: Profile[]; activeProfileId: string | null };

/**
 * All profiles plus the one to show. Repairs the stored active id if it points to a profile
 * that no longer exists, so every screen agrees on the same answer.
 */
export async function loadProfilesSnapshot(db: Db): Promise<ProfilesSnapshot> {
  const profiles = await listProfiles(db);
  const storedId = await getSetting(db, 'active_profile_id');
  const activeProfileId = resolveActiveProfileId(
    profiles.map((p) => p.id),
    storedId,
  );
  if (activeProfileId !== storedId) {
    await persistActiveProfileId(db, activeProfileId);
  }
  return { profiles, activeProfileId };
}

export async function persistActiveProfileId(db: Db, id: string | null): Promise<void> {
  if (id === null) {
    await deleteSetting(db, 'active_profile_id');
  } else {
    await setSetting(db, 'active_profile_id', id);
  }
}
