import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionApiService, SubscriptionStatus } from '../services/subscriptionApiService';
import { CACHE_TIMES } from '../config/queryConfig';
import { createQueryKeys } from './core/createQueryKeys';
import { useConditionalQuery } from './core/useConditionalQuery';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';

// Query keys factory
const baseSubscriptionKeys = createQueryKeys('subscription');

export const subscriptionKeys = {
  ...baseSubscriptionKeys,
  status: (userId?: string) => [...baseSubscriptionKeys.all, 'status', userId] as const,
};

export function useSubscriptionStatus() {
  const { enabled, userId } = useAuthQueryEnabled();

  return useConditionalQuery<SubscriptionStatus>({
    queryKey: subscriptionKeys.status(userId),
    queryFn: () => subscriptionApiService.getSubscriptionStatus(),
    enabled,
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

export function useStartTrial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await subscriptionApiService.startTrial();
      if (!result.success) {
        throw new Error(typeof result.error === 'string' ? result.error : 'Trial başlatılamadı');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'subscription' && query.queryKey[1] === 'status' });
    },
  });
}

export function useRefetchSubscriptionStatus() {
  const queryClient = useQueryClient();
  const { userId } = useAuthQueryEnabled();

  return useMutation({
    mutationFn: () => subscriptionApiService.getSubscriptionStatus({ bypassCache: true }),
    onSuccess: (response) => {
      if (response.success && response.data) {
        queryClient.setQueryData(subscriptionKeys.status(userId), response.data);
      }
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'subscription' && query.queryKey[1] === 'status' });
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

export function useSubscriptionQueryEnabled() {
  const { enabled: authEnabled, userId } = useAuthQueryEnabled();
  const { data, isLoading, isError } = useSubscriptionStatus();

  const hasActiveSubscription = data?.hasActiveSubscription ?? false;
  const enabled = authEnabled && hasActiveSubscription;

  return { enabled, userId, hasActiveSubscription, isLoading, isError };
}

export function useProQueryEnabled() {
  const { enabled: authEnabled, userId } = useAuthQueryEnabled();
  const { isPaidSubscription, isLoading, isError } = useComputedSubscriptionStatus();

  const enabled = authEnabled && isPaidSubscription;

  return { enabled, userId, isPaidSubscription, isLoading, isError };
}
