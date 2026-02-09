import * as Notifications from 'expo-notifications';
import type { Href } from 'expo-router';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Event, FeedingSchedule } from '../types';
import { EVENT_TYPE_DEFAULT_REMINDERS } from '../../constants/eventIcons';
import { QUIET_HOURS_WINDOW } from '@/constants/reminders';
import { EVENT_REMINDER_PRESET_MINUTES, NOTIFICATION_CHANNELS, NOTIFICATION_SCREENS } from '@/constants/notificationContract';
import i18n from '@/lib/i18n';
import * as SecureStore from 'expo-secure-store';
import { api } from '../api/client';
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import { toZonedTime, fromZonedTime, formatInTimeZone as formatInTimeZoneTz } from 'date-fns-tz';
import { calculateNextFeedingTime } from '@/lib/utils/feedingReminderTime';
import { resolveEffectiveTimezone } from '@/lib/utils/timezone';

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

type NotificationTarget = Href | null;

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
  t: (key: string, options?: Record<string, unknown>) => string = i18n.t.bind(i18n)
): ReminderTime[] =>
  REMINDER_TIME_OPTIONS.map((option) => ({
    value: option.value,
    label: t(option.labelKey),
  }));

export class NotificationService {
  private static instance: NotificationService;
  private eventChannelId = NOTIFICATION_CHANNELS.event;
  private feedingChannelId = NOTIFICATION_CHANNELS.feeding;
  private budgetChannelId = NOTIFICATION_CHANNELS.budget;
  private quietHours = {
    startHour: QUIET_HOURS_WINDOW.startHour,
    startMinute: QUIET_HOURS_WINDOW.startMinute,
    endHour: QUIET_HOURS_WINDOW.endHour,
    endMinute: QUIET_HOURS_WINDOW.endMinute,
  };
  private notificationChannelPromise: Promise<void> | null = null;
  private navigationHandler?: (target: Href) => void;
  private readonly pushTokenStorageKey = 'expoPushToken';
  private readonly pushRegistrationStorageKey = 'pushTokenRegisteredWithBackend';
  private readonly pushRegistrationVerifiedAtStorageKey = 'pushTokenRegisteredVerifiedAt';
  private readonly pushRegistrationCacheTtlMs = 5 * 60 * 1000;

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
        await Notifications.setNotificationChannelAsync(this.feedingChannelId, {
          name: 'Feeding Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#7BC96F',
          sound: 'default',
          description: 'Notifications for feeding schedules and reminders',
        });
      } catch {
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

  private getUserTimezone(): string {
    const settings = useUserSettingsStore.getState().settings;
    return resolveEffectiveTimezone(settings?.timezone);
  }

  private async setPushRegistrationCache(isRegistered: boolean): Promise<void> {
    if (isRegistered) {
      await SecureStore.setItemAsync(this.pushRegistrationStorageKey, 'true');
      await SecureStore.setItemAsync(this.pushRegistrationVerifiedAtStorageKey, Date.now().toString());
      return;
    }

    await SecureStore.deleteItemAsync(this.pushRegistrationStorageKey);
    await SecureStore.deleteItemAsync(this.pushRegistrationVerifiedAtStorageKey);
  }

  private async getCachedPushRegistrationStatus(): Promise<{ isRegistered: boolean; isFresh: boolean }> {
    const cachedStatus = await SecureStore.getItemAsync(this.pushRegistrationStorageKey);
    const storedToken = await SecureStore.getItemAsync(this.pushTokenStorageKey);
    const verifiedAtRaw = await SecureStore.getItemAsync(this.pushRegistrationVerifiedAtStorageKey);

    const isRegistered = cachedStatus === 'true' && !!storedToken;
    const verifiedAt = verifiedAtRaw ? Number(verifiedAtRaw) : NaN;
    const isFresh = Number.isFinite(verifiedAt) && Date.now() - verifiedAt < this.pushRegistrationCacheTtlMs;

    return { isRegistered, isFresh };
  }

  setNavigationHandler(handler: (target: Href) => void) {
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
        return false;
      }

      return true;
    } catch {
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
    } catch {
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
        return null;
      }

      // Get default reminder time for event type if not specified
      const reminderTime =
        reminderMinutes ??
        EVENT_TYPE_DEFAULT_REMINDERS[event.type as keyof typeof EVENT_TYPE_DEFAULT_REMINDERS] ??
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
        return null;
      }
      if (triggerDate > eventDate) {
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
      const notificationBody = i18n.t('notifications.reminderBody', {
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
            screen: NOTIFICATION_SCREENS.event,
            source: 'local',
            entityType: 'event',
            entityId: event._id,
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


      return notificationId;
    } catch {
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
    } catch {
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

    } catch {
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch {
    }
  }

  /**
   * Get all scheduled notifications
   * @returns List of scheduled notifications
   */
  async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      return notifications;
    } catch {
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
    } catch {
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

    return notificationIds;
  }

  /**
   * Schedule default reminder chain with quiet hours
   */
  async scheduleReminderChain(
    event: Event,
    reminderTimes: readonly number[] = EVENT_REMINDER_PRESET_MINUTES.standard,
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
    data?: Record<string, unknown>
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

      return notificationId;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send an immediate notification for budget/emergency alerts with permission guard
   */
  async sendBudgetAlertNotification(
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    const enabled = await this.areNotificationsEnabled();
    if (!enabled) {
      return;
    }

    await this.ensureNotificationChannel();
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          ...(data || {}),
          screen: NOTIFICATION_SCREENS.budget,
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: Platform.OS === 'android' ? { channelId: this.budgetChannelId } : null,
    });
  }

  /**
   * Schedule a feeding reminder notification
   * @param schedule Feeding schedule to create reminder for
   * @param reminderMinutes Minutes before feeding time to send reminder
   * @returns Notification identifier or null if failed
   */
  async scheduleFeedingReminder(
    schedule: {
      _id: string;
      petId: string;
      time: string;
      foodType: string;
      amount: string;
      days?: string | string[];
    },
    reminderMinutes: number = 15
  ): Promise<string | null> {
    try {
      const hasPermission = await this.areNotificationsEnabled();
      if (!hasPermission) {
        return null;
      }

      const timezone = this.getUserTimezone();
      const parsedFeedingTime = new Date(schedule.time);
      const feedingTime = Number.isNaN(parsedFeedingTime.getTime())
        ? (schedule.days ? calculateNextFeedingTime(schedule.time, schedule.days, timezone) : null)
        : parsedFeedingTime;

      if (!feedingTime) {
        return null;
      }

      // Calculate trigger time
      const triggerDate = new Date(feedingTime.getTime() - reminderMinutes * 60 * 1000);

      // Don't schedule if trigger time is in the past
      if (triggerDate <= new Date()) {
        return null;
      }

      // Get food type emoji
      const foodTypeEmoji = this.getFoodTypeEmoji(schedule.foodType);
      const foodTypeLabel = i18n.t(`foodTypes.${schedule.foodType}`, schedule.foodType);

      const notificationTitle = i18n.t('notifications.feedingReminderTitle', {
        emoji: foodTypeEmoji,
      });
      const reminderClockTime = formatInTimeZoneTz(feedingTime, timezone, 'HH:mm');
      const notificationBody = i18n.t('notifications.feedingReminderBody', {
        foodType: foodTypeLabel,
        amount: schedule.amount,
        time: i18n.t('events.atTime', { time: reminderClockTime }),
      });

      await this.ensureNotificationChannel();
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationTitle,
          body: notificationBody,
          data: {
            scheduleId: schedule._id,
            petId: schedule.petId,
            scheduleTime: schedule.time,
            screen: NOTIFICATION_SCREENS.feeding,
            source: 'local',
            entityType: 'feeding',
            entityId: schedule._id,
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: 'feeding-reminder',
        },
        trigger: {
          date: triggerDate,
          channelId: this.feedingChannelId,
        },
      });

      return notificationId;
    } catch {
      return null;
    }
  }

  /**
   * Cancel a scheduled feeding reminder notification
   * @param notificationId Notification identifier to cancel
   */
  async cancelFeedingReminder(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch {
    }
  }

  /**
   * Send immediate feeding reminder notification
   * @param schedule Feeding schedule for immediate reminder
   */
  async sendImmediateFeedingReminder(
    schedule: { _id: string; petId: string; time: string; foodType: string; amount: string }
  ): Promise<void> {
    try {
      const hasPermission = await this.areNotificationsEnabled();
      if (!hasPermission) {
        return;
      }

      const foodTypeEmoji = this.getFoodTypeEmoji(schedule.foodType);
      const foodTypeLabel = i18n.t(`foodTypes.${schedule.foodType}`, schedule.foodType);

      await this.ensureNotificationChannel();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: i18n.t('notifications.feedingReminderNowTitle', { emoji: foodTypeEmoji }),
          body: i18n.t('notifications.feedingReminderNowBody', {
            foodType: foodTypeLabel,
            amount: schedule.amount,
          }),
          data: {
            scheduleId: schedule._id,
            petId: schedule.petId,
            screen: NOTIFICATION_SCREENS.feeding,
            entityType: 'feeding',
            entityId: schedule._id,
            immediate: true,
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: 'feeding-reminder',
        },
        trigger: Platform.OS === 'android' ? { channelId: this.feedingChannelId } : null,
      });
    } catch {
    }
  }

  /**
   * Get food type emoji for feeding notifications
   * @param foodType Food type
   * @returns Emoji string
   */
  private getFoodTypeEmoji(foodType: string): string {
    const emojiMap: Record<string, string> = {
      dry_food: '🍖',
      wet_food: '🥫',
      raw_food: '🥩',
      homemade: '🍲',
      treats: '🦴',
      supplements: '💊',
      other: '🍽️',
    };

    return emojiMap[foodType] || '🍽️';
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
    // You can add custom logic here, like showing an in-app alert
  }

  /**
   * Handle notification response (user tapped notification)
   * @param response Notification response
   */
  handleNotificationResponse(response: Notifications.NotificationResponse): void {

    const data = response.notification.request.content.data;
    const target = this.resolveNotificationTarget(data as Record<string, unknown> | undefined);
    if (target && this.navigationHandler) {
      this.navigationHandler(target);
    }
  }

  private resolveNotificationTarget(data?: Record<string, unknown>): NotificationTarget {
    if (!data) {
      return null;
    }

    const screen = String(data.screen ?? '');
    const entityType = String(data.entityType ?? '');
    const entityId = data.entityId ? String(data.entityId) : null;
    const eventId = data.eventId ? String(data.eventId) : null;

    if ((entityType === 'event' || screen === NOTIFICATION_SCREENS.event) && (entityId || eventId)) {
      return {
        pathname: '/event/[id]',
        params: { id: entityId ?? eventId ?? '' },
      };
    }

    if (entityType === 'feeding' || screen === NOTIFICATION_SCREENS.feeding) {
      return '/(tabs)/care';
    }

    if (
      entityType === NOTIFICATION_SCREENS.budget ||
      screen === NOTIFICATION_SCREENS.budget ||
      screen === NOTIFICATION_SCREENS.legacyFinance
    ) {
      return '/(tabs)/finance';
    }

    return null;
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
    } catch {
      return { total: 0, byType: {} };
    }
  }

  /**
   * Push triggers out of quiet hours (22:00–08:00)
   */
  private adjustForQuietHours(triggerDate: Date): Date {
    const timezone = this.getUserTimezone();
    
    // Convert absolute trigger time to user's wall-clock time
    const zonedTrigger = toZonedTime(triggerDate, timezone);
    const triggerMinutes = zonedTrigger.getHours() * 60 + zonedTrigger.getMinutes();
    
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

    // Clone zonedTrigger to modify it
    const adjustedZoned = new Date(zonedTrigger);

    if (crossesMidnight && triggerMinutes >= startMinutes) {
      adjustedZoned.setDate(adjustedZoned.getDate() + 1);
    }

    adjustedZoned.setHours(this.quietHours.endHour, this.quietHours.endMinute, 0, 0);
    
    // Convert back to absolute timestamp
    return fromZonedTime(adjustedZoned, timezone);
  }

  /**
   * Register push token with backend
   * This enables backend-initiated push notifications
   */
  async registerPushTokenWithBackend(): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return false;
      }

      // Get Expo push token - handle both old and new API
      let expoPushToken: string;
      try {
        const tokenResult = await Notifications.getExpoPushTokenAsync();
        // New API returns string directly, old API returns object with data property
        expoPushToken = typeof tokenResult === 'string' ? tokenResult : tokenResult?.data;
      } catch {
        // Fallback for older expo-notifications versions
        const tokenResult = await Notifications.getExpoPushTokenAsync();
        expoPushToken = typeof tokenResult === 'string' ? tokenResult : tokenResult?.data || '';
      }

      if (!expoPushToken) {
        return false;
      }

      // Get or generate device ID
      let deviceId = await SecureStore.getItemAsync('deviceId');
      if (!deviceId) {
        deviceId = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        await SecureStore.setItemAsync('deviceId', deviceId);
      }

      // Get device info
      const platform = Platform.OS;
      const deviceName = Device.deviceName || undefined;
      const appVersion = Application.nativeApplicationVersion || undefined;

      // Register with backend
      await api.post('/api/push/devices', {
        expoPushToken,
        deviceId,
        platform,
        deviceName,
        appVersion,
      });

      // Store the token locally
      await SecureStore.setItemAsync(this.pushTokenStorageKey, expoPushToken);
      await this.setPushRegistrationCache(true);
      await SecureStore.setItemAsync('deviceId', deviceId);

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Unregister push token from backend
   */
  async unregisterPushTokenFromBackend(): Promise<boolean> {
    try {
      const deviceId = await SecureStore.getItemAsync('deviceId');
      if (!deviceId) {
        return true;
      }

      await api.delete('/api/push/devices', {
        data: { deviceId },
      });

      await SecureStore.deleteItemAsync(this.pushTokenStorageKey);
      await SecureStore.deleteItemAsync('deviceId');
      await this.setPushRegistrationCache(false);

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if push token is registered with backend
   * Uses local cache to avoid network calls on every reminder schedule
   * Falls back to network check if cache is missing
   */
  async isPushTokenRegistered(): Promise<boolean> {
    try {
      const { isRegistered, isFresh } = await this.getCachedPushRegistrationStatus();
      if (isRegistered && isFresh) {
        return true;
      }

      return this.verifyPushTokenRegistration();
    } catch {
      return false;
    }
  }

  /**
   * Force re-verify push token registration with backend
   * Use this sparingly as it makes a network call
   */
  async verifyPushTokenRegistration(): Promise<boolean> {
    try {
      const storedToken = await SecureStore.getItemAsync(this.pushTokenStorageKey);
      if (!storedToken) {
        await this.setPushRegistrationCache(false);
        return false;
      }

      const response = await api.get<{ deviceId: string }[]>('/api/push/devices');
      const isRegistered = Array.isArray(response.data) && response.data.length > 0;
      
      await this.setPushRegistrationCache(isRegistered);
      
      return isRegistered;
    } catch {
      await this.setPushRegistrationCache(false);
      return false;
    }
  }

  async getNotificationDeliveryChannel(options?: { forceVerify?: boolean }): Promise<'backend' | 'local'> {
    if (options?.forceVerify) {
      const verified = await this.verifyPushTokenRegistration();
      return verified ? 'backend' : 'local';
    }

    const registered = await this.isPushTokenRegistered();
    return registered ? 'backend' : 'local';
  }

  async getFeedingNotifications(scheduleId?: string): Promise<Notifications.NotificationRequest[]> {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      return notifications.filter((notification) => {
        const data = notification.content.data;
        if (data?.screen !== NOTIFICATION_SCREENS.feeding) {
          return false;
        }
        if (!scheduleId) {
          return true;
        }
        return String(data?.scheduleId) === scheduleId;
      });
    } catch {
      return [];
    }
  }

  async cancelFeedingNotifications(scheduleId?: string): Promise<void> {
    try {
      const notifications = await this.getFeedingNotifications(scheduleId);
      for (const notification of notifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    } catch {
    }
  }

  async cancelEventAndFeedingNotifications(): Promise<void> {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      const reminders = notifications.filter((notification) => {
        const screen = notification.content.data?.screen;
        return screen === NOTIFICATION_SCREENS.event || screen === NOTIFICATION_SCREENS.feeding;
      });

      for (const reminder of reminders) {
        await Notifications.cancelScheduledNotificationAsync(reminder.identifier);
      }
    } catch {
    }
  }

  async syncFeedingReminderForSchedule(
    schedule: Pick<FeedingSchedule, '_id' | 'petId' | 'time' | 'foodType' | 'amount' | 'days'> &
      Partial<Pick<FeedingSchedule, 'isActive' | 'reminderMinutesBefore'>>,
    options?: { deliveryChannel?: 'backend' | 'local'; forceVerify?: boolean }
  ): Promise<string | null> {
    await this.cancelFeedingNotifications(schedule._id);

    if (schedule.isActive === false) {
      return null;
    }

    const deliveryChannel =
      options?.deliveryChannel ?? (await this.getNotificationDeliveryChannel({ forceVerify: options?.forceVerify }));

    if (deliveryChannel === 'backend') {
      return null;
    }

    return this.scheduleFeedingReminder(schedule, schedule.reminderMinutesBefore ?? 15);
  }

  /**
   * Send a test notification to verify push is working
   */
  async sendTestNotification(): Promise<boolean> {
    try {
      await api.post('/api/push/test', {
        title: 'Petopia Test',
        body: 'Test bildirimi başarılı! Artık etkinlik hatırlatmaları alabileceksiniz.',
      });
      return true;
    } catch {
      return false;
    }
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

// Backend push token registration
export const registerPushTokenWithBackend = () =>
  notificationService.registerPushTokenWithBackend();

export const unregisterPushTokenFromBackend = () =>
  notificationService.unregisterPushTokenFromBackend();

export const isPushTokenRegistered = () =>
  notificationService.isPushTokenRegistered();

export const verifyPushTokenRegistration = () =>
  notificationService.verifyPushTokenRegistration();

export const getNotificationDeliveryChannel = (options?: { forceVerify?: boolean }) =>
  notificationService.getNotificationDeliveryChannel(options);

export const sendTestNotification = () =>
  notificationService.sendTestNotification();

// Feeding reminder exports
export const scheduleFeedingReminder = (
  schedule: {
    _id: string;
    petId: string;
    time: string;
    foodType: string;
    amount: string;
    days?: string | string[];
  },
  reminderMinutes?: number
) => notificationService.scheduleFeedingReminder(schedule, reminderMinutes);

export const cancelFeedingReminder = (notificationId: string) =>
  notificationService.cancelFeedingReminder(notificationId);

export const cancelFeedingNotifications = (scheduleId?: string) =>
  notificationService.cancelFeedingNotifications(scheduleId);

export const syncFeedingReminderForSchedule = (
  schedule: Pick<FeedingSchedule, '_id' | 'petId' | 'time' | 'foodType' | 'amount' | 'days'> &
    Partial<Pick<FeedingSchedule, 'isActive' | 'reminderMinutesBefore'>>,
  options?: { deliveryChannel?: 'backend' | 'local'; forceVerify?: boolean }
) => notificationService.syncFeedingReminderForSchedule(schedule, options);

export const sendImmediateFeedingReminder = (
  schedule: { _id: string; petId: string; time: string; foodType: string; amount: string }
) => notificationService.sendImmediateFeedingReminder(schedule);
