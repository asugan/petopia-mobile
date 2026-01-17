import { useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  BudgetAlert,
  PetBreakdown,
  SetUserBudgetInput,
  UserBudget,
  UserBudgetStatus,
} from "../types";
import { CACHE_TIMES } from "../config/queryConfig";
import { userBudgetService } from "../services/userBudgetService";
import { notificationService } from "../services/notificationService";
import { useUserSettingsStore } from "@/stores/userSettingsStore";
import { createQueryKeys } from "./core/createQueryKeys";
import { useConditionalQuery } from "./core/useConditionalQuery";
import { useProQueryEnabled } from "./useSubscriptionQueries";

// Query keys factory for user budget
const baseUserBudgetKeys = createQueryKeys("budget");

// Extended query keys with custom keys for user budget operations
export const userBudgetKeys = {
  ...baseUserBudgetKeys,
  status: () => [...baseUserBudgetKeys.all, "status"] as const,
  alerts: () => [...baseUserBudgetKeys.all, "alerts"] as const,
  petBreakdown: () => [...baseUserBudgetKeys.all, "pet-breakdown"] as const,
  isActive: () => [...baseUserBudgetKeys.all, "is-active"] as const,
  summary: () => [...baseUserBudgetKeys.all, "summary"] as const,
};

/**
 * Hook for fetching current user's budget
 * Returns the user's single budget with proper caching
 */
export function useUserBudget() {
  const { enabled } = useProQueryEnabled();

  return useConditionalQuery<UserBudget | null>({
    queryKey: userBudgetKeys.all,
    queryFn: () => userBudgetService.getBudget(),
    staleTime: CACHE_TIMES.MEDIUM,
    gcTime: CACHE_TIMES.LONG,
    enabled,
    defaultValue: null,
    errorMessage: "User budget could not be loaded",
  });
}

/**
 * Hook for fetching budget status with current spending and pet breakdown
 * Depends on budget data and provides comprehensive spending analysis
 */
export function useUserBudgetStatus() {
  const { enabled } = useProQueryEnabled();
  const { data: budget } = useUserBudget();

  return useConditionalQuery<UserBudgetStatus | null>({
    queryKey: userBudgetKeys.status(),
    queryFn: () => userBudgetService.getBudgetStatus(),
    staleTime: CACHE_TIMES.SHORT,
    gcTime: CACHE_TIMES.MEDIUM,
    enabled: enabled && !!budget && budget.isActive,
    defaultValue: null,
    errorMessage: "Budget status could not be loaded",
  });
}

/**
 * Hook for setting/updating user budget (UPSERT operation)
 * Includes optimistic updates and proper cache invalidation
 */
export function useSetUserBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SetUserBudgetInput) =>
      userBudgetService.setBudget(data).then((res) => res.data!),

    // Optimistic update
    onMutate: async (newBudgetData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: userBudgetKeys.all });

      // Snapshot the previous value
      const previousBudget = queryClient.getQueryData(userBudgetKeys.all);

      // Optimistically update to the new value
      queryClient.setQueryData(userBudgetKeys.all, (old: UserBudget | null) => {
        if (!old) {
          // Create optimistic budget for new budgets
          return {
            id: "temp-id",
            userId: "current-user",
            amount: newBudgetData.amount,
            currency: newBudgetData.currency,
            alertThreshold: newBudgetData.alertThreshold ?? 0.8,
            isActive: newBudgetData.isActive ?? true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as UserBudget;
        }

        // Update existing budget
        return {
          ...old,
          amount: newBudgetData.amount,
          currency: newBudgetData.currency,
          alertThreshold: newBudgetData.alertThreshold ?? old.alertThreshold,
          isActive: newBudgetData.isActive ?? old.isActive,
          updatedAt: new Date().toISOString(),
        } as UserBudget;
      });

      return { previousBudget };
    },

    // Rollback on error
    onError: (err, newBudgetData, context) => {
      if (context?.previousBudget) {
        queryClient.setQueryData(userBudgetKeys.all, context.previousBudget);
      }
    },

    // Refetch on success
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: userBudgetKeys.status() });
      queryClient.invalidateQueries({ queryKey: userBudgetKeys.alerts() });
      queryClient.invalidateQueries({
        queryKey: userBudgetKeys.petBreakdown(),
      });
      queryClient.invalidateQueries({ queryKey: userBudgetKeys.isActive() });
      queryClient.invalidateQueries({ queryKey: userBudgetKeys.summary() });
    },

    // Always refetch after settle
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userBudgetKeys.all });
    },
  });
}

/**
 * Hook for deleting user budget
 * Includes optimistic updates and comprehensive cache cleanup
 */
