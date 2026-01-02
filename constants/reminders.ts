export const REMINDER_PRESETS = {
  standard: {
    labelKey: 'events.reminders.standard',
    minutes: [4320, 1440, 60, 0], // 3d, 1d, 1h, at time
  },
  compact: {
    labelKey: 'events.reminders.compact',
    minutes: [1440, 60, 0], // 1d, 1h, at time
  },
  minimal: {
    labelKey: 'events.reminders.minimal',
    minutes: [60, 0], // 1h, at time
  },
} as const;

export type ReminderPresetKey = keyof typeof REMINDER_PRESETS;

export const QUIET_HOURS_WINDOW = {
  startHour: 22,
  startMinute: 0,
  endHour: 8,
  endMinute: 0,
};
