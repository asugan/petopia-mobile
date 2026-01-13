import { useEffect, useCallback, useRef } from 'react';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/lib/auth';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useSubscriptionStatus, useStartTrial, useRefetchSubscriptionStatus } from '@/lib/hooks/useSubscriptionQueries';
import { usePublicConfig } from '@/lib/hooks/usePublicConfig';
import {
  initializeRevenueCat,
  syncUserIdentity,
  resetUserIdentity,
  getCustomerInfo,
} from '@/lib/revenuecat';
import { setRevenueCatConfig } from '@/lib/revenuecat/config';

interface SubscriptionProviderProps {
  children: React.ReactNode;
}

const TRIAL_MIGRATION_KEY = 'trial_migration_v2_done';

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const { user, isAuthenticated, isPending } = useAuth();
  const {
    setCustomerInfo,
    setInitialized,
    setLoading,
    setError,
    setOfferings,
    isInitialized,
    resetSubscription: resetStore,
  } = useSubscriptionStore();

  const { data: subscriptionStatus, isLoading: isStatusLoading } = useSubscriptionStatus();
  const startTrialMutation = useStartTrial();
  const refetchStatusMutation = useRefetchSubscriptionStatus();
  const {
    data: publicConfig,
    isLoading: isPublicConfigLoading,
    error: publicConfigError,
  } = usePublicConfig();

  const trialInitRef = useRef(false);
  const isActivatingTrialRef = useRef(false);
  const syncedUserIdRef = useRef<string | null>(null);
  const initializeStatusRef = useRef<(() => Promise<void>) | null>(null);
  const handleUserLoginRef = useRef<(() => Promise<void>) | null>(null);
  const handleUserLogoutRef = useRef<(() => Promise<void>) | null>(null);
  const subscriptionStatusRef = useRef(subscriptionStatus);
  const startTrialMutateAsyncRef = useRef(startTrialMutation.mutateAsync);

  const initializeSubscriptionStatus = useCallback(async () => {
    if (trialInitRef.current || !isAuthenticated || isPending) {
      return;
    }
    trialInitRef.current = true;

    try {

      const canStartTrial = subscriptionStatusRef.current?.canStartTrial ?? false;

      if (canStartTrial && !isActivatingTrialRef.current) {
        isActivatingTrialRef.current = true;

        await startTrialMutateAsyncRef.current();

        isActivatingTrialRef.current = false;
      }
    } catch {
      isActivatingTrialRef.current = false;
      trialInitRef.current = false;
    }
  }, [isAuthenticated, isPending]);

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

      const userId = isAuthenticated ? user?.id ?? null : null;
      await initializeRevenueCat(userId);

      const currentAppUserId = await Purchases.getAppUserID();
      const isAnonymous = currentAppUserId.startsWith('$RCAnonymousID');
      syncedUserIdRef.current = isAnonymous ? null : currentAppUserId;

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
    isAuthenticated,
    user?.id,
    setCustomerInfo,
    setInitialized,
    setLoading,
    setError,
  ]);

  const handleUserLogin = useCallback(async () => {
    if (!user?.id || !isAuthenticated) return;

    try {
      setLoading(true);

      const customerInfo = await syncUserIdentity(user.id);
      setCustomerInfo(customerInfo);

      const currentAppUserId = await Purchases.getAppUserID();
      syncedUserIdRef.current = currentAppUserId;

      try {
        await refetchStatusMutation.mutateAsync();
      } catch {
      }

      await initializeStatusRef.current?.();

    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [
    user?.id,
    isAuthenticated,
    setCustomerInfo,
    setLoading,
    setError,
    refetchStatusMutation,
  ]);

  const handleUserLogout = useCallback(async () => {
    try {
      setLoading(true);

      const customerInfo = await resetUserIdentity();
      setCustomerInfo(customerInfo);

      syncedUserIdRef.current = null;
      trialInitRef.current = false;

    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [setCustomerInfo, setLoading, setError]);

  const handleCustomerInfoUpdate = useCallback((info: CustomerInfo) => {
    setCustomerInfo(info);
  }, [setCustomerInfo]);

  useEffect(() => {
    subscriptionStatusRef.current = subscriptionStatus;
  }, [subscriptionStatus]);

  useEffect(() => {
    startTrialMutateAsyncRef.current = startTrialMutation.mutateAsync;
  }, [startTrialMutation.mutateAsync]);

  useEffect(() => {
    initializeStatusRef.current = initializeSubscriptionStatus;
    handleUserLoginRef.current = handleUserLogin;
    handleUserLogoutRef.current = handleUserLogout;
  }, [initializeSubscriptionStatus, handleUserLogin, handleUserLogout]);

  useEffect(() => {
    if (publicConfig?.revenuecat) {
      setRevenueCatConfig(publicConfig.revenuecat);
    }
  }, [publicConfig]);

  useEffect(() => {
    if (publicConfigError) {
      setError((publicConfigError as Error).message);
    }
  }, [publicConfigError, setError]);

  useEffect(() => {
    if (isPending || isPublicConfigLoading || !publicConfig) {
      return;
    }

    if (!isAuthenticated || isInitialized) {
      return;
    }

    initializeSDK();
  }, [
    isPending,
    isPublicConfigLoading,
    publicConfig,
    isAuthenticated,
    isInitialized,
    initializeSDK,
  ]);

  useEffect(() => {
    if (isPending || !isInitialized) {
      return;
    }

    if (!isAuthenticated) {
      handleUserLogoutRef.current?.();
      resetStore();
    }
  }, [isAuthenticated, isPending, isInitialized, resetStore]);

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

  useEffect(() => {
    if (!isInitialized || isPending) return;

    if (isAuthenticated && user?.id && syncedUserIdRef.current !== user.id) {
      handleUserLoginRef.current?.();
    }
  }, [isAuthenticated, user?.id, isInitialized, isPending]);

  useEffect(() => {
    if (
      isAuthenticated &&
      !isPending &&
      !isStatusLoading &&
      !trialInitRef.current
    ) {
      initializeStatusRef.current?.();
    }
  }, [
    isAuthenticated,
    isPending,
    isStatusLoading,
  ]);

  return <>{children}</>;
}
