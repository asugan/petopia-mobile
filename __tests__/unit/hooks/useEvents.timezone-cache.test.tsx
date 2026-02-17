// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCalendarEvents, useUpcomingEvents } from '@/lib/hooks/useEvents';
import { eventService } from '@/lib/services/eventService';

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
  it('refetches upcoming events when timezone changes', async () => {
    const { result, rerender } = renderHook(() => useUpcomingEvents());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(eventService.getUpcomingEvents).toHaveBeenCalledWith('Europe/Istanbul');
    expect(result.current.data?.[0]?._id).toBe('Europe/Istanbul-event');

    mockTimezone = 'America/New_York';
    rerender();

    await waitFor(() => {
      expect(eventService.getUpcomingEvents).toHaveBeenCalledWith('America/New_York');
      expect(result.current.data?.[0]?._id).toBe('America/New_York-event');
    });

    mockTimezone = 'Europe/Istanbul';
  });

  it('refetches calendar events with timezone-scoped key inputs', async () => {
    const { result, rerender } = renderHook(
      ({ timezone }) => useCalendarEvents('2026-02-12', { timezone }),
      { initialProps: { timezone: 'Europe/Istanbul' } }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(eventService.getEventsByDate).toHaveBeenCalledWith('2026-02-12', 'Europe/Istanbul');
    expect(result.current.data?.[0]?._id).toBe('Europe/Istanbul-calendar');

    rerender({ timezone: 'America/New_York' });

    await waitFor(() => {
      expect(eventService.getEventsByDate).toHaveBeenCalledWith(
        '2026-02-12',
        'America/New_York'
      );
      expect(result.current.data?.[0]?._id).toBe('America/New_York-calendar');
    });
  });
});
