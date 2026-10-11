import {
  addDays,
  compareLocalDates,
  diffCalendarDays,
  isValidLocalDate,
  localDateToDate,
  noContactDays,
  toLocalDate,
  todayLocal,
  weekContaining,
  weekStartsOnFromLocale,
} from '../date';

// These tests run once per timezone via `npm run test:tz` (scripts/test-tz.mjs).
const currentZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

describe('timezone setup', () => {
  it('runs in the timezone requested by TZ', () => {
    if (process.env.TZ) {
      expect(currentZone).toBe(process.env.TZ);
    }
  });
});

describe('isValidLocalDate', () => {
  it.each(['2026-10-11', '2028-02-29', '2000-02-29', '0001-01-01', '9999-12-31'])(
    'accepts %s',
    (value) => {
      expect(isValidLocalDate(value)).toBe(true);
    },
  );

  it.each([
    '2026-02-29', // not a leap year
    '2100-02-29', // century, not divisible by 400
    '2026-13-01',
    '2026-00-10',
    '2026-04-31',
    '2026-10-00',
    '2026-1-01',
    '26-10-11',
    '2026-10-11T00:00',
    ' 2026-10-11',
    '',
  ])('rejects %j', (value) => {
    expect(isValidLocalDate(value)).toBe(false);
  });
});

