import {
  characterCount,
  hasErrors,
  normalizeProfileInput,
  resolveActiveProfileId,
  validateProfileInput,
  type ProfileInput,
} from '../profile';

const TODAY = '2026-10-11';
const base: ProfileInput = { name: 'V', icon: null, accentColor: null, noContactStartDate: null };

describe('validateProfileInput', () => {
  it('accepts a minimal profile', () => {
    expect(validateProfileInput(base, TODAY)).toEqual({});
  });

  it.each(['', '   ', '\n\t'])('requires a name (%j)', (name) => {
    expect(validateProfileInput({ ...base, name }, TODAY).name).toBe('Beri nama untuk Pudar ini.');
  });

  it('allows exactly 30 characters after trimming', () => {
    expect(validateProfileInput({ ...base, name: `  ${'x'.repeat(30)}  ` }, TODAY)).toEqual({});
  });

  it('rejects 31 characters', () => {
    expect(validateProfileInput({ ...base, name: 'x'.repeat(31) }, TODAY).name).toMatch(/30/);
  });

  it('counts an emoji as one character, like SQLite', () => {
    const name = '🌙'.repeat(30); // String.length is 60
    expect(characterCount(name)).toBe(30);
    expect(validateProfileInput({ ...base, name }, TODAY)).toEqual({});
  });

  it('accepts a start date of today or earlier', () => {
    expect(validateProfileInput({ ...base, noContactStartDate: TODAY }, TODAY)).toEqual({});
    expect(validateProfileInput({ ...base, noContactStartDate: '2025-01-01' }, TODAY)).toEqual({});
  });

  it('rejects a future or invalid start date', () => {
    expect(
      validateProfileInput({ ...base, noContactStartDate: '2026-10-12' }, TODAY).noContactStartDate,
    ).toMatch(/masa depan/);
    expect(
      validateProfileInput({ ...base, noContactStartDate: '2026-02-30' }, TODAY).noContactStartDate,
    ).toMatch(/tanggal yang benar/);
  });

  it('reports several problems at once', () => {
    const errors = validateProfileInput({ ...base, name: '', noContactStartDate: '2027-01-01' }, TODAY);
    expect(Object.keys(errors).sort()).toEqual(['name', 'noContactStartDate']);
    expect(hasErrors(errors)).toBe(true);
    expect(hasErrors({})).toBe(false);
  });
});

describe('normalizeProfileInput', () => {
  it('trims the name and keeps the rest', () => {
    expect(normalizeProfileInput({ ...base, name: '  A  ', icon: 'moon' })).toEqual({
      ...base,
      name: 'A',
      icon: 'moon',
    });
  });
});

describe('resolveActiveProfileId', () => {
  it('keeps the stored profile when it exists', () => {
    expect(resolveActiveProfileId(['a', 'b'], 'b')).toBe('b');
  });

  it('falls back to the first profile when the stored one is gone or unset', () => {
    expect(resolveActiveProfileId(['a', 'b'], 'deleted')).toBe('a');
    expect(resolveActiveProfileId(['a', 'b'], null)).toBe('a');
  });

  it('returns null when there are no profiles', () => {
    expect(resolveActiveProfileId([], 'a')).toBeNull();
  });
});
