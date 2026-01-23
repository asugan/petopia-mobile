import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionApiService, DowngradeStatus } from '../services/subscriptionApiService';
import { CACHE_TIMES } from '../config/queryConfig';
import { useConditionalQuery } from './core/useConditionalQuery';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';
import { useComputedSubscriptionStatus } from './useSubscriptionQueries';
import { downgradeKeys, petKeys } from './queryKeys';

export { downgradeKeys } from './queryKeys';

export function useDowngradeStatus() {
  const { enabled: authEnabled, userId } = useAuthQueryEnabled();
  const { isProUser, isLoading: isSubscriptionLoading } = useComputedSubscriptionStatus();

  // Only check downgrade status when user is authenticated and NOT a pro user
  const enabled = authEnabled && !isSubscriptionLoading && !isProUser;

  return useConditionalQuery<DowngradeStatus>({
    queryKey: downgradeKeys.status(userId),
    queryFn: () => subscriptionApiService.getDowngradeStatus(),
    enabled,
    staleTime: CACHE_TIMES.MEDIUM, // Less frequent checks
    gcTime: CACHE_TIMES.LONG,
    defaultValue: {
      requiresDowngrade: false,
      currentPetCount: 0,
      freemiumLimit: 1,
      pets: [],
    },
    errorMessage: 'Downgrade status could not be loaded',
  });
}

export function useExecuteDowngrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keepPetId: string) => {
      const result = await subscriptionApiService.executeDowngrade(keepPetId);
      if (!result.success) {
        throw new Error(typeof result.error === 'string' ? result.error : 'Downgrade failed');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: petKeys.all });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'downgrade' });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'subscription' });
    },
  });
}
