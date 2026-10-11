import { formatCountdown } from '../countdown';

describe('formatCountdown', () => {
  it('shows minutes and two-digit seconds', () => {
    expect(formatCountdown(600)).toBe('10:00');
    expect(formatCountdown(65)).toBe('1:05');
    expect(formatCountdown(9)).toBe('0:09');
  });

  it('rounds partial seconds up', () => {
    expect(formatCountdown(598.2)).toBe('9:59');
    expect(formatCountdown(0.1)).toBe('0:01');
  });

  it('never goes below zero', () => {
    expect(formatCountdown(0)).toBe('0:00');
    expect(formatCountdown(-30)).toBe('0:00');
  });
});
