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
