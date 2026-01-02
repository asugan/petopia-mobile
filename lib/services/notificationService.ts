import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Event } from '../types';
import { EVENT_TYPE_DEFAULT_REMINDERS } from '../../constants/eventIcons';
import { REMINDER_PRESETS, QUIET_HOURS_WINDOW } from '@/constants/reminders';
import i18n from '@/lib/i18n';

/**
 * Notification Service - Handles all push notification operations
 *
 * Features:
 * - Event reminder scheduling
 * - Push notification permissions
 * - Notification channels (Android)
 * - Custom reminder times
 * - Notification history
 */

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface ReminderTime {
  value: number; // in minutes
  label: string;
}

interface ReminderTimeOption {
  value: number;
  labelKey: string;
}

const isNotificationPermissionGranted = (
  permissions: Notifications.NotificationPermissionsStatus
): boolean => {
  if (permissions.granted || permissions.status === Notifications.PermissionStatus.GRANTED) {
    return true;
  }

  const iosStatus = permissions.ios?.status;
  return (
    iosStatus === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    iosStatus === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    iosStatus === Notifications.IosAuthorizationStatus.EPHEMERAL
  );
};

const REMINDER_TIME_OPTIONS: ReminderTimeOption[] = [
  { value: 5, labelKey: 'notifications.reminderTimes.5m' },
  { value: 15, labelKey: 'notifications.reminderTimes.15m' },
  { value: 30, labelKey: 'notifications.reminderTimes.30m' },
  { value: 60, labelKey: 'notifications.reminderTimes.1h' },
  { value: 120, labelKey: 'notifications.reminderTimes.2h' },
  { value: 1440, labelKey: 'notifications.reminderTimes.1d' },
  { value: 2880, labelKey: 'notifications.reminderTimes.2d' },
  { value: 10080, labelKey: 'notifications.reminderTimes.1w' },
];

export const getReminderTimes = (
  t: (key: string, options?: Record<string, any>) => string = i18n.t.bind(i18n)
): ReminderTime[] =>
  REMINDER_TIME_OPTIONS.map((option) => ({
    value: option.value,
    label: t(option.labelKey),
  }));

export class NotificationService {
  private static instance: NotificationService;
  private eventChannelId = 'event-reminders';
  private budgetChannelId = 'budget-alerts';
  private quietHours = {
    startHour: QUIET_HOURS_WINDOW.startHour,
    startMinute: QUIET_HOURS_WINDOW.startMinute,
    endHour: QUIET_HOURS_WINDOW.endHour,
    endMinute: QUIET_HOURS_WINDOW.endMinute,
  };
  private notificationChannelPromise: Promise<void> | null = null;
  private navigationHandler?: (target: { pathname: string; params?: Record<string, string> } | string) => void;

