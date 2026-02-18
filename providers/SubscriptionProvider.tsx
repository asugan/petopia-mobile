import { useCallback, useEffect } from 'react';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import {
  initializeRevenueCat,
  getCustomerInfo,
} from '@/lib/revenuecat';

interface SubscriptionProviderProps {
  children: React.ReactNode;
}

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
