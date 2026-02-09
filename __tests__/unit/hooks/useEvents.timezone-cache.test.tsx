// @vitest-environment happy-dom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCalendarEvents, useUpcomingEvents } from '@/lib/hooks/useEvents';
import { eventService } from '@/lib/services/eventService';
import { eventKeys } from '@/lib/hooks/queryKeys';

let mockTimezone = 'Europe/Istanbul';

vi.mock('@/lib/hooks/useAuthQueryEnabled', () => ({
  useAuthQueryEnabled: () => ({ enabled: true }),
}));

vi.mock('@/lib/hooks/useUserTimezone', () => ({
  useUserTimezone: () => mockTimezone,
}));

vi.mock('@/lib/services/eventService', () => ({
  eventService: {
    getUpcomingEvents: vi.fn(async (timezone?: string) => ({
      success: true,
      data: [
        {
          _id: `${timezone}-event`,
          petId: '507f1f77bcf86cd799439012',
          title: 'Upcoming',
          type: 'feeding',
          startTime: '2026-02-12T10:00:00.000Z',
          createdAt: '2026-02-01T00:00:00.000Z',
          updatedAt: '2026-02-01T00:00:00.000Z',
        },
      ],
    })),
    getEventsByDate: vi.fn(async (_date: string, timezone?: string) => ({
      success: true,
      data: [
        {
          _id: `${timezone}-calendar`,
          petId: '507f1f77bcf86cd799439012',
          title: 'Calendar',
          type: 'feeding',
          startTime: '2026-02-12T10:00:00.000Z',
          createdAt: '2026-02-01T00:00:00.000Z',
          updatedAt: '2026-02-01T00:00:00.000Z',
        },
      ],
    })),
  },
}));

describe('useUpcomingEvents timezone cache behavior', () => {
  it('scopes cache by timezone and invalidates legacy key on timezone change', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result, rerender } = renderHook(() => useUpcomingEvents(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(eventService.getUpcomingEvents).toHaveBeenCalledWith('Europe/Istanbul');
    expect(result.current.data?.[0]?._id).toBe('Europe/Istanbul-event');

    mockTimezone = 'America/New_York';
    rerender();

    await waitFor(() => {
      expect(eventService.getUpcomingEvents).toHaveBeenCalledWith('America/New_York');
    });

    const nyData = queryClient.getQueryData(eventKeys.upcomingScoped('America/New_York')) as
      | Array<{ _id: string }>
      | undefined;
    expect(nyData?.[0]?._id).toBe('America/New_York-event');

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: eventKeys.upcoming() });

    mockTimezone = 'Europe/Istanbul';
  });

  it('invalidates legacy calendar key while using timezone-scoped calendar key', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result, rerender } = renderHook(
      ({ timezone }) => useCalendarEvents('2026-02-12', { timezone }),
      { wrapper, initialProps: { timezone: 'Europe/Istanbul' } }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(eventService.getEventsByDate).toHaveBeenCalledWith('2026-02-12', 'Europe/Istanbul');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: eventKeys.calendar('2026-02-12') });

    rerender({ timezone: 'America/New_York' });

    await waitFor(() => {
      expect(eventService.getEventsByDate).toHaveBeenCalledWith(
        '2026-02-12',
        'America/New_York'
      );
    });

    const nyData = queryClient.getQueryData(
      eventKeys.calendarScoped('2026-02-12', 'America/New_York')
    ) as Array<{ _id: string }> | undefined;

    expect(nyData?.[0]?._id).toBe('America/New_York-calendar');
  });
});
