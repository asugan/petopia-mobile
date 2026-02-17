import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  BudgetAlert,
  PetBreakdown,
  SetUserBudgetInput,
  UserBudget,
  UserBudgetStatus,
} from '../types';
import { userBudgetService } from '../services/userBudgetService';
import {
  notificationService,
} from '../services/notificationService';
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import { useSubscriptionQueryEnabled } from './useSubscriptionQueries';
import { useLocalMutation, useLocalQuery } from './core/useLocalAsync';

export const userBudgetKeys = {
  all: ['budget'] as const,
  status: () => ['budget', 'status'] as const,
  alerts: () => ['budget', 'alerts'] as const,
  petBreakdown: () => ['budget', 'pet-breakdown'] as const,
  isActive: () => ['budget', 'is-active'] as const,
  summary: () => ['budget', 'summary'] as const,
};

let budgetVersion = 0;
const budgetListeners = new Set<() => void>();

const notifyBudgetChange = () => {
  budgetVersion += 1;
  budgetListeners.forEach((listener) => listener());
};

const useBudgetVersion = () => {
  const [version, setVersion] = useState(budgetVersion);

  useEffect(() => {
    const listener = () => setVersion(budgetVersion);
    budgetListeners.add(listener);
    return () => {
      budgetListeners.delete(listener);
    };
  }, []);

  return version;
};

const extractErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};

type ErrorLike =
  | string
  | {
      code?: string;
      message?: string;
    }
  | undefined;

const isNotFound = (error: ErrorLike): boolean => {
  return typeof error === 'object' && !!error && error.code === 'NOT_FOUND';
};

const resolveMessage = (error: ErrorLike, fallback: string): string => {
  if (typeof error === 'string') {
    return error;
  }
  return error?.message ?? fallback;
};

export function useUserBudget() {
  const { enabled } = useSubscriptionQueryEnabled();
  const baseCurrency = useUserSettingsStore((state) => state.settings?.baseCurrency ?? 'TRY');
  const version = useBudgetVersion();

  return useLocalQuery<UserBudget | null>({
    enabled,
    defaultValue: null,
    deps: [enabled, baseCurrency, version],
    queryFn: async () => {
      const response = await userBudgetService.getBudget({ targetCurrency: baseCurrency });
      if (response.success && response.data) {
        return response.data;
      }
      if (isNotFound(response.error)) {
        return null;
      }
      throw new Error(resolveMessage(response.error, 'User budget could not be loaded'));
    },
  });
}

export function useUserBudgetStatus() {
  const { enabled } = useSubscriptionQueryEnabled();
  const baseCurrency = useUserSettingsStore((state) => state.settings?.baseCurrency ?? 'TRY');
  const { data: budget } = useUserBudget();
  const version = useBudgetVersion();

  return useLocalQuery<UserBudgetStatus | null>({
    enabled: enabled && !!budget && budget.isActive,
    defaultValue: null,
    deps: [enabled, budget?.id, budget?.isActive, baseCurrency, version],
    queryFn: async () => {
      const response = await userBudgetService.getBudgetStatus({ targetCurrency: baseCurrency });
      if (response.success && response.data) {
        return response.data;
      }
      if (isNotFound(response.error)) {
        return null;
      }
      throw new Error(resolveMessage(response.error, 'Budget status could not be loaded'));
    },
  });
}

export function useSetUserBudget() {
  return useLocalMutation<UserBudget, SetUserBudgetInput>({
    mutationFn: async (data) => {
      const response = await userBudgetService.setBudget(data);
      if (!response.success || !response.data) {
        throw new Error(resolveMessage(response.error, 'Budget could not be saved'));
      }
      return response.data;
    },
    onSuccess: () => {
      notifyBudgetChange();
    },
  });
}

export function useDeleteUserBudget() {
  return useLocalMutation<void | string, void>({
    mutationFn: async () => {
      const response = await userBudgetService.deleteBudget();
      if (!response.success) {
        throw new Error(resolveMessage(response.error, 'Budget could not be deleted'));
      }
      return response.data;
    },
    onSuccess: () => {
      notifyBudgetChange();
    },
  });
}

