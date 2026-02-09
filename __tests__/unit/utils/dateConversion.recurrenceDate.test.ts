import { describe, expect, it } from 'vitest';

import { dateOnlyToUTCMidnightISOString } from '@/lib/utils/dateConversion';

describe('dateOnlyToUTCMidnightISOString', () => {
  it('maps YYYY-MM-DD to UTC midnight without day shift', () => {
    expect(dateOnlyToUTCMidnightISOString('2026-02-10')).toBe('2026-02-10T00:00:00.000Z');
  });

  it('throws for invalid calendar date', () => {
    expect(() => dateOnlyToUTCMidnightISOString('2026-02-30')).toThrow('Invalid date value');
  });
});
