import { describe, expect, it } from 'vitest';

import {
  dateOnlyToUTCMidnightISOString,
  extractISODatePart,
  extractISOTimePart,
  parseISODate,
  parseLocalDate,
  toLocalDateTimeInputValue,
} from '@/lib/utils/dateConversion';

describe('dateOnlyToUTCMidnightISOString', () => {
  it('maps YYYY-MM-DD to UTC midnight without day shift', () => {
    expect(dateOnlyToUTCMidnightISOString('2026-02-10')).toBe('2026-02-10T00:00:00.000Z');
  });

  it('throws for invalid calendar date', () => {
    expect(() => dateOnlyToUTCMidnightISOString('2026-02-30')).toThrow('Invalid date value');
  });
});

describe('parseLocalDate', () => {
  it('parses YYYY-MM-DD as local calendar date', () => {
    const parsed = parseLocalDate('2026-02-10');

    expect(parsed).not.toBeNull();
    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(1);
    expect(parsed?.getDate()).toBe(10);
    expect(parsed?.getHours()).toBe(0);
    expect(parsed?.getMinutes()).toBe(0);
  });

  it('returns null for invalid local date', () => {
    expect(parseLocalDate('2026-02-30')).toBeNull();
  });
});

describe('parseISODate', () => {
  it('uses local-date parsing for YYYY-MM-DD inputs', () => {
    const parsed = parseISODate('2026-02-10');

    expect(parsed).not.toBeNull();
    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(1);
    expect(parsed?.getDate()).toBe(10);
  });
});

describe('toLocalDateTimeInputValue', () => {
  it('formats date as YYYY-MM-DDTHH:MM in local time', () => {
    const date = new Date(2026, 1, 10, 14, 5, 0, 0);
    expect(toLocalDateTimeInputValue(date)).toBe('2026-02-10T14:05');
  });
});

describe('ISO part extractors', () => {
  it('extracts date and time from ISO datetime', () => {
    const value = '2026-02-10T14:05:00.000Z';
    expect(extractISODatePart(value)).toBe('2026-02-10');
    expect(extractISOTimePart(value)).toBe('14:05');
  });
});
