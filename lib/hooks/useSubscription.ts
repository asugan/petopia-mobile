import { useCallback, useState } from 'react';
import Purchases from 'react-native-purchases';
import type {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
} from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { useTranslation } from 'react-i18next';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import {
  useComputedSubscriptionStatus,
  useRefetchSubscriptionStatus,
  useVerifySubscriptionStatus,
} from './useSubscriptionQueries';
import { getRevenueCatEntitlementIdOptional } from '@/lib/revenuecat/config';
import { showToast } from '@/lib/toast/showToast';
import { useTracking } from '@/lib/posthog';
import { SUBSCRIPTION_EVENTS } from '@/lib/posthog/subscriptionEvents';
import type { SubscriptionEventProperties } from '@/lib/posthog/subscriptionEvents';

export type SubscriptionStatusType = 'pro' | 'free';

export interface UseSubscriptionReturn {
  // Status (computed from local + RevenueCat state)
  isProUser: boolean;
  isSubscribed: boolean;
  isPaidSubscription: boolean;
  isExpired: boolean;
  isCancelled: boolean;
  daysRemaining: number;
  subscriptionStatus: SubscriptionStatusType;
  provider: 'revenuecat' | null;
  tier: string | null;

  // Customer Info (for RevenueCat operations)
  customerInfo: CustomerInfo | null;
  activeEntitlements: string[];
  expirationDate: string | null;
  willRenew: boolean;
  productIdentifier: string | null;

  // Loading states
  isInitialized: boolean;
  isLoading: boolean;
  isVerifyingStatus: boolean;
  error: string | null;

  // Actions
  presentCustomerCenter: () => Promise<void>;
  restorePurchases: (context?: SubscriptionActionContext) => Promise<boolean>;
  purchasePackage: (pkg: PurchasesPackage, context?: SubscriptionActionContext) => Promise<boolean>;
  getOfferings: () => Promise<PurchasesOfferings | null>;
  checkEntitlement: (entitlementId?: string) => boolean;
  refreshSubscriptionStatus: () => void;
}

export interface SubscriptionActionContext {
  screen?: string;
  source?: string;
}

