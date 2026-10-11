import { addDays } from '../date';
import { promptFor, PROMPTS_BY_TONE, WRITING_PROMPTS } from '../prompts';

describe('promptFor', () => {
  it('gives the same prompt all day', () => {
    expect(promptFor('2026-10-11')).toBe(promptFor('2026-10-11'));
  });

  it('changes from one day to the next', () => {
    expect(promptFor('2026-10-12')).not.toBe(promptFor('2026-10-11'));
  });

  it('steps through every prompt before repeating', () => {
    const seen = new Set(WRITING_PROMPTS.map((_, i) => promptFor('2026-10-11', i)));
    expect(seen.size).toBe(WRITING_PROMPTS.length);
    expect(promptFor('2026-10-11', WRITING_PROMPTS.length)).toBe(promptFor('2026-10-11'));
  });

  it('works for dates before the reference day', () => {
    expect(WRITING_PROMPTS.map((p) => p.text)).toContain(promptFor('2025-06-01'));
    expect(promptFor(addDays('2025-06-01', 1))).toBe(promptFor('2025-06-01', 1));
  });
});

describe('WRITING_PROMPTS', () => {
  it('holds all 60 questions once each', () => {
    const all = Object.values(PROMPTS_BY_TONE).flat();
    expect(all).toHaveLength(60);
    expect(new Set(all).size).toBe(60);
    expect(WRITING_PROMPTS).toHaveLength(60);
    for (const text of all) expect(text.endsWith('?')).toBe(true);
  });

  it('never shows three questions of the same tone in a row, even across the wrap', () => {
    const n = WRITING_PROMPTS.length;
    for (let i = 0; i < n; i++) {
      const tones = [0, 1, 2].map((k) => WRITING_PROMPTS[(i + k) % n].tone);
      expect(new Set(tones).size).toBeGreaterThan(1);
    }
  });
});