export function useBudgetAlerts() {
  const { enabled } = useSubscriptionQueryEnabled();
  const baseCurrency = useUserSettingsStore((state) => state.settings?.baseCurrency ?? 'TRY');
  const { data: budget } = useUserBudget();
  const notificationsEnabled = useUserSettingsStore(
    (state) => state.settings?.notificationsEnabled ?? true
  );
  const budgetNotificationsEnabled = useUserSettingsStore(
    (state) => state.settings?.budgetNotificationsEnabled ?? true
  );
  const version = useBudgetVersion();

  return useLocalQuery<BudgetAlert | null>({
    enabled:
      enabled &&
      !!budget &&
      budget.isActive &&
      notificationsEnabled &&
      budgetNotificationsEnabled,
    defaultValue: null,
    deps: [
      enabled,
      budget?.id,
      budget?.isActive,
      baseCurrency,
      notificationsEnabled,
      budgetNotificationsEnabled,
      version,
    ],
    refetchInterval: 30_000,
    queryFn: async () => {
      const response = await userBudgetService.checkBudgetAlerts({ targetCurrency: baseCurrency });
      if (response.success && response.data) {
        return response.data;
      }
      if (isNotFound(response.error)) {
        return null;
      }
      throw new Error(resolveMessage(response.error, 'Budget alerts could not be checked'));
    },
  });
}

export function usePetSpendingBreakdown() {
  const { enabled } = useSubscriptionQueryEnabled();
  const baseCurrency = useUserSettingsStore((state) => state.settings?.baseCurrency ?? 'TRY');
  const { data: budget } = useUserBudget();
  const version = useBudgetVersion();

  return useLocalQuery<PetBreakdown[]>({
    enabled: enabled && !!budget && budget.isActive,
    defaultValue: [],
    deps: [enabled, budget?.id, budget?.isActive, baseCurrency, version],
    queryFn: async () => {
      const response = await userBudgetService.getPetSpendingBreakdown({
        targetCurrency: baseCurrency,
      });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(
        resolveMessage(response.error, 'Pet spending breakdown could not be loaded')
      );
    },
  });
}

export function useHasActiveBudget() {
  const { enabled } = useSubscriptionQueryEnabled();
  const version = useBudgetVersion();

  return useLocalQuery<boolean>({
    enabled,
    defaultValue: false,
    deps: [enabled, version],
    queryFn: async () => {
      const response = await userBudgetService.hasActiveBudget();
      if (response.success && typeof response.data === 'boolean') {
        return response.data;
      }
      return false;
    },
  });
}

export function useBudgetSummary() {
  const { enabled } = useSubscriptionQueryEnabled();
  const baseCurrency = useUserSettingsStore((state) => state.settings?.baseCurrency ?? 'TRY');
  const version = useBudgetVersion();

  return useLocalQuery<{
    budget: UserBudget | null;
    status: UserBudgetStatus | null;
    hasActiveBudget: boolean;
    alerts: BudgetAlert | null;
  } | null>({
    enabled,
    defaultValue: null,
    deps: [enabled, baseCurrency, version],
    queryFn: async () => {
      const response = await userBudgetService.getBudgetSummary({ targetCurrency: baseCurrency });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(resolveMessage(response.error, 'Budget summary could not be loaded'));
    },
  });
}

export function useBudgetAlertNotifications() {
  const { data: alert } = useBudgetAlerts();
  const { data: budget } = useUserBudget();
  const notificationsEnabled = useUserSettingsStore(
    (state) => state.settings?.notificationsEnabled ?? true
  );
  const budgetNotificationsEnabled = useUserSettingsStore(
    (state) => state.settings?.budgetNotificationsEnabled ?? true
  );
  const notifiedCache = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const handleAlertNotification = async () => {
      if (!notificationsEnabled || !budgetNotificationsEnabled) {
        return;
      }

      const budgetId =
        alert?.budget?.id ||
        (alert?.budget as unknown as { _id?: string })?._id ||
        budget?.id;
      const period = new Date();
      const periodKey = budgetId
        ? `budget-alert:${budgetId}:${period.getFullYear()}-${period.getMonth() + 1}`
        : null;

      if (!periodKey) {
        return;
      }

      if (!alert || !alert.notificationPayload) {
        notifiedCache.current[periodKey] = false;
        await AsyncStorage.removeItem(periodKey);
        return;
      }

      if (notifiedCache.current[periodKey]) {
        return;
      }

      const alreadyNotified = await AsyncStorage.getItem(periodKey);
      if (alreadyNotified === 'true') {
        notifiedCache.current[periodKey] = true;
        return;
      }

      await notificationService.sendBudgetAlertNotification(
        alert.notificationPayload.title,
        alert.notificationPayload.body,
        { severity: alert.notificationPayload.severity }
      );

      await userBudgetService.acknowledgeBudgetAlert({
        severity: alert.notificationPayload.severity,
        percentage: alert.percentage ?? 0,
      });

      notifiedCache.current[periodKey] = true;
      await AsyncStorage.setItem(periodKey, 'true');
    };

    void handleAlertNotification();
  }, [
    alert,
    budget,
    budgetNotificationsEnabled,
    notificationsEnabled,
  ]);
}

export type { UserBudget, UserBudgetStatus, SetUserBudgetInput, PetBreakdown };
export { extractErrorMessage };
