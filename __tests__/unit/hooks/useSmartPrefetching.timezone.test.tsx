// @vitest-environment happy-dom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSmartPrefetching } from '@/lib/hooks/useSmartPrefetching';

const { getEventsByDateMock } = vi.hoisted(() => ({
  getEventsByDateMock: vi.fn(async () => ({ success: true, data: [] })),
}));

vi.mock('@/lib/hooks/useAuthQueryEnabled', () => ({
  useAuthQueryEnabled: () => ({ enabled: true }),
}));

vi.mock('@/lib/hooks/useUserTimezone', () => ({
  useUserTimezone: () => 'Europe/Istanbul',
}));

vi.mock('@/lib/hooks/usePrefetchData', () => ({
  usePrefetchData: () => ({
    prefetchRelatedData: vi.fn(),
    prefetchTodayEvents: vi.fn(),
  }),
}));

vi.mock('@/lib/services/eventService', () => ({
  eventService: {
    getEventsByDate: getEventsByDateMock,
    getUpcomingEvents: vi.fn(async () => ({ success: true, data: [] })),
  },
}));

vi.mock('@/lib/services/feedingScheduleService', () => ({
  feedingScheduleService: {
    getFeedingSchedulesByPetId: vi.fn(async () => ({ success: true, data: [] })),
    getActiveFeedingSchedules: vi.fn(async () => ({ success: true, data: [] })),
    getTodayFeedingSchedules: vi.fn(async () => ({ success: true, data: [] })),
  },
}));

describe('useSmartPrefetching timezone behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-04T19:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('prefetches tomorrow with timezone-scoped calendar key in evening', async () => {
    const getHoursSpy = vi.spyOn(Date.prototype, 'getHours').mockReturnValue(19);
    const { result } = renderHook(() => useSmartPrefetching());

    result.current.prefetchBasedOnTime();

    await Promise.resolve();
    await Promise.resolve();

    expect(getEventsByDateMock).toHaveBeenCalledWith('2026-02-05', 'Europe/Istanbul');
    getHoursSpy.mockRestore();
  });
});
