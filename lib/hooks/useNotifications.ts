import { useState, useEffect, useCallback, useMemo } from 'react';
import * as Notifications from 'expo-notifications';
import { notificationService, getReminderTimes } from '../services/notificationService';
import { Event } from '../types';
import { useEventReminderStore } from '@/stores/eventReminderStore';

/**
 * Custom hook for managing notifications
 */
export const useNotifications = () => {
  const [permissions, setPermissions] = useState<Notifications.NotificationPermissionsStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const quietHours = useEventReminderStore((state) => state.quietHours);

  const checkPermissionStatus = useCallback(async () => {
    try {
      const nextPermissions = await Notifications.getPermissionsAsync();
      setPermissions(nextPermissions);
    } catch {
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const initPermissions = async () => {
      try {
        const perms = await Notifications.getPermissionsAsync();
        if (isMounted) {
          setPermissions(perms);
        }
      } catch {
        // Silently handle permission check errors
      }
    };

    initPermissions();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    notificationService.setQuietHours(quietHours);
  }, [quietHours]);

  const requestPermission = useCallback(async () => {
    setIsLoading(true);
    try {
      const granted = await notificationService.requestPermissions();
      const nextPermissions = await Notifications.getPermissionsAsync();
      setPermissions(nextPermissions);
      return granted;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const permissionStatus = useMemo(
    () => permissions?.status ?? Notifications.PermissionStatus.UNDETERMINED,
    [permissions]
  );

  return {
    permissions,
    permissionStatus,
    isLoading,
    requestPermission,
    checkPermissionStatus,
  };
};

/**
 * Custom hook for managing event reminders
 */
export const useEventReminders = (eventId?: string) => {
  const [scheduledReminders, setScheduledReminders] = useState<Notifications.NotificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const quietHoursEnabled = useEventReminderStore((state) => state.quietHoursEnabled);
  const quietHours = useEventReminderStore((state) => state.quietHours);

  const loadScheduledReminders = useCallback(async () => {
    if (!eventId) return;

    try {
      const reminders = await notificationService.getEventNotifications(eventId);
      setScheduledReminders(reminders);
    } catch {
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) {
      loadScheduledReminders();
    }
  }, [eventId, loadScheduledReminders]);

  const scheduleReminder = useCallback(async (event: Event, reminderMinutes?: number) => {
    setIsLoading(true);
    try {
      notificationService.setQuietHours(quietHours);
      const notificationId = await notificationService.scheduleEventReminder(event, reminderMinutes, {
        respectQuietHours: quietHoursEnabled,
      });
      if (notificationId) {
        await loadScheduledReminders();
        return notificationId;
      }
      return null;
    } catch {
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [quietHours, quietHoursEnabled, loadScheduledReminders]);

  const scheduleMultipleReminders = useCallback(async (event: Event, reminderTimes: number[]) => {
    setIsLoading(true);
    try {
      notificationService.setQuietHours(quietHours);
      const notificationIds = await notificationService.scheduleMultipleReminders(event, reminderTimes, {
        respectQuietHours: quietHoursEnabled,
      });
      await loadScheduledReminders();
      return notificationIds;
    } catch {
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [quietHours, quietHoursEnabled, loadScheduledReminders]);

  const cancelReminder = useCallback(async (notificationId: string) => {
    setIsLoading(true);
    try {
      await notificationService.cancelNotification(notificationId);
      await loadScheduledReminders();
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, [loadScheduledReminders]);

  const cancelAllReminders = useCallback(async () => {
    if (!eventId) return;

    setIsLoading(true);
    try {
      await notificationService.cancelEventNotifications(eventId);
      await loadScheduledReminders();
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, [eventId, loadScheduledReminders]);

  return {
    scheduledReminders,
    isLoading,
    scheduleReminder,
    scheduleMultipleReminders,
    cancelReminder,
    cancelAllReminders,
    refreshReminders: loadScheduledReminders,
  };
};

/**
 * Custom hook for notification stats
 */
export const useNotificationStats = () => {
  const [stats, setStats] = useState<{ total: number; byType: Record<string, number> }>({
    total: 0,
    byType: {},
  });
  const [isLoading, setIsLoading] = useState(false);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const notificationStats = await notificationService.getNotificationStats();
      setStats(notificationStats);
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    isLoading,
    refreshStats: loadStats,
  };
};

// Export reminder times for convenience
export { getReminderTimes };
