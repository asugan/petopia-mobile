// @vitest-environment happy-dom
import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePrefetchData } from '@/lib/hooks/usePrefetchData';
import { eventKeys } from '@/lib/hooks/queryKeys';

vi.mock('@/lib/hooks/useAuthQueryEnabled', () => ({
  useAuthQueryEnabled: () => ({ enabled: true }),
}));

vi.mock('@/lib/hooks/useUserTimezone', () => ({
  useUserTimezone: () => 'Europe/Istanbul',
}));

describe('usePrefetchData timezone behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-04T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses timezone-scoped key for calendar prefetch date', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const prefetchSpy = vi
      .spyOn(client, 'prefetchQuery')
      .mockResolvedValue(undefined as never);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => usePrefetchData(), { wrapper });

    result.current.prefetchForCalendarTab('2026-02-05');

    expect(prefetchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: eventKeys.todayScoped('Europe/Istanbul') })
    );
    expect(prefetchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: eventKeys.calendarScoped('2026-02-05', 'Europe/Istanbul'),
      })
    );
  });
});
