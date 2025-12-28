import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionApiService, SubscriptionStatus } from '../services/subscriptionApiService';
import { CACHE_TIMES } from '../config/queryConfig';
import { createQueryKeys } from './core/createQueryKeys';
import { useConditionalQuery } from './core/useConditionalQuery';

// Query keys factory
export const subscriptionKeys = createQueryKeys('subscription');

/**
 * Hook for fetching subscription status from backend
 * This replaces the Zustand-based approach with React Query
 * Features:
 * - Automatic caching and deduplication
 * - Built-in retry logic and error handling
 * - Type-safe status checks
 * - Background refresh with configurable stale time
 */
export function useSubscriptionStatus() {
  return useConditionalQuery<SubscriptionStatus>({
    queryKey: subscriptionKeys.all,
    queryFn: () => subscriptionApiService.getSubscriptionStatus(),
    staleTime: CACHE_TIMES.MEDIUM, // 5 minutes
    gcTime: CACHE_TIMES.LONG,      // 15 minutes
    defaultValue: {
      hasActiveSubscription: false,
      subscriptionType: null,
      tier: null,
      expiresAt: null,
      daysRemaining: 0,
      isExpired: false,
      isCancelled: false,
      canStartTrial: true,
      provider: null,
    },
    errorMessage: 'Abonelik durumu yüklenemedi',
  });
}

/**
 * Hook for starting a trial subscription
 * This mutation automatically invalidates the subscription status query after success
 */
export function useStartTrial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: subscriptionApiService.startTrial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });
}

/**
 * Hook for refetching subscription status immediately (bypasses cache)
 */
export function useRefetchSubscriptionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => subscriptionApiService.getSubscriptionStatus({ bypassCache: true }),
    onSuccess: () => {
      // Invalidate to force all queries to use fresh data
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });
}

/**
 * Helper type for subscription status
 */
export type SubscriptionStatusType = 'pro' | 'trial' | 'free';

/**
 * Hook to compute derived subscription status from raw data
 */
export function useComputedSubscriptionStatus() {
  const { data, ...rest } = useSubscriptionStatus();

  const isProUser = data?.hasActiveSubscription ?? false;
  const isTrialActive = data?.subscriptionType === 'trial';
  const isPaidSubscription = data?.subscriptionType === 'paid';
  const subscriptionStatus: SubscriptionStatusType = isPaidSubscription ? 'pro' : isTrialActive ? 'trial' : 'free';

  return {
    ...rest,
    data,
    isProUser,
    isTrialActive,
    isPaidSubscription,
    isExpired: data?.isExpired ?? false,
    isCancelled: data?.isCancelled ?? false,
    canStartTrial: data?.canStartTrial ?? true,
    daysRemaining: data?.daysRemaining ?? 0,
    expirationDate: data?.expiresAt ?? null,
    provider: data?.provider ?? null,
    tier: data?.tier ?? null,
    subscriptionStatus,
  };
}