  private constructor() {
    this.notificationChannelPromise = this.setupNotificationChannel();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Setup notification channel for Android
   */
  private async setupNotificationChannel() {
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync(this.eventChannelId, {
          name: 'Event Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FFB3D1',
          sound: 'default',
          description: 'Notifications for pet care events and activities',
        });
        await Notifications.setNotificationChannelAsync(this.budgetChannelId, {
          name: 'Budget Alerts',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250],
          lightColor: '#FFD166',
          sound: 'default',
          description: 'Notifications for budget alerts and limits',
        });
      } catch (error) {
        console.error('❌ Error setting notification channel:', error);
      }
    }
  }

  private async ensureNotificationChannel(): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }

    if (!this.notificationChannelPromise) {
      this.notificationChannelPromise = this.setupNotificationChannel();
    }

    await this.notificationChannelPromise;
  }

  setNavigationHandler(
    handler: (target: { pathname: string; params?: Record<string, string> } | string) => void
  ) {
    this.navigationHandler = handler;
  }

  setQuietHours(quietHours: {
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
  }) {
    this.quietHours = quietHours;
  }

  /**
   * Request notification permissions
   * @returns Permission status
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const existingPermissions = await Notifications.getPermissionsAsync();
      if (isNotificationPermissionGranted(existingPermissions)) {
        return true;
      }

      const updatedPermissions = await Notifications.requestPermissionsAsync();
      if (!isNotificationPermissionGranted(updatedPermissions)) {
        console.warn('📵 Notification permission denied');
        return false;
      }

      console.log('✅ Notification permission granted');
      return true;
    } catch (error) {
      console.error('❌ Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Check if notifications are enabled
   * @returns True if enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      const permissions = await Notifications.getPermissionsAsync();
      return isNotificationPermissionGranted(permissions);
    } catch (error) {
      console.error('❌ Error checking notification status:', error);
      return false;
    }
  }

  /**
   * Schedule a reminder for an event
   * @param event Event to schedule reminder for
   * @param reminderMinutes Minutes before event to send reminder
   * @param options Additional scheduling options
   * @returns Notification identifier
   */
  async scheduleEventReminder(
    event: Event,
    reminderMinutes?: number,
    options?: { triggerDate?: Date; respectQuietHours?: boolean }
  ): Promise<string | null> {
    try {
      // Check permissions first
      const hasPermission = await this.areNotificationsEnabled();
      if (!hasPermission) {
        console.warn('📵 Notifications not enabled, cannot schedule reminder');
        return null;
      }

      // Get default reminder time for event type if not specified
      const reminderTime = reminderMinutes ||
        EVENT_TYPE_DEFAULT_REMINDERS[event.type as keyof typeof EVENT_TYPE_DEFAULT_REMINDERS] ||
        60;

      // Calculate trigger time
      const eventDate = new Date(event.startTime);
      let triggerDate = options?.triggerDate
        ? options.triggerDate
        : new Date(eventDate.getTime() - reminderTime * 60 * 1000);

      if (
        !options?.triggerDate &&
        (options?.respectQuietHours ?? true) &&
        reminderTime !== 0
      ) {
        triggerDate = this.adjustForQuietHours(triggerDate);
      }

      // Don't schedule if trigger time is in the past or after the event
      if (triggerDate <= new Date()) {
        console.warn('⚠️ Reminder time is in the past, not scheduling');
        return null;
      }
      if (triggerDate > eventDate) {
        console.warn('⚠️ Reminder time is after event time, not scheduling');
        return null;
      }

      // Get event type emoji
      const eventTypeEmoji = this.getEventTypeEmoji(event.type);
      const eventTypeLabel = i18n.t(`eventTypes.${event.type}`, event.type);
      const notificationTitle = event.title?.trim()
        ? `${eventTypeEmoji} ${event.title}`
        : i18n.t('notifications.reminderTitle', {
          eventType: eventTypeLabel,
          emoji: eventTypeEmoji,
        });
      const notificationBody = event.description || i18n.t('notifications.reminderBody', {
        eventType: eventTypeLabel,
      });

      // Schedule notification
      await this.ensureNotificationChannel();
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationTitle,
          body: notificationBody,
          data: {
            eventId: event._id,
            petId: event.petId,
            eventType: event.type,
            screen: 'event',
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: 'event-reminder',
        },
        trigger: {
          date: triggerDate,
          channelId: this.eventChannelId,
        },
      });

      console.log(`✅ Scheduled reminder for event ${event._id}: ${notificationId}`);
      console.log(`   Trigger time: ${triggerDate.toISOString()}`);
      console.log(`   Event time: ${eventDate.toISOString()}`);

      return notificationId;
    } catch (error) {
      console.error('❌ Error scheduling event reminder:', error);
      return null;
    }
  }

  /**
   * Cancel a scheduled notification
   * @param notificationId Notification identifier to cancel
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log(`✅ Cancelled notification: ${notificationId}`);
    } catch (error) {
      console.error('❌ Error cancelling notification:', error);
    }
  }

  /**
   * Cancel all notifications for a specific event
   * @param eventId Event ID
   */
  async cancelEventNotifications(eventId: string): Promise<void> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

      const eventNotifications = scheduledNotifications.filter(
        notification => notification.content.data?.eventId === eventId
      );

      for (const notification of eventNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }

      console.log(`✅ Cancelled ${eventNotifications.length} notifications for event ${eventId}`);
    } catch (error) {
      console.error('❌ Error cancelling event notifications:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('✅ Cancelled all scheduled notifications');
    } catch (error) {
      console.error('❌ Error cancelling all notifications:', error);
    }
  }

  /**
   * Get all scheduled notifications
   * @returns List of scheduled notifications
   */
  async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log(`📋 Found ${notifications.length} scheduled notifications`);
      return notifications;
    } catch (error) {
      console.error('❌ Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Get scheduled notifications for a specific event
   * @param eventId Event ID
   * @returns List of notifications for the event
   */
  async getEventNotifications(eventId: string): Promise<Notifications.NotificationRequest[]> {
    try {
      const allNotifications = await this.getAllScheduledNotifications();
      return allNotifications.filter(
        notification => notification.content.data?.eventId === eventId
      );
    } catch (error) {
      console.error('❌ Error getting event notifications:', error);
      return [];
    }
  }

  /**
   * Schedule multiple reminders for an event
   * @param event Event to schedule reminders for
   * @param reminderTimes Array of reminder times in minutes
   * @returns Array of notification identifiers
   */
  async scheduleMultipleReminders(
    event: Event,
    reminderTimes: readonly number[],
    options?: { respectQuietHours?: boolean }
  ): Promise<string[]> {
    const hasPermission = await this.areNotificationsEnabled();
    if (!hasPermission) {
      console.warn('📵 Notifications not enabled, skipping reminder schedule');
      return [];
    }

    const notificationIds: string[] = [];
    const seenTimes = new Set<number>();
    const respectQuietHours = options?.respectQuietHours ?? true;
    const now = new Date();
    const eventDate = new Date(event.startTime);

    for (const reminderTime of reminderTimes) {
      const triggerDate = new Date(eventDate.getTime() - reminderTime * 60 * 1000);
      const adjustedTrigger = respectQuietHours && reminderTime !== 0
        ? this.adjustForQuietHours(triggerDate)
        : triggerDate;

      if (adjustedTrigger > eventDate) {
        continue;
      }

      if (adjustedTrigger <= now) {
        continue;
      }

      const triggerKey = adjustedTrigger.getTime();
      if (seenTimes.has(triggerKey)) {
        continue;
      }

      seenTimes.add(triggerKey);
      const notificationId = await this.scheduleEventReminder(event, reminderTime, {
        triggerDate: adjustedTrigger,
      });
      if (notificationId) {
        notificationIds.push(notificationId);
      }
    }

    console.log(`✅ Scheduled ${notificationIds.length} reminders for event ${event._id}`);
    return notificationIds;
  }

  /**
   * Schedule default reminder chain with quiet hours
   */
  async scheduleReminderChain(
    event: Event,
    reminderTimes: readonly number[] = REMINDER_PRESETS.standard.minutes,
    respectQuietHours: boolean = true
  ): Promise<string[]> {
    return this.scheduleMultipleReminders(event, reminderTimes, { respectQuietHours });
  }

  /**
   * Send an immediate notification (for testing or instant notifications)
   * @param title Notification title
   * @param body Notification body
   * @param data Additional data
   */
  async sendImmediateNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<string> {
    try {
      await this.ensureNotificationChannel();
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: 'default',
        },
        trigger: Platform.OS === 'android' ? { channelId: this.eventChannelId } : null,
      });

      console.log(`✅ Sent immediate notification: ${notificationId}`);
      return notificationId;
    } catch (error) {
      console.error('❌ Error sending immediate notification:', error);
      throw error;
    }
  }

  /**
   * Send an immediate notification for budget/emergency alerts with permission guard
   */
  async sendBudgetAlertNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    const enabled = await this.areNotificationsEnabled();
    if (!enabled) {
      console.warn('📵 Notifications disabled, skipping budget alert');
      return;
    }

    await this.ensureNotificationChannel();
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          ...(data || {}),
          screen: 'budget',
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: Platform.OS === 'android' ? { channelId: this.budgetChannelId } : null,
    });
  }

  /**
   * Get event type emoji for notifications
   * @param eventType Event type
   * @returns Emoji string
   */
  private getEventTypeEmoji(eventType: string): string {
    const emojiMap: Record<string, string> = {
      feeding: '🍽️',
      exercise: '🏃',
      grooming: '✂️',
      play: '🎾',
      training: '🎓',
      vet_visit: '🏥',
      walk: '🚶',
      bath: '🛁',
      other: '📅',
    };

    return emojiMap[eventType] || '📅';
  }

  /**
   * Handle notification received in foreground
   * @param notification Received notification
   */
  handleNotificationReceived(notification: Notifications.Notification): void {
    console.log('📬 Notification received:', notification);
    // You can add custom logic here, like showing an in-app alert
  }

  /**
   * Handle notification response (user tapped notification)
   * @param response Notification response
   */
  handleNotificationResponse(response: Notifications.NotificationResponse): void {
    console.log('👆 Notification tapped:', response);

    const data = response.notification.request.content.data;

    // You can navigate to specific screens based on notification data
    if (data?.screen === 'event' && data?.eventId) {
      if (this.navigationHandler) {
        this.navigationHandler({
          pathname: '/event/[id]',
          params: { id: String(data.eventId) },
        });
      } else {
        console.log(`Navigate to event: ${data.eventId}`);
      }
      return;
    }

    if (data?.screen === 'budget') {
      if (this.navigationHandler) {
        this.navigationHandler('/(tabs)/finance');
      }
    }
  }

  /**
   * Get notification statistics
   * @returns Notification statistics
   */
  async getNotificationStats(): Promise<{
    total: number;
    byType: Record<string, number>;
  }> {
    try {
      const notifications = await this.getAllScheduledNotifications();

      const stats = {
        total: notifications.length,
        byType: {} as Record<string, number>,
      };

      for (const notification of notifications) {
        const eventType = notification.content.data?.eventType as string;
        if (eventType) {
          stats.byType[eventType] = (stats.byType[eventType] || 0) + 1;
        }
      }

      return stats;
    } catch (error) {
      console.error('❌ Error getting notification stats:', error);
      return { total: 0, byType: {} };
    }
  }

  /**
   * Push triggers out of quiet hours (22:00–08:00)
   */
  private adjustForQuietHours(triggerDate: Date): Date {
    const adjusted = new Date(triggerDate);
    const triggerMinutes = triggerDate.getHours() * 60 + triggerDate.getMinutes();
    const startMinutes =
      this.quietHours.startHour * 60 + this.quietHours.startMinute;
    const endMinutes =
      this.quietHours.endHour * 60 + this.quietHours.endMinute;
    const crossesMidnight = startMinutes > endMinutes;
    const inQuietHours = startMinutes === endMinutes
      ? false
      : crossesMidnight
        ? triggerMinutes >= startMinutes || triggerMinutes < endMinutes
        : triggerMinutes >= startMinutes && triggerMinutes < endMinutes;

    if (!inQuietHours) {
      return triggerDate;
    }

    if (crossesMidnight && triggerMinutes >= startMinutes) {
      adjusted.setDate(adjusted.getDate() + 1);
    }

    adjusted.setHours(this.quietHours.endHour, this.quietHours.endMinute, 0, 0);
    return adjusted;
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();

// Export helper functions
export const requestNotificationPermissions = () =>
  notificationService.requestPermissions();

export const scheduleEventReminder = (event: Event, reminderMinutes?: number) =>
  notificationService.scheduleEventReminder(event, reminderMinutes);

export const cancelEventNotifications = (eventId: string) =>
  notificationService.cancelEventNotifications(eventId);

export const scheduleReminderChain = (
  event: Event,
  reminderTimes?: readonly number[],
  respectQuietHours?: boolean
) => notificationService.scheduleReminderChain(event, reminderTimes, respectQuietHours);
