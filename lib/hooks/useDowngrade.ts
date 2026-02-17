import { useCallback, useEffect, useState } from 'react';
import {
  subscriptionService,
  type DowngradeResponse,
  type DowngradeStatus,
} from '../services/subscriptionService';
import { useComputedSubscriptionStatus } from './useSubscriptionQueries';

const LOCAL_USER_ID = 'local-user';

export const downgradeKeys = {
  all: ['downgrade'] as const,
  status: (userId?: string) => ['downgrade', 'status', userId] as const,
};

const DEFAULT_STATUS: DowngradeStatus = {
  requiresDowngrade: false,
  currentPetCount: 0,
  freemiumLimit: 1,
  pets: [],
};

function useAsyncMutation<TArgs, TResult>(
  action: (args: TArgs) => Promise<TResult>
) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutateAsync = useCallback(
    async (args: TArgs) => {
      setIsPending(true);
      setError(null);
      try {
        return await action(args);
      } catch (mutationError) {
        const normalizedError =
          mutationError instanceof Error
            ? mutationError
            : new Error('Downgrade failed');
        setError(normalizedError);
        throw normalizedError;
      } finally {
        setIsPending(false);
      }
    },
    [action]
  );

  const mutate = useCallback(
    (args: TArgs) => {
      void mutateAsync(args);
    },
    [mutateAsync]
  );

  return {
    mutate,
    mutateAsync,
    isPending,
    error,
  };
}

export function useDowngradeStatus() {
  const { isProUser, isLoading: isSubscriptionLoading } =
    useComputedSubscriptionStatus();
  const [data, setData] = useState<DowngradeStatus>(DEFAULT_STATUS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (isProUser) {
      setData(DEFAULT_STATUS);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await subscriptionService.getDowngradeStatus();
      if (response.success && response.data) {
        setData(response.data);
      } else {
        const message =
          typeof response.error === 'string'
            ? response.error
            : response.error?.message ?? 'Downgrade status could not be loaded';
        setError(new Error(message));
      }
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError
          : new Error('Downgrade status could not be loaded')
      );
    } finally {
      setIsLoading(false);
    }
  }, [isProUser]);

  useEffect(() => {
    if (isSubscriptionLoading) {
      return;
    }

    void refresh();
  }, [isSubscriptionLoading, refresh]);

  return {
    data,
    isLoading,
    error,
    isError: !!error,
    refetch: refresh,
  };
}

export function useExecuteDowngrade() {
  return useAsyncMutation<string, DowngradeResponse>(async (keepPetId) => {
    const result = await subscriptionService.executeDowngrade(keepPetId);

    if (!result.success || !result.data) {
      const message =
        typeof result.error === 'string'
          ? result.error
          : result.error?.message ?? 'Downgrade failed';
      throw new Error(message);
    }

    return result.data;
  });
}

export const localDowngradeUserId = LOCAL_USER_ID;
