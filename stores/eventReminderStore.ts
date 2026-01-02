import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { QUIET_HOURS_WINDOW, ReminderPresetKey } from '@/constants/reminders';

export type EventLocalStatus = 'pending' | 'completed' | 'cancelled' | 'missed';

interface EventStatusMeta {
  status: EventLocalStatus;
  updatedAt: string;
}

interface EventReminderState {
  reminderIds: Record<string, string[]>;
  statuses: Record<string, EventStatusMeta>;
  presetSelections: Record<string, ReminderPresetKey>;
  quietHoursEnabled: boolean;
  quietHours: {
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
  };
  setQuietHoursEnabled: (enabled: boolean) => void;
  setQuietHours: (quietHours: EventReminderState['quietHours']) => void;
  setReminderIds: (eventId: string, ids: string[]) => void;
  clearReminderIds: (eventId: string) => void;
  markCompleted: (eventId: string) => void;
  markCancelled: (eventId: string) => void;
  markMissed: (eventId: string) => void;
  resetStatus: (eventId: string) => void;
  setPresetSelection: (eventId: string, preset: ReminderPresetKey) => void;
  clearPresetSelection: (eventId: string) => void;
  clearAllReminderState: () => void;
}

const defaultQuietHours = {
  startHour: QUIET_HOURS_WINDOW.startHour,
  startMinute: QUIET_HOURS_WINDOW.startMinute,
  endHour: QUIET_HOURS_WINDOW.endHour,
  endMinute: QUIET_HOURS_WINDOW.endMinute,
};

export const useEventReminderStore = create<EventReminderState>()(
  persist(
    (set) => ({
      reminderIds: {},
      statuses: {},
      presetSelections: {},
      quietHoursEnabled: true,
      quietHours: defaultQuietHours,
      setQuietHoursEnabled: (enabled) =>
        set(() => ({
          quietHoursEnabled: enabled,
        })),
      setQuietHours: (quietHours) =>
        set(() => ({
          quietHours,
        })),
      setReminderIds: (eventId, ids) =>
        set((state) => ({
          reminderIds: { ...state.reminderIds, [eventId]: ids },
        })),
      clearReminderIds: (eventId) =>
        set((state) => {
          const updatedReminders = { ...state.reminderIds };
          delete updatedReminders[eventId];
          return { reminderIds: updatedReminders };
        }),
      markCompleted: (eventId) =>
        set((state) => ({
          statuses: {
            ...state.statuses,
            [eventId]: { status: 'completed', updatedAt: new Date().toISOString() },
          },
        })),
      markCancelled: (eventId) =>
        set((state) => ({
          statuses: {
            ...state.statuses,
            [eventId]: { status: 'cancelled', updatedAt: new Date().toISOString() },
          },
        })),
      markMissed: (eventId) =>
        set((state) => ({
          statuses: {
            ...state.statuses,
            [eventId]: { status: 'missed', updatedAt: new Date().toISOString() },
          },
        })),
      resetStatus: (eventId) =>
        set((state) => {
          const updatedStatuses = { ...state.statuses };
          delete updatedStatuses[eventId];
          return { statuses: updatedStatuses };
        }),
      setPresetSelection: (eventId, preset) =>
        set((state) => ({
          presetSelections: { ...state.presetSelections, [eventId]: preset },
        })),
      clearPresetSelection: (eventId) =>
        set((state) => {
          const updatedPresets = { ...state.presetSelections };
          delete updatedPresets[eventId];
          return { presetSelections: updatedPresets };
        }),
      clearAllReminderState: () =>
        set(() => ({
          reminderIds: {},
          statuses: {},
          presetSelections: {},
        })),
    }),
    {
      name: 'event-reminders-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        reminderIds: state.reminderIds,
        statuses: state.statuses,
        presetSelections: state.presetSelections,
        quietHoursEnabled: state.quietHoursEnabled,
        quietHours: state.quietHours,
      }),
    }
  )
);