export function useSubscription(): UseSubscriptionReturn {
  const { t } = useTranslation();
  const { trackEvent } = useTracking();
  const [isVerifyingStatus, setIsVerifyingStatus] = useState(false);
  const {
    customerInfo,
    isInitialized,
    isLoading,
    isPurchasing,
    error,
    purchasePackage: storePurchasePackage,
    restorePurchases: storeRestorePurchases,
    fetchOfferings,
    checkEntitlement,
    willRenew,
  } = useSubscriptionStore();

  const {
    isLoading: isQueryLoading,
    error: queryError,
    isProUser,
    isPaidSubscription,
    isExpired,
    isCancelled,
    daysRemaining,
    expirationDate,
    provider,
    tier,
    subscriptionStatus: subscriptionStatusType,
  } = useComputedSubscriptionStatus();

  const refetchStatusMutation = useRefetchSubscriptionStatus();
  const verifyStatusMutation = useVerifySubscriptionStatus();

  const isSubscribed = isProUser;

  const activeEntitlements = customerInfo
    ? Object.keys(customerInfo.entitlements.active)
    : [];

  const entitlementId = getRevenueCatEntitlementIdOptional();

  const trackSubscriptionEvent = useCallback(
    (eventName: string, context?: SubscriptionActionContext, extra?: SubscriptionEventProperties) => {
      trackEvent(eventName, {
        screen: context?.screen ?? null,
        source: context?.source ?? null,
        is_pro: isProUser,
        provider: provider ?? null,
        tier: tier ?? null,
        ...extra,
      });
    },
    [isProUser, provider, tier, trackEvent]
  );

  const productIdentifier =
    entitlementId && customerInfo?.entitlements.active[entitlementId]
      ? customerInfo.entitlements.active[entitlementId].productIdentifier ?? null
      : null;

  const ensureRevenueCatReady = useCallback(async (): Promise<boolean> => {
    if (isInitialized) return true;

    try {
      const configured = await Purchases.isConfigured();
      if (configured) return true;
    } catch {
    }

    showToast({
      type: 'error',
      title: t('common.error'),
      message: t('subscription.notInitialized', 'Subscription system is not ready yet.'),
    });
    return false;
  }, [isInitialized, t]);

  const verifyThenPollSubscriptionStatus = useCallback(
    async (context?: SubscriptionActionContext): Promise<boolean> => {
      const maxAttempts = 10;
      const intervalMs = 2000;

      setIsVerifyingStatus(true);

      try {
        try {
          const verifyResult = await verifyStatusMutation.mutateAsync();
          if (verifyResult.success && verifyResult.data?.hasActiveSubscription) {
            return true;
          }
        } catch {
        }

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          const response = await refetchStatusMutation.mutateAsync();
          if (response.success && response.data?.hasActiveSubscription) {
            return true;
          }

          if (attempt < maxAttempts - 1) {
            await new Promise((resolve) => setTimeout(resolve, intervalMs));
          }
        }

        trackSubscriptionEvent(SUBSCRIPTION_EVENTS.PAYWALL_CLOSE, context, {
          reason: 'verification_timeout',
        });

        showToast({
          type: 'info',
          title: t('common.info', 'Info'),
          message: t(
            'subscription.verificationTakingLong',
            'Your purchase is being verified. Access will unlock automatically in a few seconds.'
          ),
        });

        return false;
      } finally {
        setIsVerifyingStatus(false);
      }
    },
    [refetchStatusMutation, t, trackSubscriptionEvent, verifyStatusMutation]
  );

  const presentCustomerCenter = useCallback(async (): Promise<void> => {
    try {
      if (!(await ensureRevenueCatReady())) return;

      await RevenueCatUI.presentCustomerCenter({
        callbacks: {
          onRestoreStarted: () => {
          },
          onRestoreCompleted: async ({ customerInfo }) => {
          },
          onRestoreFailed: ({ error }) => {
            showToast({
              type: 'error',
              title: t('common.error'),
              message: error.message,
            });
          },
          onShowingManageSubscriptions: () => {
          },
          onFeedbackSurveyCompleted: ({ feedbackSurveyOptionId }) => {
          },
        },
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: t('common.error'),
        message: (error as Error).message,
      });
    }
  }, [ensureRevenueCatReady, t]);

  const getOfferingsForPaywall = useCallback(async (): Promise<PurchasesOfferings | null> => {
    if (!(await ensureRevenueCatReady())) return null;
    return fetchOfferings();
  }, [ensureRevenueCatReady, fetchOfferings]);

  const purchasePackage = useCallback(
    async (pkg: PurchasesPackage, context?: SubscriptionActionContext): Promise<boolean> => {
      if (!(await ensureRevenueCatReady())) return false;

      trackSubscriptionEvent(SUBSCRIPTION_EVENTS.PURCHASE_STARTED, context, {
        trigger: 'custom_paywall',
        package_id: pkg.identifier,
        product_id: pkg.product.identifier,
      });

      try {
        const purchased = await storePurchasePackage(pkg);

        if (!purchased) {
          trackSubscriptionEvent(SUBSCRIPTION_EVENTS.PAYWALL_CLOSE, context, {
            reason: 'cancelled_or_failed',
            package_id: pkg.identifier,
          });
          return false;
        }

        showToast({
          type: 'info',
          title: t('common.info', 'Info'),
          message: t('subscription.verifyingPurchase', 'Purchase received. Verifying your subscription...'),
        });

        const verified = await verifyThenPollSubscriptionStatus(context);

        trackSubscriptionEvent(
          verified ? SUBSCRIPTION_EVENTS.PURCHASE_SUCCESS : SUBSCRIPTION_EVENTS.PURCHASE_FAILED,
          context,
          {
            reason: verified ? undefined : 'verification_timeout',
            package_id: pkg.identifier,
            product_id: pkg.product.identifier,
          }
        );

        return verified;
      } catch (error) {
        trackSubscriptionEvent(SUBSCRIPTION_EVENTS.PURCHASE_FAILED, context, {
          reason: 'exception',
          error_message: (error as Error).message,
          package_id: pkg.identifier,
          product_id: pkg.product.identifier,
        });
        showToast({
          type: 'error',
          title: t('common.error'),
          message: (error as Error).message,
        });
        return false;
      }
    },
    [ensureRevenueCatReady, storePurchasePackage, t, trackSubscriptionEvent, verifyThenPollSubscriptionStatus]
  );

  const refreshSubscriptionStatus = useCallback(() => {
    refetchStatusMutation.mutate();
  }, [refetchStatusMutation]);

  const willRenewValue = willRenew();

  return {
    // Status
    isProUser,
    isSubscribed,
    isPaidSubscription,
    isExpired,
    isCancelled,
    daysRemaining,
    subscriptionStatus: subscriptionStatusType,
    provider,
    tier,

    // Customer Info
    customerInfo,
    activeEntitlements,
    expirationDate,
    willRenew: willRenewValue,
    productIdentifier,

    // Loading
    isInitialized,
    isLoading: isLoading || isPurchasing || isQueryLoading || isVerifyingStatus,
    isVerifyingStatus,
    error: error || (queryError ? queryError.message : null),

    // Actions
    presentCustomerCenter,
    restorePurchases: async (context?: SubscriptionActionContext) => {
      trackSubscriptionEvent(SUBSCRIPTION_EVENTS.RESTORE_CLICK, context);
      const restored = await storeRestorePurchases();
      if (restored) {
        showToast({
          type: 'info',
          title: t('common.info', 'Info'),
          message: t('subscription.verifyingPurchase', 'Purchase received. Verifying your subscription...'),
        });
        const verified = await verifyThenPollSubscriptionStatus(context);
        if (!verified) {
          trackSubscriptionEvent(SUBSCRIPTION_EVENTS.RESTORE_FAILED, context, {
            reason: 'verification_timeout',
          });
          return false;
        }
      }
      trackSubscriptionEvent(
        restored ? SUBSCRIPTION_EVENTS.RESTORE_SUCCESS : SUBSCRIPTION_EVENTS.RESTORE_FAILED,
        context
      );
      return restored;
    },
    purchasePackage,
    getOfferings: getOfferingsForPaywall,
    checkEntitlement,
    refreshSubscriptionStatus,
  };
}
