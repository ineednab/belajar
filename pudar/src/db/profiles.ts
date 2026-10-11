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
};

type ProfileRow = {
  id: string;
  name: string;
  icon: string | null;
  accent_color: string | null;
  no_contact_start_date: string | null;
  created_at: number;
  updated_at: number;
};

const COLUMNS =
  'id, name, icon, accent_color, no_contact_start_date, created_at, updated_at';

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    accentColor: row.accent_color,
    noContactStartDate: row.no_contact_start_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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
    `INSERT INTO profiles (${COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?)`,
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
