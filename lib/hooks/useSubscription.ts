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
import { REVENUECAT_CONFIG } from '@/lib/revenuecat/config';
import { showAlert } from '@/lib/utils/alert';

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
  presentPaywall: (offering?: PurchasesOfferings) => Promise<boolean>;
  presentPaywallIfNeeded: () => Promise<boolean>;
  presentCustomerCenter: () => Promise<void>;
  restorePurchases: () => Promise<boolean>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  getOfferings: () => Promise<PurchasesOfferings | null>;
  checkEntitlement: (entitlementId?: string) => boolean;
  startTrial: () => Promise<void>;
  refreshSubscriptionStatus: () => void;
}

export function useSubscription(): UseSubscriptionReturn {
  const { t } = useTranslation();
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

  const productIdentifier =
    customerInfo?.entitlements.active[REVENUECAT_CONFIG.ENTITLEMENT_ID]
      ?.productIdentifier ?? null;

  const ensureRevenueCatReady = useCallback(async (): Promise<boolean> => {
    if (isInitialized) return true;

    try {
      const configured = await Purchases.isConfigured();
      if (configured) return true;
    } catch {
    }

    showAlert(
      'Error',
      t('subscription.notInitialized', 'Subscription system is not ready yet.')
    );
    return false;
  }, [isInitialized, t]);

  const presentPaywall = useCallback(
    async (offering?: PurchasesOfferings): Promise<boolean> => {
      try {
        if (!(await ensureRevenueCatReady())) return false;

        const result = await RevenueCatUI.presentPaywall({
          offering: offering?.current || undefined,
        });

        switch (result) {
          case PAYWALL_RESULT.PURCHASED:
          case PAYWALL_RESULT.RESTORED:
            refetchStatusMutation.mutate();
            return true;

          case PAYWALL_RESULT.CANCELLED:
            return false;

          case PAYWALL_RESULT.ERROR:
            showAlert(t('common.error'), t('subscription.paywallError'));
            return false;

          case PAYWALL_RESULT.NOT_PRESENTED:
            return false;

          default:
            return false;
        }
      } catch (error) {
        showAlert(t('common.error'), (error as Error).message);
        return false;
      }
    },
    [ensureRevenueCatReady, refetchStatusMutation, t]
  );

  const presentPaywallIfNeeded = useCallback(async (): Promise<boolean> => {
    try {
      if (!(await ensureRevenueCatReady())) return false;

      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: REVENUECAT_CONFIG.ENTITLEMENT_ID,
      });

      if (
        result === PAYWALL_RESULT.PURCHASED ||
        result === PAYWALL_RESULT.RESTORED
      ) {
        refetchStatusMutation.mutate();
        return true;
      }

      return false;
    } catch (error) {
      showAlert(t('common.error'), (error as Error).message);
      return false;
    }
  }, [ensureRevenueCatReady, refetchStatusMutation, t]);

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
            showAlert(t('common.error'), error.message);
          },
          onShowingManageSubscriptions: () => {
          },
          onFeedbackSurveyCompleted: ({ feedbackSurveyOptionId }) => {
          },
        },
      });
    } catch (error) {
      showAlert(t('common.error'), (error as Error).message);
    }
  }, [ensureRevenueCatReady, t]);

  const getOfferingsForPaywall = useCallback(async (): Promise<PurchasesOfferings | null> => {
    if (!(await ensureRevenueCatReady())) return null;
    return fetchOfferings();
  }, [ensureRevenueCatReady, fetchOfferings]);

  const refreshSubscriptionStatus = useCallback(() => {
    refetchStatusMutation.mutate();
  }, [refetchStatusMutation]);

  const startTrial = useCallback(async () => {
    try {
      await startTrialMutation.mutateAsync();
      refetchStatusMutation.mutate();
    } catch (error) {
      showAlert(t('common.error'), t('subscription.startTrialError', 'Failed to start trial.'));
      throw error;
    }
  }, [startTrialMutation, refetchStatusMutation, t]);

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
    restorePurchases: () => storeRestorePurchases(),
    purchasePackage: storePurchasePackage,
    getOfferings: getOfferingsForPaywall,
    checkEntitlement,
    startTrial,
    refreshSubscriptionStatus,
  };
}
