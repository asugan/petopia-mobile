import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { dateRangeSchema } from '@/lib/schemas/core/dateSchemas';

describe('dateRangeSchema', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 15, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('accepts YYYY-MM-DD for today', () => {
    const result = dateRangeSchema({ maxYearsAgo: 10 }).safeParse('2025-01-15');

    expect(result.success).toBe(true);
  });

  it('rejects future YYYY-MM-DD', () => {
    const result = dateRangeSchema({ maxYearsAgo: 10 }).safeParse('2025-01-16');

    expect(result.success).toBe(false);
  });

  it('rejects dates older than maxYearsAgo', () => {
    const result = dateRangeSchema({ maxYearsAgo: 10 }).safeParse('2014-12-31');

    expect(result.success).toBe(false);
  });

  it('accepts Date object for today', () => {
    const result = dateRangeSchema({ maxYearsAgo: 10 }).safeParse(new Date(2025, 0, 15, 0, 0, 0));

    expect(result.success).toBe(true);
  });

  it('accepts ISO datetime earlier than now', () => {
    const earlierTodayIso = new Date(2025, 0, 15, 9, 0, 0).toISOString();
    const result = dateRangeSchema({ maxYearsAgo: 10 }).safeParse(earlierTodayIso);

    expect(result.success).toBe(true);
  });

  it('rejects invalid date string', () => {
    const result = dateRangeSchema({ maxYearsAgo: 10 }).safeParse('not-a-date');

    expect(result.success).toBe(false);
  });

  it('accepts future date when allowFuture is true', () => {
    const result = dateRangeSchema({ maxYearsAgo: 10, allowFuture: true }).safeParse('2025-01-16');

    expect(result.success).toBe(true);
  });

  it('handles late-day local time without treating today as future', () => {
    vi.setSystemTime(new Date(2025, 0, 15, 23, 30, 0));

    const result = dateRangeSchema({ maxYearsAgo: 10 }).safeParse('2025-01-15');

    expect(result.success).toBe(true);
  });
});
