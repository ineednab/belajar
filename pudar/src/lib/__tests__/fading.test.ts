import {
  FADE_START_MS,
  getFadeState,
  MIN_CARD_OPACITY,
  NEAR_EXPIRY_MS,
  RETENTION_MS,
  retentionExpiresAt,
} from '../fading';

const DAY = 24 * 60 * 60 * 1000;
const T0 = 1_760_000_000_000;
const entry = { content: 'hi', createdAt: T0, retentionExpiresAt: retentionExpiresAt(T0) };
const at = (offset: number) => getFadeState(entry, T0 + offset);

describe('getFadeState', () => {
  it('is active and fully opaque for the first 24 hours', () => {
    expect(at(0)).toEqual({ status: 'active', opacity: 1, daysLeft: 30 });
    expect(at(FADE_START_MS - 1).status).toBe('active');
  });

  it('starts fading at exactly 24 hours', () => {
    expect(at(FADE_START_MS)).toEqual({ status: 'fading', opacity: 1, daysLeft: 29 });
  });

  it('is near expiry with exactly 3 days left', () => {
    expect(at(RETENTION_MS - NEAR_EXPIRY_MS - 1).status).toBe('fading');
    expect(at(RETENTION_MS - NEAR_EXPIRY_MS)).toMatchObject({ status: 'near_expiry', daysLeft: 3 });
  });

  it('is faded at exactly the deadline, and whenever the text is gone', () => {
    expect(at(RETENTION_MS - 1)).toMatchObject({ status: 'near_expiry', daysLeft: 1 });
    expect(at(RETENTION_MS)).toEqual({ status: 'faded', opacity: MIN_CARD_OPACITY, daysLeft: 0 });
    expect(getFadeState({ ...entry, content: null }, T0)).toMatchObject({ status: 'faded' });
  });

  it('lowers opacity linearly from 1.0 to the 0.4 floor', () => {
    const midpoint = FADE_START_MS + (RETENTION_MS - FADE_START_MS) / 2;
    expect(at(midpoint).opacity).toBeCloseTo(0.7);
    expect(at(RETENTION_MS - 1).opacity).toBeCloseTo(MIN_CARD_OPACITY, 5);
    expect(at(RETENTION_MS * 2).opacity).toBe(MIN_CARD_OPACITY);
  });

  it('rounds days left up', () => {
    expect(at(12 * DAY + 1).daysLeft).toBe(18);
    expect(at(12 * DAY).daysLeft).toBe(18);
  });

  it('treats a clock set before createdAt as active, not broken', () => {
    expect(at(-DAY)).toEqual({ status: 'active', opacity: 1, daysLeft: 31 });
  });
});