describe('toLocalDate / todayLocal', () => {
  it('rejects an invalid Date', () => {
    expect(() => toLocalDate(new Date('nope'))).toThrow(RangeError);
  });

  it('uses the local calendar components', () => {
    expect(toLocalDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(toLocalDate(new Date(2026, 11, 31, 0, 0))).toBe('2026-12-31');
  });

  const expectedByZone: Record<string, [string, string]> = {
    // [at 2026-10-10T10:30Z, at 2026-10-10T17:30Z]
    UTC: ['2026-10-10', '2026-10-10'],
    'Asia/Jakarta': ['2026-10-10', '2026-10-11'],
    'America/New_York': ['2026-10-10', '2026-10-10'],
    'America/Santiago': ['2026-10-10', '2026-10-10'],
    'Australia/Lord_Howe': ['2026-10-10', '2026-10-11'],
    'Pacific/Kiritimati': ['2026-10-11', '2026-10-11'],
  };
  const expected = expectedByZone[currentZone];

  (expected ? it : it.skip)(`maps instants to the right day in ${currentZone}`, () => {
    expect(todayLocal(new Date('2026-10-10T10:30:00Z'))).toBe(expected[0]);
    expect(todayLocal(new Date('2026-10-10T17:30:00Z'))).toBe(expected[1]);
  });

  it('never skips or repeats out of order a calendar day across a full year (DST included)', () => {
    const HOUR = 60 * 60 * 1000;
    const start = new Date(2026, 0, 1, 0, 30).getTime();
    const end = new Date(2027, 0, 1, 0, 30).getTime();
    let previous = toLocalDate(new Date(start));
    const seen = new Set([previous]);

    for (let t = start + HOUR; t <= end; t += HOUR) {
      const current = toLocalDate(new Date(t));
      const step = diffCalendarDays(previous, current);
      if (step !== 0 && step !== 1) {
        throw new Error(`Jump of ${step} days at ${new Date(t).toISOString()}: ${previous} → ${current}`);
      }
      seen.add(current);
      previous = current;
    }
    expect(seen.size).toBe(366); // every day of 2026 plus 2027-01-01
  });
});

describe('diffCalendarDays', () => {
  it.each([
    ['2026-10-11', '2026-10-11', 0],
    ['2026-10-10', '2026-10-11', 1],
    ['2026-10-11', '2026-10-10', -1],
    ['2026-01-31', '2026-02-01', 1],
    ['2026-12-31', '2027-01-01', 1],
    ['2028-02-28', '2028-03-01', 2], // leap year
    ['2026-02-28', '2026-03-01', 1],
    ['2026-03-07', '2026-03-09', 2], // US DST starts 2026-03-08
    ['2026-10-31', '2026-11-02', 2], // US DST ends 2026-11-01
    ['2026-04-04', '2026-04-06', 2], // Chile/Lord Howe DST ends 2026-04-05
    ['2026-01-01', '2027-01-01', 365],
    ['2028-01-01', '2029-01-01', 366],
  ])('%s → %s = %i', (from, to, days) => {
    expect(diffCalendarDays(from, to)).toBe(days);
  });

  it('throws on invalid input', () => {
    expect(() => diffCalendarDays('2026-02-30', '2026-03-01')).toThrow(RangeError);
  });
});

describe('addDays', () => {
  it.each([
    ['2026-10-11', 0, '2026-10-11'],
    ['2026-10-11', 1, '2026-10-12'],
    ['2026-10-11', -11, '2026-09-30'],
    ['2026-12-31', 1, '2027-01-01'],
    ['2027-01-01', -1, '2026-12-31'],
    ['2028-02-28', 1, '2028-02-29'],
    ['2026-02-28', 1, '2026-03-01'],
    ['2026-03-07', 2, '2026-03-09'],
    ['2026-10-11', 30, '2026-11-10'],
  ])('%s + %i = %s', (date, days, result) => {
    expect(addDays(date, days)).toBe(result);
  });

  it('is the inverse of diffCalendarDays', () => {
    for (let n = -400; n <= 400; n += 7) {
      expect(diffCalendarDays('2026-10-11', addDays('2026-10-11', n))).toBe(n);
    }
  });

  it('rejects non-integer offsets and invalid dates', () => {
    expect(() => addDays('2026-10-11', 0.5)).toThrow(RangeError);
    expect(() => addDays('2026-10-32', 1)).toThrow(RangeError);
  });
});

describe('compareLocalDates', () => {
  it('orders dates', () => {
    expect(compareLocalDates('2026-10-10', '2026-10-11')).toBe(-1);
    expect(compareLocalDates('2026-10-11', '2026-10-11')).toBe(0);
    expect(compareLocalDates('2027-01-01', '2026-12-31')).toBe(1);
  });
});

describe('weekContaining', () => {
  it('starts on Monday when weekStartsOn = 1', () => {
    // 2026-10-10 is a Saturday
    expect(weekContaining('2026-10-10', 1)).toEqual([
      '2026-10-05',
      '2026-10-06',
      '2026-10-07',
      '2026-10-08',
      '2026-10-09',
      '2026-10-10',
      '2026-10-11',
    ]);
  });

  it('starts on Sunday when weekStartsOn = 0', () => {
    expect(weekContaining('2026-10-10', 0)[0]).toBe('2026-10-04');
    expect(weekContaining('2026-10-11', 0)[0]).toBe('2026-10-11');
  });

  it('spans a year boundary', () => {
    expect(weekContaining('2026-12-31', 1)).toEqual([
      '2026-12-28',
      '2026-12-29',
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
      '2027-01-03',
    ]);
  });

  it('always contains the date itself', () => {
    for (let start = 0; start <= 6; start++) {
      for (let n = 0; n < 7; n++) {
        const date = addDays('2026-10-05', n);
        expect(weekContaining(date, start)).toContain(date);
      }
    }
  });

  it('rejects an invalid week start', () => {
    expect(() => weekContaining('2026-10-11', 7)).toThrow(RangeError);
  });
});

describe('noContactDays', () => {
  it('counts elapsed calendar days', () => {
    expect(noContactDays('2026-10-11', '2026-10-11')).toBe(0);
    expect(noContactDays('2026-10-02', '2026-10-11')).toBe(9);
    expect(noContactDays('2026-09-11', '2026-10-11')).toBe(30);
  });

  it('treats a future start date as 0', () => {
    expect(noContactDays('2026-10-12', '2026-10-11')).toBe(0);
  });
});

describe('localDateToDate', () => {
  it('round-trips through toLocalDate for every day of a year (DST included)', () => {
    for (let n = 0; n < 366; n++) {
      const date = addDays('2026-01-01', n);
      expect(toLocalDate(localDateToDate(date))).toBe(date);
    }
  });

  it('rejects invalid dates', () => {
    expect(() => localDateToDate('2026-02-30')).toThrow(RangeError);
  });
});

describe('weekStartsOnFromLocale', () => {
  it('maps 1–7 (Sunday first) to 0–6', () => {
    expect(weekStartsOnFromLocale(1)).toBe(0);
    expect(weekStartsOnFromLocale(2)).toBe(1);
    expect(weekStartsOnFromLocale(7)).toBe(6);
  });

  it('falls back to Monday', () => {
    expect(weekStartsOnFromLocale(null)).toBe(1);
    expect(weekStartsOnFromLocale(undefined)).toBe(1);
    expect(weekStartsOnFromLocale(0)).toBe(1);
  });
});
