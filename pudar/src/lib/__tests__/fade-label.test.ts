import { fadeLabel } from '../fade-label';
import { MIN_CARD_OPACITY } from '../fading';

describe('fadeLabel', () => {
  it.each([
    [{ status: 'active', opacity: 1, daysLeft: 30 }, 'Baru', 'rose'],
    [{ status: 'fading', opacity: 0.8, daysLeft: 12 }, 'Pudar dalam 12 hari', 'peach'],
    [{ status: 'near_expiry', opacity: 0.45, daysLeft: 3 }, 'Hampir pudar · 3 hari lagi', 'peach'],
    [{ status: 'near_expiry', opacity: 0.41, daysLeft: 1 }, 'Hampir pudar · besok', 'peach'],
    [{ status: 'faded', opacity: MIN_CARD_OPACITY, daysLeft: 0 }, 'Sudah pudar', 'neutral'],
  ] as const)('labels %o', (state, text, tone) => {
    expect(fadeLabel(state)).toEqual({ text, tone });
  });
});
