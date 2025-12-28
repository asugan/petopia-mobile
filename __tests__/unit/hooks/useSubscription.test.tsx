// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { useSubscriptionStore } from '@/stores/subscriptionStore';

vi.mock(
  'react-native-purchases',
  () => {
    const Purchases = {
      isConfigured: vi.fn().mockResolvedValue(true),
      getOfferings: vi.fn(),
      getCustomerInfo: vi.fn(),
      purchasePackage: vi.fn(),
      PURCHASES_ERROR_CODE: {
        PURCHASE_CANCELLED_ERROR: 'PURCHASE_CANCELLED_ERROR',
        PRODUCT_ALREADY_PURCHASED_ERROR: 'PRODUCT_ALREADY_PURCHASED_ERROR',
      },
    };

    return {
      default: Purchases,
    };
  },
  { virtual: true }
);

vi.mock(
  'react-native-purchases-ui',
  () => ({
    default: {
      presentPaywall: vi.fn(),
    },
    PAYWALL_RESULT: {
      PURCHASED: 'PURCHASED',
      RESTORED: 'RESTORED',
      CANCELLED: 'CANCELLED',
      NOT_PRESENTED: 'NOT_PRESENTED',
      ERROR: 'ERROR',
    },
  }),
  { virtual: true }
);

vi.mock(
  '@/lib/revenuecat/initialize',
  () => ({
    restorePurchases: vi.fn(),
  }),
  { virtual: true }
);

vi.mock(
  '@/lib/utils/alert',
  () => ({
    showAlert: vi.fn(),
  }),
  { virtual: true }
);

vi.mock(
  '@/lib/services/subscriptionApiService',
  () => ({
    subscriptionApiService: {
      getSubscriptionStatus: vi.fn(),
      startTrial: vi.fn(),
    },
  }),
  { virtual: true }
);

describe('useSubscription', () => {
  const createWrapper = () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });

    return ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client }, children);
  };

  beforeEach(() => {
    useSubscriptionStore.getState().resetSubscription();
  });

  it('keeps getOfferings stable when unrelated store state changes', () => {
    let childRenders = 0;

    const Child = React.memo(
      ({ onGetOfferings }: { onGetOfferings: () => Promise<unknown> }) => {
        childRenders += 1;
        return null;
      }
    );

    const Parent = () => {
      const { getOfferings } = useSubscription();
      return <Child onGetOfferings={getOfferings} />;
    };

    render(<Parent />, { wrapper: createWrapper() });

    expect(childRenders).toBe(1);

    act(() => {
      useSubscriptionStore.getState().setError('boom');
    });

    expect(childRenders).toBe(1);
  });
});
