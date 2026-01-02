import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Event } from '../types';
import { EVENT_TYPE_DEFAULT_REMINDERS } from '../../constants/eventIcons';
import { REMINDER_PRESETS, QUIET_HOURS_WINDOW } from '@/constants/reminders';

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

export const REMINDER_TIMES: ReminderTime[] = [
  { value: 5, label: '5 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 120, label: '2 hours before' },
  { value: 1440, label: '1 day before' },
  { value: 2880, label: '2 days before' },
  { value: 10080, label: '1 week before' },
];

export class NotificationService {
  private static instance: NotificationService;
  private notificationChannelId = 'event-reminders';
  private quietHours = {
    startHour: QUIET_HOURS_WINDOW.startHour,
    endHour: QUIET_HOURS_WINDOW.endHour,
  };
  private notificationChannelPromise: Promise<void> | null = null;

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
        await Notifications.setNotificationChannelAsync(this.notificationChannelId, {
          name: 'Event Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FFB3D1',
          sound: 'default',
          description: 'Notifications for pet care events and activities',
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

      if (!options?.triggerDate && (options?.respectQuietHours ?? true)) {
        triggerDate = this.adjustForQuietHours(triggerDate);
      }

      // Don't schedule if trigger time is in the past
      if (triggerDate <= new Date()) {
        console.warn('⚠️ Reminder time is in the past, not scheduling');
        return null;
      }

      // Get event type emoji
      const eventTypeEmoji = this.getEventTypeEmoji(event.type);

      // Schedule notification
      await this.ensureNotificationChannel();
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${eventTypeEmoji} ${event.title}`,
          body: event.description || `Reminder for your pet's ${event.type} event`,
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
          channelId: this.notificationChannelId,
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
    const notificationIds: string[] = [];
    const seenTimes = new Set<number>();
    const respectQuietHours = options?.respectQuietHours ?? true;
    const now = new Date();
    const eventDate = new Date(event.startTime);

    for (const reminderTime of reminderTimes) {
      const triggerDate = new Date(eventDate.getTime() - reminderTime * 60 * 1000);
      const adjustedTrigger = respectQuietHours
        ? this.adjustForQuietHours(triggerDate)
        : triggerDate;

      if (adjustedTrigger >= eventDate) {
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
        trigger: null, // Send immediately
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
        data: data || {},
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
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
      // Navigate to event detail screen
      console.log(`Navigate to event: ${data.eventId}`);
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
    const hour = triggerDate.getHours();
    const inQuietHours =
      hour >= this.quietHours.startHour || hour < this.quietHours.endHour;

    if (!inQuietHours) {
      return triggerDate;
    }

    if (hour >= this.quietHours.startHour) {
      adjusted.setDate(adjusted.getDate() + 1);
      adjusted.setHours(this.quietHours.endHour, 0, 0, 0);
    } else {
      adjusted.setHours(this.quietHours.endHour, 0, 0, 0);
    }
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
