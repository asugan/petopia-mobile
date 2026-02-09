import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { feedingScheduleService, type FeedingNotification } from '../services/feedingScheduleService';
import { getNotificationDeliveryChannel, scheduleFeedingReminder, cancelFeedingReminder } from '../services/notificationService';
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import { createQueryKeys } from './core/createQueryKeys';
import { useConditionalQuery } from './core/useConditionalQuery';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';
import { FeedingSchedule } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CACHE_TIMES } from '../config/queryConfig';
import { useUserTimezone } from './useUserTimezone';
import { toLocalDateKey } from '@/lib/utils/timezoneDate';

// ============================================================================
// QUERY KEYS
// ============================================================================

const baseFeedingReminderKeys = createQueryKeys('feeding-reminders');

export const feedingReminderKeys = {
  ...baseFeedingReminderKeys,
  notifications: (scheduleId: string) => [...baseFeedingReminderKeys.all, 'notifications', scheduleId] as const,
  pending: () => [...baseFeedingReminderKeys.all, 'pending'] as const,
};

// ============================================================================
// TYPES
// ============================================================================

export type FeedingReminderSettings = {
  enabled: boolean;
  feedingRemindersEnabled: boolean;
  notificationsEnabled: boolean;
};

export type FeedingReminderWithSchedule = {
  schedule: FeedingSchedule;
  notificationId?: string;
  scheduledFor?: Date;
  isPending: boolean;
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook for getting feeding reminder settings from user settings
 */
export function useFeedingReminderSettings() {
  const feedingRemindersEnabled = useUserSettingsStore(
    (state) => state.settings?.feedingRemindersEnabled ?? true
  );
  const notificationsEnabled = useUserSettingsStore(
    (state) => state.settings?.notificationsEnabled ?? true
  );

  return {
    enabled: feedingRemindersEnabled && notificationsEnabled,
    feedingRemindersEnabled,
    notificationsEnabled,
  };
}

/**
 * Hook for fetching notifications for a specific feeding schedule
 */
export function useFeedingScheduleNotifications(scheduleId: string) {
  const { enabled } = useAuthQueryEnabled();

  return useConditionalQuery<FeedingNotification[]>({
    queryKey: feedingReminderKeys.notifications(scheduleId),
    queryFn: async () => {
      const res = await feedingScheduleService.getFeedingScheduleNotifications(scheduleId);
      if (res.success && res.data) {
        return { success: true, data: res.data.notifications };
      }
      return { success: false, data: [], error: res.error };
    },
    staleTime: CACHE_TIMES.SHORT,
    gcTime: CACHE_TIMES.MEDIUM,
    enabled: enabled && !!scheduleId,
    defaultValue: [],
  });
}

/**
 * Hook for managing local feeding reminders
 * Uses local notifications as fallback when backend push is not available
 */
export function useFeedingReminders() {
  const { enabled } = useFeedingReminderSettings();
  const userTimezone = useUserTimezone();
  const [pushTokenRegistered, setPushTokenRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const remindedSchedules = useRef<Record<string, boolean>>({});

  // Check if push token is registered with backend
  const checkPushTokenStatus = useCallback(async () => {
    try {
      const deliveryChannel = await getNotificationDeliveryChannel();
      setPushTokenRegistered(deliveryChannel === 'backend');
    } catch {
      setPushTokenRegistered(false);
    }
  }, []);

  useEffect(() => {
    checkPushTokenStatus();
  }, [checkPushTokenStatus]);

  // Clear reminded schedules cache on day change to prevent memory leak
  useEffect(() => {
    const LAST_CLEAR_KEY = '__lastClearDate__';

    const clearCacheOnDayChange = () => {
      const today = toLocalDateKey(new Date(), userTimezone);
      const lastClearDate = (remindedSchedules.current as Record<string, boolean | string>)[LAST_CLEAR_KEY] as string | undefined;
      
      if (lastClearDate !== today) {
        // Clear all entries and set date marker
        const newCache: Record<string, boolean | string> = {};
        newCache[LAST_CLEAR_KEY] = today;
        remindedSchedules.current = newCache as Record<string, boolean>;
      }
    };

    clearCacheOnDayChange();

    // Check every hour for day change
    const interval = setInterval(clearCacheOnDayChange, 60 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [userTimezone]);

  /**
   * Schedule a local feeding reminder
   */
  const scheduleLocalReminder = useCallback(
    async (schedule: FeedingSchedule, reminderMinutes: number = 15) => {
      if (!enabled || pushTokenRegistered) {
        return null;
      }

      const scheduleKey = `feeding-reminder:${schedule._id}:${reminderMinutes}`;

      // Check if already reminded today
      const today = toLocalDateKey(new Date(), userTimezone);
      const lastReminded = await AsyncStorage.getItem(`${scheduleKey}:date`);
      if (lastReminded === today && remindedSchedules.current[scheduleKey]) {
        return null;
      }

      const notificationId = await scheduleFeedingReminder(schedule, reminderMinutes);

      if (notificationId) {
        remindedSchedules.current[scheduleKey] = true;
        await AsyncStorage.setItem(`${scheduleKey}:date`, today);
        await AsyncStorage.setItem(scheduleKey, notificationId);
      }

      return notificationId;
    },
    [enabled, pushTokenRegistered, userTimezone]
  );

  /**
   * Cancel a local feeding reminder
   */
  const cancelLocalReminder = useCallback(async (schedule: FeedingSchedule, reminderMinutes: number = 15) => {
    const scheduleKey = `feeding-reminder:${schedule._id}:${reminderMinutes}`;
    const notificationId = await AsyncStorage.getItem(scheduleKey);

    if (notificationId) {
      await cancelFeedingReminder(notificationId);
      await AsyncStorage.removeItem(scheduleKey);
      await AsyncStorage.removeItem(`${scheduleKey}:date`);
      remindedSchedules.current[scheduleKey] = false;
    }
  }, []);

  /**
   * Trigger a manual reminder via backend
   */
  const triggerBackendReminder = useMutation({
    mutationFn: ({ scheduleId, reminderMinutes }: { scheduleId: string; reminderMinutes: number }) =>
      feedingScheduleService.triggerFeedingReminder(scheduleId, { reminderMinutes }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: feedingReminderKeys.notifications(variables.scheduleId),
      });
    },
  });

  /**
   * Mark feeding as completed via backend
   */
  const completeFeeding = useMutation({
    mutationFn: (scheduleId: string) => feedingScheduleService.completeFeeding(scheduleId),
    onSuccess: (_, scheduleId) => {
      queryClient.invalidateQueries({ queryKey: feedingReminderKeys.notifications(scheduleId) });
      queryClient.invalidateQueries({ queryKey: ['feeding-schedules'] });
      queryClient.invalidateQueries({ queryKey: feedingReminderKeys.pending() });
    },
  });

  /**
   * Schedule reminder with automatic fallback
   * Tries backend first, falls back to local if not registered
   */
  const scheduleReminder = useCallback(
    async (schedule: FeedingSchedule, reminderMinutes: number = 15) => {
      setIsLoading(true);
      try {
        const deliveryChannel = await getNotificationDeliveryChannel();
        const useBackend = deliveryChannel === 'backend';
        setPushTokenRegistered(useBackend);

        if (useBackend) {
          // Backend handles push notifications
          return await triggerBackendReminder.mutateAsync({ scheduleId: schedule._id, reminderMinutes });
        } else {
          // Use local notifications as fallback
          return await scheduleLocalReminder(schedule, reminderMinutes);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [scheduleLocalReminder, triggerBackendReminder]
  );

  /**
   * Cancel reminder with automatic fallback
   */
  const cancelReminder = useCallback(
    async (schedule: FeedingSchedule, reminderMinutes: number = 15) => {
      if (pushTokenRegistered) {
        // Backend handles cancellation
        // (Could add an endpoint for this if needed)
        return;
      } else {
        // Use local cancellation
        return cancelLocalReminder(schedule, reminderMinutes);
      }
    },
    [pushTokenRegistered, cancelLocalReminder]
  );

  return {
    // State
    pushTokenRegistered,
    isLoading,
    enabled,

    // Local reminder functions
    scheduleLocalReminder,
    cancelLocalReminder,

    // Backend functions
    triggerBackendReminder,
    completeFeeding,

    // Unified functions with fallback
    scheduleReminder,
    cancelReminder,

    // Helper
    checkPushTokenStatus,
  };
}

/**
 * Hook for managing feeding schedule with reminders
 * Combines schedule data with reminder functionality
 */
export function useFeedingScheduleWithReminders(scheduleId: string) {
  const { data: schedule } = useConditionalQuery<FeedingSchedule | null>({
    queryKey: ['feeding-schedule', scheduleId],
    queryFn: async () => {
      const res = await feedingScheduleService.getFeedingScheduleById(scheduleId);
      if (res.success) {
        return { success: true, data: res.data ?? null };
      }
      return { success: false, data: null, error: res.error };
    },
    staleTime: CACHE_TIMES.LONG,
    gcTime: CACHE_TIMES.LONG,
    enabled: !!scheduleId,
    defaultValue: null,
  });

  const { data: notifications = [] } = useFeedingScheduleNotifications(scheduleId);
  const feedingReminders = useFeedingReminders();
  const { scheduleReminder, cancelReminder, completeFeeding, pushTokenRegistered, enabled, triggerBackendReminder } =
    feedingReminders;

  const pendingNotification = notifications.find((n) => n.status === 'pending');

  const handleCompleteFeeding = useCallback(async () => {
    if (!schedule) return;
    await completeFeeding.mutateAsync(schedule._id);
  }, [completeFeeding, schedule]);

  const handleScheduleReminder = useCallback(
    async (reminderMinutes: number = 15) => {
      if (!schedule) return;
      await scheduleReminder(schedule, reminderMinutes);
    },
    [scheduleReminder, schedule]
  );

  const handleCancelReminder = useCallback(async () => {
    if (!schedule) return;
    await cancelReminder(schedule);
  }, [cancelReminder, schedule]);

  return {
    schedule,
    notifications,
    pendingNotification,
    isReminderScheduled: !!pendingNotification,
    isReminderScheduledFor: pendingNotification
      ? new Date(pendingNotification.scheduledFor)
      : null,
    pushTokenRegistered,
    enabled,

    // Actions
    completeFeeding: handleCompleteFeeding,
    scheduleReminder: handleScheduleReminder,
    cancelReminder: handleCancelReminder,

    // Mutation states
    isCompleting: completeFeeding.isPending,
    isScheduling: triggerBackendReminder.isPending,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================
