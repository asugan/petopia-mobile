/**
 * Recurrence Constants
 * Defines recurrence frequencies, default times, and related configurations
 */

export const RECURRENCE_FREQUENCIES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  CUSTOM: 'custom',
  TIMES_PER_DAY: 'times_per_day',
} as const;

export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[keyof typeof RECURRENCE_FREQUENCIES];

/**
 * Days of the week (0 = Sunday, 6 = Saturday)
 */
export const DAYS_OF_WEEK_NUMBERS = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
} as const;

/**
 * Default daily times based on times per day count
 */
export const DEFAULT_DAILY_TIMES: Record<number, string[]> = {
  1: ['09:00'],
  2: ['08:00', '20:00'],
  3: ['08:00', '14:00', '20:00'],
  4: ['08:00', '12:00', '16:00', '20:00'],
  5: ['07:00', '10:00', '13:00', '16:00', '20:00'],
  6: ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00'],
};

/**
 * Frequency label keys for i18n
 */
export const FREQUENCY_LABEL_KEYS: Record<RecurrenceFrequency, string> = {
  daily: 'recurrence.frequency.daily',
  weekly: 'recurrence.frequency.weekly',
  monthly: 'recurrence.frequency.monthly',
  yearly: 'recurrence.frequency.yearly',
  custom: 'recurrence.frequency.custom',
  times_per_day: 'recurrence.frequency.timesPerDay',
};

/**
 * Day of week label keys for i18n (short form)
 */
export const DAY_OF_WEEK_LABEL_KEYS: Record<number, string> = {
  0: 'days.sundayShort',
  1: 'days.mondayShort',
  2: 'days.tuesdayShort',
  3: 'days.wednesdayShort',
  4: 'days.thursdayShort',
  5: 'days.fridayShort',
  6: 'days.saturdayShort',
};

/**
 * Day of week full label keys for i18n
 */
export const DAY_OF_WEEK_FULL_LABEL_KEYS: Record<number, string> = {
  0: 'days.sunday',
  1: 'days.monday',
  2: 'days.tuesday',
  3: 'days.wednesday',
  4: 'days.thursday',
  5: 'days.friday',
  6: 'days.saturday',
};

/**
 * End date options
 */
export const END_DATE_OPTIONS = {
  NEVER: 'never',
  ON_DATE: 'on_date',
  AFTER_OCCURRENCES: 'after_occurrences',
} as const;

export type EndDateOption = (typeof END_DATE_OPTIONS)[keyof typeof END_DATE_OPTIONS];

/**
 * Default recurrence values
 */
export const DEFAULT_RECURRENCE = {
  frequency: RECURRENCE_FREQUENCIES.WEEKLY as RecurrenceFrequency,
  interval: 1,
  daysOfWeek: [1], // Monday
  dayOfMonth: 1,
  timesPerDay: 1,
  dailyTimes: ['09:00'],
};

/**
 * Helper function to create frequency options with i18n
 */
export const createFrequencyOptions = (t: (key: string, defaultValue?: string) => string) =>
  Object.values(RECURRENCE_FREQUENCIES).map(freq => ({
    value: freq,
    label: t(FREQUENCY_LABEL_KEYS[freq], freq),
  }));

/**
 * Helper function to create day of week options with i18n
 */
export const createDayOfWeekOptions = (t: (key: string, defaultValue?: string) => string) =>
  [0, 1, 2, 3, 4, 5, 6].map(day => ({
    value: day,
    label: t(DAY_OF_WEEK_LABEL_KEYS[day] ?? '', String(day)),
    fullLabel: t(DAY_OF_WEEK_FULL_LABEL_KEYS[day] ?? '', String(day)),
  }));

/**
 * Helper function to generate times for times_per_day
 */
export const generateDailyTimes = (count: number): string[] => {
  if (count <= 0) return [];
  if (count > 10) count = 10;
  
  if (DEFAULT_DAILY_TIMES[count]) {
    return DEFAULT_DAILY_TIMES[count];
  }
  
  // Generate evenly spaced times between 06:00 and 22:00
  const startHour = 6;
  const endHour = 22;
  const interval = (endHour - startHour) / (count - 1 || 1);
  
  return Array.from({ length: count }, (_, i) => {
    const hour = Math.round(startHour + interval * i);
    return `${String(hour).padStart(2, '0')}:00`;
  });
};

/**
 * Get user's timezone
 */
export const getUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
};
