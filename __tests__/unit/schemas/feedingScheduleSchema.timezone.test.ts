import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('/home/asugan/Projects/petopia-mobile/constants/index.ts', () => ({
  DAYS_OF_WEEK: {
    MONDAY: 'monday',
    TUESDAY: 'tuesday',
    WEDNESDAY: 'wednesday',
    THURSDAY: 'thursday',
    FRIDAY: 'friday',
    SATURDAY: 'saturday',
    SUNDAY: 'sunday',
  },
  FOOD_TYPES: {
    DRY_FOOD: 'dry_food',
    WET_FOOD: 'wet_food',
    RAW_FOOD: 'raw_food',
    HOMEMADE: 'homemade',
    TREATS: 'treats',
    SUPPLEMENTS: 'supplements',
    OTHER: 'other',
  },
}));

import {
  getNextFeedingTime,
  getPreviousFeedingTime,
} from '@/lib/schemas/feedingScheduleSchema';

describe('feedingScheduleSchema timezone helpers', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns next feeding on next day in Europe/Istanbul', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-04T21:30:00.000Z')); // Thu 00:30 Istanbul

    const next = getNextFeedingTime(
      [{ time: '09:00', days: 'thursday', isActive: true }],
      'Europe/Istanbul'
    );

    expect(next?.toISOString()).toBe('2026-02-05T06:00:00.000Z');
  });

  it('returns previous feeding from same local day in Europe/Istanbul', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-04T10:30:00.000Z')); // Wed 13:30 Istanbul

    const previous = getPreviousFeedingTime(
      [{ time: '12:00', days: 'wednesday', isActive: true }],
      'Europe/Istanbul'
    );

    expect(previous?.toISOString()).toBe('2026-02-04T09:00:00.000Z');
  });

  it('handles DST day when computing next feeding in Europe/Berlin', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-29T00:30:00.000Z'));

    const next = getNextFeedingTime(
      [{ time: '08:00', days: 'sunday', isActive: true }],
      'Europe/Berlin'
    );

    expect(next?.toISOString()).toBe('2026-03-29T06:00:00.000Z');
  });
});
