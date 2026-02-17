// @vitest-environment happy-dom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePrefetchData } from '@/lib/hooks/usePrefetchData';

const { getTodayEventsMock, getEventsByDateMock } = vi.hoisted(() => ({
  getTodayEventsMock: vi.fn(async () => ({ success: true, data: [] })),
  getEventsByDateMock: vi.fn(async () => ({ success: true, data: [] })),
}));

vi.mock('@/lib/hooks/useAuthQueryEnabled', () => ({
  useAuthQueryEnabled: () => ({ enabled: true }),
}));

vi.mock('@/lib/hooks/useUserTimezone', () => ({
  useUserTimezone: () => 'Europe/Istanbul',
}));

vi.mock('@/lib/services/eventService', () => ({
  eventService: {
    getTodayEvents: getTodayEventsMock,
    getEventsByDate: getEventsByDateMock,
    getUpcomingEvents: vi.fn(async () => ({ success: true, data: [] })),
    getEventsByPetId: vi.fn(async () => ({ success: true, data: [] })),
  },
}));

vi.mock('@/lib/services/petService', () => ({
  petService: {
    getPetById: vi.fn(async () => ({ success: true, data: null })),
  },
}));

vi.mock('@/lib/services/healthRecordService', () => ({
  healthRecordService: {
    getHealthRecordsByPetId: vi.fn(async () => ({ success: true, data: [] })),
  },
}));

vi.mock('@/lib/services/feedingScheduleService', () => ({
  feedingScheduleService: {
    getFeedingSchedulesByPetId: vi.fn(async () => ({ success: true, data: [] })),
    getActiveFeedingSchedules: vi.fn(async () => ({ success: true, data: [] })),
  },
}));

describe('usePrefetchData timezone behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-04T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('prefetches calendar data using timezone-aware event service calls', async () => {
    const { result } = renderHook(() => usePrefetchData());

    result.current.prefetchForCalendarTab('2026-02-05');

    await Promise.resolve();
    await Promise.resolve();

    expect(getTodayEventsMock).toHaveBeenCalledWith('Europe/Istanbul');
    expect(getEventsByDateMock).toHaveBeenCalledWith('2026-02-05', 'Europe/Istanbul');
  });
});
