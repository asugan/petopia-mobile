import { useEffect, useCallback, useRef } from 'react';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/lib/auth';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useSubscriptionStatus, useStartTrial, useRefetchSubscriptionStatus } from '@/lib/hooks/useSubscriptionQueries';
import {
  initializeRevenueCat,
  syncUserIdentity,
  resetUserIdentity,
  getCustomerInfo,
} from '@/lib/revenuecat';

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
      console.log('[SubscriptionProvider] Initializing subscription status');

      const canStartTrial = subscriptionStatusRef.current?.canStartTrial ?? false;

      if (canStartTrial && !isActivatingTrialRef.current) {
        console.log('[SubscriptionProvider] New user detected, starting trial...');
        isActivatingTrialRef.current = true;

        await startTrialMutateAsyncRef.current();

        isActivatingTrialRef.current = false;
      }
    } catch (error) {
      console.error('[SubscriptionProvider] Error initializing subscription status:', error);
      isActivatingTrialRef.current = false;
      trialInitRef.current = false;
    }
  }, [isAuthenticated, isPending]);

  const initializeSDK = useCallback(async () => {
    if (isInitialized) {
      console.log('[SubscriptionProvider] SDK already initialized');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const migrated = await AsyncStorage.getItem(TRIAL_MIGRATION_KEY);
      if (!migrated) {
        await AsyncStorage.removeItem('subscription-storage');
        await AsyncStorage.setItem(TRIAL_MIGRATION_KEY, 'true');
        console.log('[SubscriptionProvider] Migrated from local trial storage');
      }

      const userId = isAuthenticated ? user?.id ?? null : null;
      await initializeRevenueCat(userId);

      const currentAppUserId = await Purchases.getAppUserID();
      const isAnonymous = currentAppUserId.startsWith('$RCAnonymousID');
      syncedUserIdRef.current = isAnonymous ? null : currentAppUserId;

      const customerInfo = await getCustomerInfo();
      setCustomerInfo(customerInfo);

      setInitialized(true);
      console.log('[SubscriptionProvider] SDK initialized successfully');
    } catch (error) {
      console.error('[SubscriptionProvider] SDK initialization error:', error);
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
      console.log('[SubscriptionProvider] Syncing user identity:', user.id);

      const customerInfo = await syncUserIdentity(user.id);
      setCustomerInfo(customerInfo);

      const currentAppUserId = await Purchases.getAppUserID();
      syncedUserIdRef.current = currentAppUserId;

      try {
        await refetchStatusMutation.mutateAsync();
        console.log('[SubscriptionProvider] Subscription status refetched after sync');
      } catch (refetchError) {
        console.error('[SubscriptionProvider] Error refetching subscription status:', refetchError);
      }

      await initializeStatusRef.current?.();

      console.log('[SubscriptionProvider] User identity synced');
    } catch (error) {
      console.error('[SubscriptionProvider] Error syncing user identity:', error);
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
      console.log('[SubscriptionProvider] Resetting user identity');

      const customerInfo = await resetUserIdentity();
      setCustomerInfo(customerInfo);

      syncedUserIdRef.current = null;
      trialInitRef.current = false;

      console.log('[SubscriptionProvider] Reset to anonymous user');
    } catch (error) {
      console.error('[SubscriptionProvider] Error resetting user identity:', error);
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [setCustomerInfo, setLoading, setError]);

  const handleCustomerInfoUpdate = useCallback((info: CustomerInfo) => {
    console.log('[SubscriptionProvider] CustomerInfo updated');
    setCustomerInfo(info);
  }, [setCustomerInfo]);

  useEffect(() => {
    subscriptionStatusRef.current = subscriptionStatus;
  }, [subscriptionStatus]);

  useEffect(() => {
    startTrialMutateAsyncRef.current = startTrialMutation.mutateAsync;
  }, [startTrialMutation.mutateAsync]);

  initializeStatusRef.current = initializeSubscriptionStatus;
  handleUserLoginRef.current = handleUserLogin;
  handleUserLogoutRef.current = handleUserLogout;

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (!isAuthenticated || isInitialized) {
      return;
    }

    initializeSDK();
  }, [isPending, isAuthenticated, isInitialized, initializeSDK]);

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

    console.log('[SubscriptionProvider] Setting up CustomerInfo listener');

    const setupTimer = setTimeout(() => {
      Purchases.addCustomerInfoUpdateListener(handleCustomerInfoUpdate);
    }, 100);

    return () => {
      console.log('[SubscriptionProvider] Removing CustomerInfo listener');
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
