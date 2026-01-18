import { useCallback } from 'react';
import { cancelEventNotifications, scheduleReminderChain, isPushTokenRegistered, notificationService } from '@/lib/services/notificationService';
import { REMINDER_PRESETS, ReminderPresetKey } from '@/constants/reminders';
import { Event } from '@/lib/types';
import { useEventReminderStore } from '@/stores/eventReminderStore';
import { useUserSettingsStore } from '@/stores/userSettingsStore';

const getPresetMinutes = (preset: ReminderPresetKey | undefined): readonly number[] => {
  if (preset && REMINDER_PRESETS[preset]) {
    return REMINDER_PRESETS[preset].minutes;
  }
  return REMINDER_PRESETS.standard.minutes;
};

export const useReminderScheduler = () => {
  const presetSelections = useEventReminderStore((state) => state.presetSelections);
  const quietHoursEnabled = useEventReminderStore((state) => state.quietHoursEnabled);
  const quietHours = useEventReminderStore((state) => state.quietHours);
  const notificationsEnabled = useUserSettingsStore(
    (state) => state.settings?.notificationsEnabled ?? true
  );
  const setPresetSelection = useEventReminderStore((state) => state.setPresetSelection);
  const setReminderIds = useEventReminderStore((state) => state.setReminderIds);
  const clearReminderIds = useEventReminderStore((state) => state.clearReminderIds);
  const resetStatus = useEventReminderStore((state) => state.resetStatus);
  const clearPresetSelection = useEventReminderStore((state) => state.clearPresetSelection);

  const cancelRemindersForEvent = useCallback(
    async (eventId: string) => {
      try {
        await cancelEventNotifications(eventId);
      } catch {
      } finally {
        clearReminderIds(eventId);
      }
    },
    [clearReminderIds]
  );

  const scheduleChainForEvent = useCallback(
    async (event: Event, preset?: ReminderPresetKey) => {
      if (!event.reminder) {
        clearReminderIds(event._id);
        return [];
      }

      if (!notificationsEnabled) {
        clearReminderIds(event._id);
        return [];
      }

      // If push token is registered with backend, let backend handle notifications
      // Skip local notifications to avoid duplicate notifications
      try {
        const pushRegistered = await isPushTokenRegistered();
        if (pushRegistered) {
          clearReminderIds(event._id);
          return [];
        }
      } catch {
        // If check fails, continue with local notifications as fallback
      }

      const presetKey =
        preset ||
        presetSelections[event._id] ||
        event.reminderPreset ||
        'standard';
      const reminderTimes = getPresetMinutes(presetKey);

      try {
        notificationService.setQuietHours(quietHours);
        await cancelRemindersForEvent(event._id);
        const ids = await scheduleReminderChain(event, reminderTimes, quietHoursEnabled);
        if (ids.length > 0) {
          setReminderIds(event._id, ids);
          setPresetSelection(event._id, presetKey);
        }
        // Reset local status so overdue/completed calculations refresh
        resetStatus(event._id);
        return ids;
      } catch (error) {
        return [];
      }
    },
    [
      cancelRemindersForEvent,
      clearReminderIds,
      notificationsEnabled,
      quietHours,
      quietHoursEnabled,
      presetSelections,
      resetStatus,
      setPresetSelection,
      setReminderIds,
    ]
  );

  const clearReminderState = useCallback(
    (eventId: string) => {
      clearReminderIds(eventId);
      resetStatus(eventId);
      clearPresetSelection(eventId);
    },
    [clearPresetSelection, clearReminderIds, resetStatus]
  );

  return {
    scheduleChainForEvent,
    cancelRemindersForEvent,
    clearReminderState,
  };
};
