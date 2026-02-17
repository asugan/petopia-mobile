import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetTodayEvents, mockGetUpcomingEvents } = vi.hoisted(() => ({
  mockGetTodayEvents: vi.fn(),
  mockGetUpcomingEvents: vi.fn(),
}));

vi.mock('@/lib/repositories/eventRepository', () => ({
  eventRepository: {
    getTodayEvents: mockGetTodayEvents,
    getUpcomingEvents: mockGetUpcomingEvents,
  },
}));

import { eventService } from '@/lib/services/eventService';

describe('eventService timezone forwarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTodayEvents.mockReturnValue([]);
    mockGetUpcomingEvents.mockReturnValue([]);
  });

  it('forwards timezone for today events', async () => {
    await eventService.getTodayEvents('Europe/Istanbul');

    expect(mockGetTodayEvents).toHaveBeenCalledWith('Europe/Istanbul');
  });

  it('forwards timezone for upcoming events', async () => {
    await eventService.getUpcomingEvents('America/New_York');

    expect(mockGetUpcomingEvents).toHaveBeenCalledWith('America/New_York');
  });

  it('calls repositories even without timezone', async () => {
    await eventService.getTodayEvents();
    await eventService.getUpcomingEvents();

    expect(mockGetTodayEvents).toHaveBeenCalledWith(undefined);
    expect(mockGetUpcomingEvents).toHaveBeenCalledWith(undefined);
  });
});
