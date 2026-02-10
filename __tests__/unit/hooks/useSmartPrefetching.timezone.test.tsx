// @vitest-environment happy-dom
import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSmartPrefetching } from '@/lib/hooks/useSmartPrefetching';
import { eventKeys } from '@/lib/hooks/queryKeys';

vi.mock('@/lib/hooks/useAuthQueryEnabled', () => ({
  useAuthQueryEnabled: () => ({ enabled: true }),
}));

vi.mock('@/lib/hooks/useUserTimezone', () => ({
  useUserTimezone: () => 'Europe/Istanbul',
}));

vi.mock('@/lib/hooks/usePrefetchData', () => ({
  usePrefetchData: () => ({
    prefetchRelatedData: vi.fn(),
  }),
}));

describe('useSmartPrefetching timezone behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-04T16:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('prefetches tomorrow with timezone-scoped calendar key in evening', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const prefetchSpy = vi
      .spyOn(client, 'prefetchQuery')
      .mockResolvedValue(undefined as never);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useSmartPrefetching(), { wrapper });

    result.current.prefetchBasedOnTime();

    expect(prefetchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: eventKeys.calendarScoped('2026-02-05', 'Europe/Istanbul'),
      })
    );
  });
});
