import { compareLocalDates, isValidLocalDate, type LocalDate } from './date';

/** Profile rules from PRD §6 P0 — Profiles. Pure, so the form and the repository share them. */

export const MAX_PROFILE_NAME_LENGTH = 30;

export type ProfileInput = {
  name: string;
  icon: string | null;
  accentColor: string | null;
  noContactStartDate: LocalDate | null;
};

export type ProfileInputErrors = Partial<Record<'name' | 'noContactStartDate', string>>;

/**
 * Length in characters as SQLite's `length()` counts them (code points), so an emoji counts
 * once here and in the CHECK constraint, not twice as with `String.length`.
 */
export function characterCount(value: string): number {
  return Array.from(value).length;
}

export function normalizeProfileInput(input: ProfileInput): ProfileInput {
  return { ...input, name: input.name.trim() };
}

export function validateProfileInput(input: ProfileInput, today: LocalDate): ProfileInputErrors {
  const errors: ProfileInputErrors = {};
  const name = input.name.trim();
  if (name.length === 0) {
    errors.name = 'Give this Pudar a name.';
  } else if (characterCount(name) > MAX_PROFILE_NAME_LENGTH) {
    errors.name = `Keep it to ${MAX_PROFILE_NAME_LENGTH} characters.`;
  }

  const start = input.noContactStartDate;
  if (start !== null) {
    if (!isValidLocalDate(start)) {
      errors.noContactStartDate = 'Choose a valid date.';
    } else if (compareLocalDates(start, today) > 0) {
      errors.noContactStartDate = "The start date can't be in the future.";
    }
  }
  return errors;
}

export function hasErrors(errors: ProfileInputErrors): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * The profile to show: the stored one if it still exists, otherwise the oldest profile,
 * otherwise none (first-launch state).
 */
export function resolveActiveProfileId(
  profileIds: readonly string[],
  storedId: string | null,
): string | null {
  if (storedId !== null && profileIds.includes(storedId)) {
    return storedId;
  }
  return profileIds[0] ?? null;
}
