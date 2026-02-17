import { useCallback, useEffect } from 'react';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import {
  initializeRevenueCat,
  getCustomerInfo,
} from '@/lib/revenuecat';

interface SubscriptionProviderProps {
  children: React.ReactNode;
}

const TRIAL_MIGRATION_KEY = 'trial_migration_v2_done';

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const {
    setCustomerInfo,
    setInitialized,
    setLoading,
    setError,
    isInitialized,
  } = useSubscriptionStore();

  const initializeSDK = useCallback(async () => {
    if (isInitialized) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const migrated = await AsyncStorage.getItem(TRIAL_MIGRATION_KEY);
      if (!migrated) {
        await AsyncStorage.removeItem('subscription-storage');
        await AsyncStorage.setItem(TRIAL_MIGRATION_KEY, 'true');
      }

      await initializeRevenueCat(null);

      const customerInfo = await getCustomerInfo();
      setCustomerInfo(customerInfo);

      setInitialized(true);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [
    isInitialized,
    setCustomerInfo,
    setInitialized,
    setLoading,
    setError,
  ]);

  const handleCustomerInfoUpdate = useCallback((info: CustomerInfo) => {
    setCustomerInfo(info);
  }, [setCustomerInfo]);

  useEffect(() => {
    if (isInitialized) {
      return;
    }

    void initializeSDK();
  }, [
    isInitialized,
    initializeSDK,
  ]);

  useEffect(() => {
    if (!isInitialized) return;


    const setupTimer = setTimeout(() => {
      Purchases.addCustomerInfoUpdateListener(handleCustomerInfoUpdate);
    }, 100);

    return () => {
      clearTimeout(setupTimer);
      Purchases.removeCustomerInfoUpdateListener(handleCustomerInfoUpdate);
    };
  }, [isInitialized, handleCustomerInfoUpdate]);

  return <>{children}</>;
}
