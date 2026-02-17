import { create } from 'zustand';
import type { CustomerInfo, PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';
import Purchases from 'react-native-purchases';
import { restorePurchases as restorePurchasesApi } from '@/lib/revenuecat/initialize';
import { getRevenueCatEntitlementIdOptional } from '@/lib/revenuecat/config';

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
    },

    getActiveEntitlement: () => {
      const { customerInfo } = get();
      if (!customerInfo) return null;

      const entitlements = customerInfo.entitlements.active;
      const firstKey = Object.keys(entitlements)[0];
      return firstKey ? entitlements[firstKey] : null;
    },

    checkEntitlement: (entitlementId = getRevenueCatEntitlementIdOptional() ?? undefined): boolean => {
      const { customerInfo } = get();
      if (!customerInfo || !entitlementId) return false;
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
        return true;
      } catch (error: unknown) {
        let errorMessage = 'Purchase failed';

        if (error && typeof error === 'object' && 'code' in error) {
          const errorCode = (error as { code: string }).code;
          if (errorCode === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
            set({ isPurchasing: false });
            return false;
          } else if (errorCode === Purchases.PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR) {
            const result = await get().restorePurchases();
            set({ isPurchasing: false });
            return result;
          } else if (error && 'message' in error) {
            errorMessage = (error as { message: string }).message;
          }
        }

        set({ purchaseError: errorMessage, isPurchasing: false });
        return false;
      }
    },

    restorePurchases: async (): Promise<boolean> => {
      set({ isPurchasing: true, purchaseError: null });
      try {
        const customerInfo = await restorePurchasesApi();
        set({ customerInfo, isPurchasing: false });
        const hasEntitlement = get().checkEntitlement();
        return hasEntitlement;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Restore failed';
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
    },
  })
);
