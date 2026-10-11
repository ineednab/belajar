/**
 * Retention and fading constants (PRD §6 Fading engine).
 *
 * Fixed here in Epic 1 so the schema, repositories and the Epic 3 fade engine all build
 * on the same numbers. Changing them only affects entries created afterwards, because
 * `retention_expires_at` is stored per entry at creation.
 */

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const RETENTION_MS = 30 * DAY_MS;
export const FADE_START_MS = 24 * HOUR_MS;
export const NEAR_EXPIRY_MS = 3 * DAY_MS;
export const MIN_CARD_OPACITY = 0.4;

export const MAX_ENTRY_LENGTH = 2000;

export function retentionExpiresAt(createdAt: number): number {
  return createdAt + RETENTION_MS;
}

export type FadeStatus = 'active' | 'fading' | 'near_expiry' | 'faded';

export type FadeState = {
  status: FadeStatus;
  /** Timeline card opacity, from 1.0 down to `MIN_CARD_OPACITY`. Opened entries ignore it. */
  opacity: number;
  /** Whole days until the text is erased, rounded up; 0 once faded. */
  daysLeft: number;
};

/**
 * Where an entry is in its 30 days (PRD §6 Fading engine). Pure: computed only from stored
 * timestamps, so it is the same however often or rarely the app is opened. `locked` is
 * independent and not considered here.
 */
export function getFadeState(
  entry: { content: string | null; createdAt: number; retentionExpiresAt: number },
  now: number,
): FadeState {
  const remaining = entry.retentionExpiresAt - now;
  if (entry.content === null || remaining <= 0) {
    return { status: 'faded', opacity: MIN_CARD_OPACITY, daysLeft: 0 };
  }
  const daysLeft = Math.ceil(remaining / DAY_MS);
  const fadeFrom = entry.createdAt + FADE_START_MS;
  const span = entry.retentionExpiresAt - fadeFrom;
  const progress = span > 0 ? (now - fadeFrom) / span : 1;
  const opacity = Math.min(1, Math.max(MIN_CARD_OPACITY, 1 - progress * (1 - MIN_CARD_OPACITY)));
  if (remaining <= NEAR_EXPIRY_MS) {
    return { status: 'near_expiry', opacity, daysLeft };
  }
  if (now - entry.createdAt >= FADE_START_MS) {
    return { status: 'fading', opacity, daysLeft };
  }
  return { status: 'active', opacity: 1, daysLeft };
}
