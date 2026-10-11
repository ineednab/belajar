import { addDays } from '../date';
import { promptFor, WRITING_PROMPTS } from '../prompts';

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
    expect(WRITING_PROMPTS).toContain(promptFor('2025-06-01'));
    expect(promptFor(addDays('2025-06-01', 1))).toBe(promptFor('2025-06-01', 1));
  });
});

describe('WRITING_PROMPTS', () => {
  it('are unique questions', () => {
    expect(new Set(WRITING_PROMPTS).size).toBe(WRITING_PROMPTS.length);
    for (const prompt of WRITING_PROMPTS) expect(prompt.endsWith('?')).toBe(true);
  });
});
