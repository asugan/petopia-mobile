import { useState, useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { notificationService, REMINDER_TIMES } from '../services/notificationService';
import { Event } from '../types';

/**
 * Custom hook for managing notifications
 */
export const useNotifications = () => {
  const [permissions, setPermissions] = useState<Notifications.NotificationPermissionsStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check initial permission status
  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    try {
      const nextPermissions = await Notifications.getPermissionsAsync();
      setPermissions(nextPermissions);
    } catch (error) {
      console.error('Error checking notification permission:', error);
    }
  };

  const requestPermission = useCallback(async () => {
    setIsLoading(true);
    try {
      const granted = await notificationService.requestPermissions();
      const nextPermissions = await Notifications.getPermissionsAsync();
      setPermissions(nextPermissions);
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const permissionStatus = permissions?.status ?? Notifications.PermissionStatus.UNDETERMINED;

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

  useEffect(() => {
    if (eventId) {
      loadScheduledReminders();
    }
  }, [eventId]);

  const loadScheduledReminders = async () => {
    if (!eventId) return;

    try {
      const reminders = await notificationService.getEventNotifications(eventId);
      setScheduledReminders(reminders);
    } catch (error) {
      console.error('Error loading scheduled reminders:', error);
    }
  };

  const scheduleReminder = useCallback(async (event: Event, reminderMinutes?: number) => {
    setIsLoading(true);
    try {
      const notificationId = await notificationService.scheduleEventReminder(event, reminderMinutes);
      if (notificationId) {
        await loadScheduledReminders();
        return notificationId;
      }
      return null;
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const scheduleMultipleReminders = useCallback(async (event: Event, reminderTimes: number[]) => {
    setIsLoading(true);
    try {
      const notificationIds = await notificationService.scheduleMultipleReminders(event, reminderTimes);
      await loadScheduledReminders();
      return notificationIds;
    } catch (error) {
      console.error('Error scheduling multiple reminders:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancelReminder = useCallback(async (notificationId: string) => {
    setIsLoading(true);
    try {
      await notificationService.cancelNotification(notificationId);
      await loadScheduledReminders();
    } catch (error) {
      console.error('Error cancelling reminder:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancelAllReminders = useCallback(async () => {
    if (!eventId) return;

    setIsLoading(true);
    try {
      await notificationService.cancelEventNotifications(eventId);
      await loadScheduledReminders();
    } catch (error) {
      console.error('Error cancelling all reminders:', error);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

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
    } catch (error) {
      console.error('Error loading notification stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, []);

  return {
    stats,
    isLoading,
    refreshStats: loadStats,
  };
};

// Export reminder times for convenience
export { REMINDER_TIMES };
