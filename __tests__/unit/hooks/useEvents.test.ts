// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useEvents } from '@/lib/hooks/useEvents';
import { eventService } from '@/lib/services/eventService';
import type { Event } from '@/lib/types';

vi.mock('@/lib/services/eventService', () => ({
  eventService: {
    getEventsByPetId: vi.fn(),
  },
}));

const createEvent = (overrides: Partial<Event> = {}): Event => ({
  _id: '507f1f77bcf86cd799439011',
  petId: '507f1f77bcf86cd799439012',
  title: 'Vet Visit',
  type: 'vet_visit',
  status: 'upcoming',
  startTime: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe('useEvents', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches events by petId', async () => {
    const petId = '507f1f77bcf86cd799439012';
    const events = [createEvent({ petId })];
    (eventService.getEventsByPetId as unknown as { mockResolvedValue: (v: unknown) => void })
      .mockResolvedValue({
        success: true,
        data: events,
      });

    const { result } = renderHook(() => useEvents(petId));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(events);
    expect(eventService.getEventsByPetId).toHaveBeenCalledWith(petId);
  });
});