export function useDeleteUserBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => userBudgetService.deleteBudget().then((res) => res.data),

    // Optimistic update
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: userBudgetKeys.all });

      // Snapshot the previous value
      const previousBudget = queryClient.getQueryData(userBudgetKeys.all);

      // Optimistically remove the budget
      queryClient.setQueryData(userBudgetKeys.all, null);

      return { previousBudget };
    },

    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previousBudget) {
        queryClient.setQueryData(userBudgetKeys.all, context.previousBudget);
      }
    },

    // Clear all related queries on success
    onSuccess: () => {
      // Clear all budget-related queries
      queryClient.setQueryData(userBudgetKeys.status(), null);
      queryClient.setQueryData(userBudgetKeys.alerts(), null);
      queryClient.setQueryData(userBudgetKeys.petBreakdown(), null);
      queryClient.setQueryData(userBudgetKeys.isActive(), false);
      queryClient.setQueryData(userBudgetKeys.summary(), null);

      // Remove queries from cache
      queryClient.removeQueries({ queryKey: userBudgetKeys.status() });
      queryClient.removeQueries({ queryKey: userBudgetKeys.alerts() });
      queryClient.removeQueries({ queryKey: userBudgetKeys.petBreakdown() });
      queryClient.removeQueries({ queryKey: userBudgetKeys.isActive() });
      queryClient.removeQueries({ queryKey: userBudgetKeys.summary() });
    },

    // Always refetch after settle
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userBudgetKeys.all });
    },
  });
}

/**
 * Hook for checking budget alerts
 * Returns alert information with short cache time for real-time monitoring
 */
export function useBudgetAlerts() {
  const { enabled } = useProQueryEnabled();
  const { data: budget } = useUserBudget();
  const notificationsEnabled = useUserSettingsStore(
    (state) => state.settings?.notificationsEnabled ?? true
  );
  const budgetNotificationsEnabled = useUserSettingsStore(
    (state) => state.settings?.budgetNotificationsEnabled ?? true
  );

  return useConditionalQuery<BudgetAlert | null>({
    queryKey: userBudgetKeys.alerts(),
    queryFn: () => userBudgetService.checkBudgetAlerts(),
    staleTime: CACHE_TIMES.VERY_SHORT,
    gcTime: CACHE_TIMES.SHORT,
    enabled: enabled && !!budget && budget.isActive && notificationsEnabled && budgetNotificationsEnabled,
    refetchInterval: CACHE_TIMES.VERY_SHORT, // Refetch every 30 seconds for real-time alerts
    defaultValue: null,
    errorMessage: "Budget alerts could not be checked",
  });
}

/**
 * Hook for getting pet spending breakdown
 * Extracted from budget status for focused pet-specific spending analysis
 */
export function usePetSpendingBreakdown() {
  const { enabled } = useProQueryEnabled();
  const { data: budget } = useUserBudget();

  return useConditionalQuery<PetBreakdown[]>({
    queryKey: userBudgetKeys.petBreakdown(),
    queryFn: () => userBudgetService.getPetSpendingBreakdown(),
    staleTime: CACHE_TIMES.SHORT,
    gcTime: CACHE_TIMES.MEDIUM,
    enabled: enabled && !!budget && budget.isActive,
    defaultValue: [],
    errorMessage: "Pet spending breakdown could not be loaded",
  });
}

/**
 * Hook for checking if user has an active budget
 * Quick boolean check for conditional rendering and feature access
 */
export function useHasActiveBudget() {
  const { enabled } = useProQueryEnabled();

  return useConditionalQuery<boolean>({
    queryKey: userBudgetKeys.isActive(),
    queryFn: () => userBudgetService.hasActiveBudget(),
    staleTime: CACHE_TIMES.MEDIUM,
    gcTime: CACHE_TIMES.LONG,
    enabled,
    defaultValue: false,
    errorMessage: "Active budget status could not be checked",
  });
}

/**
 * Hook for getting comprehensive budget summary
 * Combines budget info, status, and alerts for dashboard views
 */
export function useBudgetSummary() {
  const { enabled } = useProQueryEnabled();

  return useConditionalQuery<{
    budget: UserBudget | null;
    status: UserBudgetStatus | null;
    hasActiveBudget: boolean;
    alerts: BudgetAlert | null;
  } | null>({
    queryKey: userBudgetKeys.summary(),
    queryFn: () => userBudgetService.getBudgetSummary(),
    staleTime: CACHE_TIMES.SHORT,
    gcTime: CACHE_TIMES.MEDIUM,
    enabled,
    defaultValue: null,
    errorMessage: "Budget summary could not be loaded",
  });
}

/**
 * Hook that bridges budget alerts to local notifications
 */
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
      if (alreadyNotified === "true") {
        notifiedCache.current[periodKey] = true;
        return;
      }

      await notificationService.sendBudgetAlertNotification(
        alert.notificationPayload.title,
        alert.notificationPayload.body,
        { severity: alert.notificationPayload.severity }
      );

      notifiedCache.current[periodKey] = true;
      await AsyncStorage.setItem(periodKey, "true");
    };

    void handleAlertNotification();
  }, [alert, budget, budgetNotificationsEnabled, notificationsEnabled]);
}

// Export types for external use
export type { UserBudget, UserBudgetStatus, SetUserBudgetInput, PetBreakdown };
