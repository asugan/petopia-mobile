import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  subscriptionService,
  type StartTrialResponse,
  type SubscriptionStatus,
} from '../services/subscriptionService';

export const subscriptionKeys = {
  all: ['subscription'] as const,
  status: (userId?: string) => ['subscription', 'status', userId] as const,
};

const DEFAULT_STATUS: SubscriptionStatus = {
  hasActiveSubscription: false,
  subscriptionType: null,
  tier: null,
  expiresAt: null,
  daysRemaining: 0,
  isExpired: false,
  isCancelled: false,
  canStartTrial: true,
  provider: null,
};

type SubscriptionStatusStore = {
  data: SubscriptionStatus;
  isLoading: boolean;
  error: Error | null;
  lastFetchedAt: number;
};

const STATUS_STALE_MS = 30_000;

let subscriptionStatusStore: SubscriptionStatusStore = {
  data: DEFAULT_STATUS,
  isLoading: false,
  error: null,
  lastFetchedAt: 0,
};

const subscriptionStatusListeners = new Set<() => void>();

const emitSubscriptionStatus = () => {
  subscriptionStatusListeners.forEach((listener) => listener());
};

const setSubscriptionStatusStore = (next: Partial<SubscriptionStatusStore>) => {
  subscriptionStatusStore = {
    ...subscriptionStatusStore,
    ...next,
  };
  emitSubscriptionStatus();
};

const loadSubscriptionStatus = async (bypassCache = false) => {
  const now = Date.now();
  const isFresh = now - subscriptionStatusStore.lastFetchedAt < STATUS_STALE_MS;

  if (!bypassCache && isFresh) {
    return {
      success: true as const,
      data: subscriptionStatusStore.data,
    };
  }

  setSubscriptionStatusStore({ isLoading: true, error: null });

  const response = await subscriptionService.getSubscriptionStatus({
    bypassCache,
  });

  if (response?.success && response.data) {
    setSubscriptionStatusStore({
      data: response.data,
      isLoading: false,
      error: null,
      lastFetchedAt: Date.now(),
    });
    return response;
  }

  const message = response
    ? typeof response.error === 'string'
      ? response.error
      : response.error?.message ?? 'Abonelik durumu yüklenemedi'
    : 'Abonelik durumu yüklenemedi';

  setSubscriptionStatusStore({
    isLoading: false,
    error: new Error(message),
  });

  return response;
};

function useSubscriptionStatusStoreSnapshot() {
  const [snapshot, setSnapshot] = useState(subscriptionStatusStore);

  useEffect(() => {
    const listener = () => setSnapshot(subscriptionStatusStore);
    subscriptionStatusListeners.add(listener);
    return () => {
      subscriptionStatusListeners.delete(listener);
    };
  }, []);

  return snapshot;
}

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
            : new Error('Islem basarisiz oldu');
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

  const reset = useCallback(() => {
    setError(null);
    setIsPending(false);
  }, []);

  return {
    mutate,
    mutateAsync,
    isPending,
    error,
    reset,
  };
}

export function useSubscriptionStatus() {
  const snapshot = useSubscriptionStatusStoreSnapshot();

  useEffect(() => {
    void loadSubscriptionStatus(false);
  }, []);

  const refetch = useCallback(() => {
    return loadSubscriptionStatus(true);
  }, []);

  return {
    data: snapshot.data,
    isLoading: snapshot.isLoading,
    error: snapshot.error,
    isError: !!snapshot.error,
    refetch,
  };
}

export function useStartTrial() {
  return useAsyncMutation<void, StartTrialResponse>(async () => {
    const result = await subscriptionService.startTrial();

    if (!result?.success || !result.data) {
      const message =
        result
          ? typeof result.error === 'string'
            ? result.error
            : result.error?.message ?? 'Trial baslatilamadi'
          : 'Trial baslatilamadi';
      throw new Error(message);
    }

    await loadSubscriptionStatus(true);
    return result.data;
  });
}

export function useRefetchSubscriptionStatus() {
  return useAsyncMutation<void, Awaited<ReturnType<typeof loadSubscriptionStatus>>>(
    async () => {
      return loadSubscriptionStatus(true);
    }
  );
}

export function useVerifySubscriptionStatus() {
  return useAsyncMutation<void, Awaited<ReturnType<typeof subscriptionService.verifySubscription>>>(
    async () => {
      const result = await subscriptionService.verifySubscription();

      if (result?.success && result.data) {
        setSubscriptionStatusStore({
          data: result.data,
          isLoading: false,
          error: null,
          lastFetchedAt: Date.now(),
        });
      } else {
        await loadSubscriptionStatus(true);
      }

      return result;
    }
  );
}

export type SubscriptionStatusType = 'pro' | 'trial' | 'free';

export function useComputedSubscriptionStatus() {
  const { data, ...rest } = useSubscriptionStatus();

  const derived = useMemo(() => {
    const isProUser = data?.hasActiveSubscription ?? false;
    const isTrialActive = data?.subscriptionType === 'trial';
    const isPaidSubscription = data?.subscriptionType === 'paid';
    const subscriptionStatus: SubscriptionStatusType = isPaidSubscription
      ? 'pro'
      : isTrialActive
      ? 'trial'
      : 'free';

    return {
      isProUser,
      isTrialActive,
      isPaidSubscription,
      subscriptionStatus,
    };
  }, [data]);

  return {
    ...rest,
    data,
    ...derived,
    isExpired: data?.isExpired ?? false,
    isCancelled: data?.isCancelled ?? false,
    canStartTrial: data?.canStartTrial ?? true,
    daysRemaining: data?.daysRemaining ?? 0,
    expirationDate: data?.expiresAt ?? null,
    provider: data?.provider ?? null,
    tier: data?.tier ?? null,
  };
}

export function useSubscriptionQueryEnabled() {
  const { data, isLoading, isError } = useSubscriptionStatus();
  const hasActiveSubscription = data?.hasActiveSubscription ?? false;

  return {
    enabled: hasActiveSubscription,
    hasActiveSubscription,
    isLoading,
    isError,
  };
}

export function useProQueryEnabled() {
  const { isPaidSubscription, isLoading, isError } =
    useComputedSubscriptionStatus();

  return {
    enabled: isPaidSubscription,
    isPaidSubscription,
    isLoading,
    isError,
  };
}
