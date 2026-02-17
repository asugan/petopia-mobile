// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, render } from '@testing-library/react';
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
  }
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
  })
);

vi.mock(
  '@/lib/revenuecat/initialize',
  () => ({
    restorePurchases: vi.fn(),
  })
);

vi.mock(
  '@/lib/utils/alert',
  () => ({
    showAlert: vi.fn(),
  })
);

vi.mock(
  '@/lib/services/subscriptionService',
  () => ({
    subscriptionService: {
      getSubscriptionStatus: vi.fn(async () => ({
        success: true,
        data: {
          hasActiveSubscription: false,
          subscriptionType: null,
          tier: null,
          expiresAt: null,
          daysRemaining: 0,
          isExpired: false,
          isCancelled: false,
          canStartTrial: true,
          provider: null,
        },
      })),
      startTrial: vi.fn(async () => ({ success: true, data: { success: true, subscription: null } })),
    },
  })
);

describe('useSubscription', () => {
  type WrapperProps = { children: React.ReactNode };
  type ChildProps = { onGetOfferings: () => Promise<unknown> };

  const createWrapper = () => ({ children }: WrapperProps) => <>{children}</>;

  beforeEach(() => {
    useSubscriptionStore.getState().resetSubscription();
  });

  it('keeps getOfferings stable when unrelated store state changes', async () => {
    let childRenders = 0;

    const Child = React.memo(({ onGetOfferings }: ChildProps) => {
        childRenders += 1;
        return null;
      });

    const Parent = () => {
      const { getOfferings } = useSubscription();
      return <Child onGetOfferings={getOfferings} />;
    };

    await act(async () => {
      render(<Parent />, { wrapper: createWrapper() });
      await Promise.resolve();
    });

    expect(childRenders).toBe(1);

    act(() => {
      useSubscriptionStore.getState().setError('boom');
    });

    expect(childRenders).toBe(1);
  });
});
