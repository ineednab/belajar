/**
 * Local calendar dates (PRD D2).
 *
 * A `LocalDate` is a 'YYYY-MM-DD' string in the device's calendar at the moment it was
 * captured. It is never re-derived from a timestamp later, so travelling or a timezone
 * change does not move an entry to a different day.
 *
 * Arithmetic is done on the Y/M/D components in UTC, where every day is exactly 24h,
 * so DST transitions can never make a difference of "one day" come out as 0 or 2.
 */

export type LocalDate = string;

const DAY_MS = 24 * 60 * 60 * 1000;
const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad(value: number, length = 2): string {
  return String(value).padStart(length, '0');
}

/** Midnight UTC of the given calendar day. Avoids `Date.UTC`'s 0–99 → 1900s year mapping. */
function utcMidnight(year: number, month: number, day: number): number {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return date.getTime();
}

function parse(value: LocalDate): number {
  const match = LOCAL_DATE_PATTERN.exec(value);
  if (match) {
    const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
    const ms = utcMidnight(year, month, day);
    const check = new Date(ms);
    if (
      check.getUTCFullYear() === year &&
      check.getUTCMonth() === month - 1 &&
      check.getUTCDate() === day
    ) {
      return ms;
    }
  }
  throw new RangeError(`Invalid LocalDate: "${value}"`);
}

function formatUtc(ms: number): LocalDate {
  const date = new Date(ms);
  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function isValidLocalDate(value: string): boolean {
  try {
    parse(value);
    return true;
  } catch {
    return false;
  }
}

/** The calendar date of `date` in the device's current timezone. */
export function toLocalDate(date: Date): LocalDate {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError('Invalid Date');
  }
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayLocal(now: Date = new Date()): LocalDate {
  return toLocalDate(now);
}

/** Whole calendar days from `from` to `to`. Negative when `to` is earlier. */
export function diffCalendarDays(from: LocalDate, to: LocalDate): number {
  return Math.round((parse(to) - parse(from)) / DAY_MS);
}

export function addDays(date: LocalDate, days: number): LocalDate {
  if (!Number.isInteger(days)) {
    throw new RangeError(`addDays expects an integer, got ${days}`);
  }
  return formatUtc(parse(date) + days * DAY_MS);
}

export function compareLocalDates(a: LocalDate, b: LocalDate): -1 | 0 | 1 {
  const diff = parse(a) - parse(b);
  return diff < 0 ? -1 : diff > 0 ? 1 : 0;
}

/**
 * The 7 days of the week containing `date`.
 * `weekStartsOn` uses JS day numbers: 0 = Sunday … 6 = Saturday.
 */
export function weekContaining(date: LocalDate, weekStartsOn: number): LocalDate[] {
  if (!Number.isInteger(weekStartsOn) || weekStartsOn < 0 || weekStartsOn > 6) {
    throw new RangeError(`weekStartsOn must be 0–6, got ${weekStartsOn}`);
  }
  const dayOfWeek = new Date(parse(date)).getUTCDay();
  const start = addDays(date, -((dayOfWeek - weekStartsOn + 7) % 7));
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/**
 * Elapsed no-contact days shown by the counter (PRD §6 Today).
 * A start date in the future (e.g. after crossing timezones) counts as 0.
 */
export function noContactDays(start: LocalDate, today: LocalDate): number {
  return Math.max(0, diffCalendarDays(start, today));
}
