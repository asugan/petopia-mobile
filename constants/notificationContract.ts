import { REMINDER_PRESETS } from '@/constants/reminders';

export const NOTIFICATION_CHANNELS = {
  event: 'event-reminders',
  feeding: 'feeding-reminders',
  budget: 'budget-alerts',
} as const;

export const NOTIFICATION_SCREENS = {
  event: 'event',
  feeding: 'feeding',
  budget: 'budget',
  legacyFinance: 'finance',
} as const;

export const EVENT_REMINDER_PRESET_MINUTES = {
  standard: REMINDER_PRESETS.standard.minutes,
  compact: REMINDER_PRESETS.compact.minutes,
  minimal: REMINDER_PRESETS.minimal.minutes,
} as const;
