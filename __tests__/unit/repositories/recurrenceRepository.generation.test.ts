import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/init', () => ({
  initDatabase: vi.fn(),
}));

vi.mock('@/lib/db/client', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        all: vi.fn(() => []),
        where: vi.fn(() => ({
          all: vi.fn(() => []),
          get: vi.fn(() => null),
        })),
      })),
    })),
    insert: vi.fn(() => ({ values: vi.fn(() => ({ run: vi.fn() })) })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ run: vi.fn() })) })) })),
    delete: vi.fn(() => ({ where: vi.fn(() => ({ run: vi.fn() })) })),
  },
}));

import { recurrenceGenerationUtils } from '@/lib/repositories/recurrenceRepository';
import type { RecurrenceRule } from '@/lib/schemas/recurrenceSchema';

const baseRule: RecurrenceRule = {
  _id: 'rule-1',
  userId: 'local-user',
  petId: 'pet-1',
  title: 'Daily meds',
  type: 'medication',
  reminder: true,
  reminderPreset: 'standard',
  frequency: 'daily',
  interval: 1,
  timezone: 'UTC',
  startDate: '2099-01-01T00:00:00.000Z',
  endDate: '2099-01-03',
  isActive: true,
  createdAt: '2099-01-01T00:00:00.000Z',
  updatedAt: '2099-01-01T00:00:00.000Z',
};

describe('recurrenceGenerationUtils', () => {
  it('generates occurrence date keys in expected range', () => {
    const keys = recurrenceGenerationUtils.generateOccurrenceDateKeys(baseRule);

    expect(keys).toEqual(['2099-01-01', '2099-01-02', '2099-01-03']);
  });

  it('skips exception dates while generating event start times', () => {
    const withExceptions: RecurrenceRule = {
      ...baseRule,
      dailyTimes: ['09:00'],
      exceptionDates: ['2099-01-02'],
    };

    const times = recurrenceGenerationUtils.generateEventStartTimes(withExceptions);

    expect(times).toEqual([
      '2099-01-01T09:00:00.000Z',
      '2099-01-03T09:00:00.000Z',
    ]);
  });
});
