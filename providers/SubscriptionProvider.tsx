import { useEffect, useCallback, useRef } from 'react';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/lib/auth';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useSubscriptionStatus, useStartTrial } from '@/lib/hooks/useSubscriptionQueries';
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

  const trialInitRef = useRef(false);
  const isActivatingTrialRef = useRef(false);
  const syncedUserIdRef = useRef<string | null>(null);

  const handleCustomerInfoUpdate = useCallback(async (info: CustomerInfo) => {
    console.log('[SubscriptionProvider] CustomerInfo updated');
    setCustomerInfo(info);
  }, [setCustomerInfo]);

  const migrateLocalTrialStorage = useCallback(async () => {
    try {
      const migrated = await AsyncStorage.getItem(TRIAL_MIGRATION_KEY);
      if (migrated) {
        console.log('[SubscriptionProvider] Trial migration already done');
        return;
      }

      await AsyncStorage.removeItem('subscription-storage');
      await AsyncStorage.setItem(TRIAL_MIGRATION_KEY, 'true');

      console.log('[SubscriptionProvider] Migrated from local trial storage');
    } catch (error) {
      console.error('[SubscriptionProvider] Migration error:', error);
    }
  }, []);

  const initializeSubscriptionStatus = useCallback(async () => {
    if (trialInitRef.current || !isAuthenticated || isPending) {
      return;
    }
    trialInitRef.current = true;

    try {
      console.log('[SubscriptionProvider] Initializing subscription status');

      const canStartTrial = subscriptionStatus?.canStartTrial ?? false;

      if (canStartTrial && !isActivatingTrialRef.current) {
        console.log('[SubscriptionProvider] New user detected, starting trial...');
        isActivatingTrialRef.current = true;

        await startTrialMutation.mutateAsync();

        isActivatingTrialRef.current = false;
      }
    } catch (error) {
      console.error('[SubscriptionProvider] Error initializing subscription status:', error);
      isActivatingTrialRef.current = false;
    }
  }, [isAuthenticated, isPending, subscriptionStatus, startTrialMutation]);

  const initializeSDK = useCallback(async () => {
    if (isInitialized) {
      console.log('[SubscriptionProvider] SDK already initialized');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await migrateLocalTrialStorage();

      const userId = isAuthenticated ? user?.id ?? null : null;
      await initializeRevenueCat(userId);
      syncedUserIdRef.current = userId;

      const customerInfo = await getCustomerInfo();
      setCustomerInfo(customerInfo);

      setInitialized(true);
      console.log('[SubscriptionProvider] SDK initialized successfully');

      if (isAuthenticated && !isStatusLoading && subscriptionStatus) {
        await initializeSubscriptionStatus();
      }
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
    migrateLocalTrialStorage,
    initializeSubscriptionStatus,
    isStatusLoading,
    subscriptionStatus,
  ]);

  const handleUserLogin = useCallback(async () => {
    if (!user?.id || !isAuthenticated) return;

    if (syncedUserIdRef.current === user.id) {
      console.log('[SubscriptionProvider] User already synced, skipping');
      return;
    }

    try {
      setLoading(true);
      console.log('[SubscriptionProvider] Syncing user identity:', user.id);

      const customerInfo = await syncUserIdentity(user.id);
      setCustomerInfo(customerInfo);
      syncedUserIdRef.current = user.id;

      await initializeSubscriptionStatus();

      console.log('[SubscriptionProvider] User identity synced');
    } catch (error) {
      console.error('[SubscriptionProvider] Error syncing user identity:', error);
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isAuthenticated, setCustomerInfo, setLoading, setError, initializeSubscriptionStatus]);

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

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (!isAuthenticated) {
      console.log('[SubscriptionProvider] Skipping SDK initialization');
      return;
    }

    initializeSDK();
  }, [isPending, isAuthenticated, initializeSDK]);

  useEffect(() => {
    if (isPending || !isInitialized) {
      return;
    }

    if (!isAuthenticated) {
      handleUserLogout();
      resetStore();
    }
  }, [isAuthenticated, isPending, isInitialized, handleUserLogout, resetStore]);

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

    if (isAuthenticated && user?.id) {
      handleUserLogin();
    }
  }, [isAuthenticated, user?.id, isInitialized, isPending, handleUserLogin]);

  useEffect(() => {
    if (isAuthenticated && !isPending && !isStatusLoading && !trialInitRef.current) {
      initializeSubscriptionStatus();
    }
  }, [isAuthenticated, isPending, isStatusLoading, subscriptionStatus, initializeSubscriptionStatus]);

  return <>{children}</>;
}
