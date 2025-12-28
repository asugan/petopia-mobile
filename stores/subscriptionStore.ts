import { create } from 'zustand';
import type { CustomerInfo, PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';
import Purchases from 'react-native-purchases';
import { restorePurchases as restorePurchasesApi } from '@/lib/revenuecat/initialize';
import { REVENUECAT_CONFIG } from '@/lib/revenuecat/config';

type EntitlementInfo = CustomerInfo['entitlements']['active'][string];

export interface SubscriptionState {
  customerInfo: CustomerInfo | null;
  isPurchasing: boolean;
  purchaseError: string | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  offerings: PurchasesOfferings | null;
  isLoadingOfferings: boolean;
}

export interface SubscriptionActions {
  setCustomerInfo: (info: CustomerInfo | null) => void;
  getActiveEntitlement: () => EntitlementInfo | null;
  checkEntitlement: (entitlementId?: string) => boolean;
  willRenew: () => boolean;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  fetchOfferings: () => Promise<PurchasesOfferings | null>;
  setOfferings: (offerings: PurchasesOfferings | null) => void;
  setInitialized: (initialized: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPurchaseError: (error: string | null) => void;
  resetSubscription: () => void;
}

const initialState: SubscriptionState = {
  customerInfo: null,
  isPurchasing: false,
  purchaseError: null,
  isInitialized: false,
  isLoading: false,
  error: null,
  offerings: null,
  isLoadingOfferings: false,
};

export const useSubscriptionStore = create<SubscriptionState & SubscriptionActions>()(
  (set, get) => ({
    ...initialState,

    setCustomerInfo: (info) => {
      set({ customerInfo: info });
      if (info) {
        console.log('[Subscription] Customer info updated:', {
          activeEntitlements: Object.keys(info.entitlements.active),
        });
      }
    },

    getActiveEntitlement: () => {
      const { customerInfo } = get();
      if (!customerInfo) return null;

      const entitlements = customerInfo.entitlements.active;
      const firstKey = Object.keys(entitlements)[0];
      return firstKey ? entitlements[firstKey] : null;
    },

    checkEntitlement: (entitlementId = REVENUECAT_CONFIG.ENTITLEMENT_ID): boolean => {
      const { customerInfo } = get();
      if (!customerInfo) return false;
      return typeof customerInfo.entitlements.active[entitlementId] !== 'undefined';
    },

    willRenew: () => {
      const entitlement = get().getActiveEntitlement();
      return entitlement?.willRenew ?? false;
    },

    purchasePackage: async (pkg: PurchasesPackage): Promise<boolean> => {
      set({ isPurchasing: true, purchaseError: null });
      try {
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        set({ customerInfo, isPurchasing: false });
        console.log('[Subscription] Purchase successful');
        return true;
      } catch (error: unknown) {
        let errorMessage = 'Purchase failed';
        let shouldReturnTrue = false;

        if (error && typeof error === 'object' && 'code' in error) {
          const errorCode = (error as { code: string }).code;
          if (errorCode === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
            console.log('[Subscription] Purchase cancelled');
            shouldReturnTrue = true;
          } else if (errorCode === Purchases.PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR) {
            console.log('[Subscription] Product already purchased, restoring...');
            const result = await get().restorePurchases();
            set({ isPurchasing: false });
            return result;
          } else if (error && 'message' in error) {
            errorMessage = (error as { message: string }).message;
          }
        }

        console.error('[Subscription] Purchase error:', error);
        set({ purchaseError: errorMessage, isPurchasing: false });
        return shouldReturnTrue;
      }
    },

    restorePurchases: async (): Promise<boolean> => {
      set({ isPurchasing: true, purchaseError: null });
      try {
        const customerInfo = await restorePurchasesApi();
        set({ customerInfo, isPurchasing: false });
        const hasEntitlement = get().checkEntitlement();
        console.log('[Subscription] Purchases restored, has entitlement:', hasEntitlement);
        return hasEntitlement;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Restore failed';
        console.error('[Subscription] Restore error:', error);
        set({ purchaseError: errorMessage, isPurchasing: false });
        return false;
      }
    },

    fetchOfferings: async (): Promise<PurchasesOfferings | null> => {
      set({ isLoadingOfferings: true });
      try {
        const offerings = await Purchases.getOfferings();
        set({ offerings, isLoadingOfferings: false });
        return offerings;
      } catch (error) {
        console.error('[Subscription] Offerings error:', error);
        set({ isLoadingOfferings: false });
        return null;
      }
    },

    setOfferings: (offerings) => set({ offerings }),

    setInitialized: (initialized) => set({ isInitialized: initialized }),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    setPurchaseError: (error) => set({ purchaseError: error }),

    resetSubscription: () => {
      set({
        customerInfo: null,
        isPurchasing: false,
        purchaseError: null,
        isInitialized: false,
        isLoading: false,
        error: null,
        offerings: null,
        isLoadingOfferings: false,
      });
      console.log('[Subscription] State reset');
    },
  })
);
