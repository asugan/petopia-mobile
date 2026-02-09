import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}));

vi.mock('@/lib/api/client', () => ({
  api: {
    get: mockGet,
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    code?: string;
    status?: number;
  },
}));

import { eventService } from '@/lib/services/eventService';

describe('eventService timezone query params', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: [] });
  });

  it('sends timezone query for today endpoint', async () => {
    await eventService.getTodayEvents('Europe/Istanbul');

    expect(mockGet).toHaveBeenCalledWith('/api/events/today?timezone=Europe%2FIstanbul');
  });

  it('sends timezone query for upcoming endpoint', async () => {
    await eventService.getUpcomingEvents('America/New_York');

    expect(mockGet).toHaveBeenCalledWith('/api/events/upcoming?timezone=America%2FNew_York');
  });

  it('keeps old endpoint format when timezone is absent', async () => {
    await eventService.getTodayEvents();
    await eventService.getUpcomingEvents();

    expect(mockGet).toHaveBeenNthCalledWith(1, '/api/events/today');
    expect(mockGet).toHaveBeenNthCalledWith(2, '/api/events/upcoming');
  });
});
