import { useCallback } from 'react';
import Purchases, {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { useTranslation } from 'react-i18next';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useComputedSubscriptionStatus, useRefetchSubscriptionStatus, useStartTrial } from './useSubscriptionQueries';
import { getRevenueCatEntitlementIdOptional } from '@/lib/revenuecat/config';
import { showToast } from '@/lib/toast/showToast';
import { useTracking } from '@/lib/posthog';
import { SUBSCRIPTION_EVENTS, SubscriptionEventProperties } from '@/lib/posthog/subscriptionEvents';

export type SubscriptionStatusType = 'pro' | 'trial' | 'free';

export interface UseSubscriptionReturn {
  // Status (from backend via React Query)
  isProUser: boolean;
  isSubscribed: boolean;
  isTrialActive: boolean;
  isPaidSubscription: boolean;
  isExpired: boolean;
  isCancelled: boolean;
  daysRemaining: number;
  subscriptionStatus: SubscriptionStatusType;
  canStartTrial: boolean;
  provider: 'internal' | 'revenuecat' | null;
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
  error: string | null;

  // Actions
  presentPaywall: (
    offering?: PurchasesOfferings,
    context?: SubscriptionActionContext
  ) => Promise<boolean>;
  presentPaywallIfNeeded: () => Promise<boolean>;
  presentCustomerCenter: () => Promise<void>;
  restorePurchases: (context?: SubscriptionActionContext) => Promise<boolean>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  getOfferings: () => Promise<PurchasesOfferings | null>;
  checkEntitlement: (entitlementId?: string) => boolean;
  startTrial: (context?: SubscriptionActionContext) => Promise<void>;
  refreshSubscriptionStatus: () => void;
}

export interface SubscriptionActionContext {
  screen?: string;
  source?: string;
}

export function useSubscription(): UseSubscriptionReturn {
  const { t } = useTranslation();
  const { trackEvent } = useTracking();
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
    isTrialActive,
    isPaidSubscription,
    isExpired,
    isCancelled,
    canStartTrial,
    daysRemaining,
    expirationDate,
    provider,
    tier,
    subscriptionStatus: subscriptionStatusType,
  } = useComputedSubscriptionStatus();

  const refetchStatusMutation = useRefetchSubscriptionStatus();
  const startTrialMutation = useStartTrial();

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
        is_trial_active: isTrialActive,
        can_start_trial: canStartTrial,
        provider: provider ?? null,
        tier: tier ?? null,
        ...extra,
      });
    },
    [canStartTrial, isProUser, isTrialActive, provider, tier, trackEvent]
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

  const presentPaywall = useCallback(
    async (offering?: PurchasesOfferings, context?: SubscriptionActionContext): Promise<boolean> => {
      try {
        if (!(await ensureRevenueCatReady())) return false;

        trackSubscriptionEvent(SUBSCRIPTION_EVENTS.PURCHASE_STARTED, context, {
          trigger: 'paywall',
        });

        const result = await RevenueCatUI.presentPaywall({
          offering: offering?.current || undefined,
        });

        switch (result) {
          case PAYWALL_RESULT.PURCHASED:
          case PAYWALL_RESULT.RESTORED:
            trackSubscriptionEvent(SUBSCRIPTION_EVENTS.PURCHASE_SUCCESS, context, {
              result,
            });
            await refetchStatusMutation.mutateAsync();
            return true;

          case PAYWALL_RESULT.CANCELLED:
            trackSubscriptionEvent(SUBSCRIPTION_EVENTS.PAYWALL_CLOSE, context, {
              reason: 'cancelled',
            });
            return false;

          case PAYWALL_RESULT.ERROR:
            trackSubscriptionEvent(SUBSCRIPTION_EVENTS.PURCHASE_FAILED, context, {
              reason: 'paywall_error',
            });
            showToast({
              type: 'error',
              title: t('common.error'),
              message: t('subscription.paywallError'),
            });
            return false;

          case PAYWALL_RESULT.NOT_PRESENTED:
            trackSubscriptionEvent(SUBSCRIPTION_EVENTS.PAYWALL_CLOSE, context, {
              reason: 'not_presented',
            });
            return false;

          default:
            return false;
        }
      } catch (error) {
        trackSubscriptionEvent(SUBSCRIPTION_EVENTS.PURCHASE_FAILED, context, {
          reason: 'exception',
          error_message: (error as Error).message,
        });
        showToast({
          type: 'error',
          title: t('common.error'),
          message: (error as Error).message,
        });
        return false;
      }
    },
    [ensureRevenueCatReady, refetchStatusMutation, t, trackSubscriptionEvent]
  );

  const presentPaywallIfNeeded = useCallback(async (): Promise<boolean> => {
    try {
      if (!(await ensureRevenueCatReady())) return false;

      if (!entitlementId) {
        showToast({
          type: 'error',
          title: t('common.error'),
          message: t('subscription.notInitialized', 'Subscription system is not ready yet.'),
        });
        return false;
      }

      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: entitlementId,
      });

      if (
        result === PAYWALL_RESULT.PURCHASED ||
        result === PAYWALL_RESULT.RESTORED
      ) {
        await refetchStatusMutation.mutateAsync();
        return true;
      }

      return false;
    } catch (error) {
        showToast({
          type: 'error',
          title: t('common.error'),
          message: (error as Error).message,
        });
        return false;
    }
  }, [ensureRevenueCatReady, refetchStatusMutation, t, entitlementId]);

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

  const refreshSubscriptionStatus = useCallback(() => {
    refetchStatusMutation.mutate();
  }, [refetchStatusMutation]);

  const startTrial = useCallback(async (context?: SubscriptionActionContext) => {
    trackSubscriptionEvent(SUBSCRIPTION_EVENTS.TRIAL_START_CLICK, context);

    try {
      await startTrialMutation.mutateAsync();
      trackSubscriptionEvent(SUBSCRIPTION_EVENTS.TRIAL_STARTED, context);
      refetchStatusMutation.mutate();
    } catch (error) {
      trackSubscriptionEvent(SUBSCRIPTION_EVENTS.TRIAL_FAILED, context, {
        error_message: (error as Error).message,
      });
      showToast({
        type: 'error',
        title: t('common.error'),
        message: t('subscription.startTrialError'),
      });
      throw error;
    }
  }, [refetchStatusMutation, startTrialMutation, t, trackSubscriptionEvent]);

  const willRenewValue = willRenew();

  return {
    // Status
    isProUser,
    isSubscribed,
    isTrialActive,
    isPaidSubscription,
    isExpired,
    isCancelled,
    daysRemaining,
    subscriptionStatus: subscriptionStatusType,
    canStartTrial,
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
    isLoading: isLoading || isPurchasing || isQueryLoading,
    error: error || (queryError ? queryError.message : null),

    // Actions
    presentPaywall,
    presentPaywallIfNeeded,
    presentCustomerCenter,
    restorePurchases: async (context?: SubscriptionActionContext) => {
      trackSubscriptionEvent(SUBSCRIPTION_EVENTS.RESTORE_CLICK, context);
      const restored = await storeRestorePurchases();
      trackSubscriptionEvent(
        restored ? SUBSCRIPTION_EVENTS.RESTORE_SUCCESS : SUBSCRIPTION_EVENTS.RESTORE_FAILED,
        context
      );
      return restored;
    },
    purchasePackage: storePurchasePackage,
    getOfferings: getOfferingsForPaywall,
    checkEntitlement,
    startTrial,
    refreshSubscriptionStatus,
  };
}
