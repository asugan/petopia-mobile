import { z } from 'zod';
import { addDays, subDays } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { DAYS_OF_WEEK, FOOD_TYPES } from '../../constants';
import { objectIdSchema, timeFormatValidator } from './core/validators';
import { t } from './core/i18n';
import { resolveEffectiveTimezone } from '@/lib/utils/timezone';
import { toLocalDateKey } from '@/lib/utils/timezoneDate';

// Re-export constants for convenience
export { DAYS_OF_WEEK, FOOD_TYPES };

export type DayOfWeek = (typeof DAYS_OF_WEEK)[keyof typeof DAYS_OF_WEEK];
export type FoodType = (typeof FOOD_TYPES)[keyof typeof FOOD_TYPES];

// Valid day names for validation
const VALID_DAYS = Object.values(DAYS_OF_WEEK);

export const normalizeFeedingDays = (days: string | string[] | undefined | null): DayOfWeek[] => {
  const rawDays = Array.isArray(days) ? days : typeof days === 'string' ? days.split(',') : [];
  const normalized = rawDays
    .map((day) => day.trim().toLowerCase())
    .filter((day): day is DayOfWeek => VALID_DAYS.includes(day as DayOfWeek));

  return Array.from(new Set(normalized));
};

// Form input schema (for create/edit forms with multi-select days)
export const feedingScheduleFormSchema = () =>
  z
    .object({
      petId: z
        .string()
        .min(1, { message: t('forms.validation.feedingSchedule.petRequired') })
        .pipe(objectIdSchema()),

      time: z
        .string()
        .min(1, { message: t('forms.validation.feedingSchedule.timeRequired') })
        .pipe(timeFormatValidator('forms.validation.feedingSchedule.timeInvalidFormatExample')),

      foodType: z.enum(Object.values(FOOD_TYPES) as [string, ...string[]], {
        message: t('forms.validation.feedingSchedule.foodTypeInvalid'),
      }),

      amount: z
        .string()
        .min(1, { message: t('forms.validation.feedingSchedule.amountRequired') })
        .max(50, { message: t('forms.validation.feedingSchedule.amountMax') })
        .refine((val) => val.trim().length > 0, {
          error: () => t('forms.validation.feedingSchedule.amountNotEmpty'),
        }),

      // Days as array for form (easier to work with multi-select)
      daysArray: z
        .array(z.enum(Object.values(DAYS_OF_WEEK) as [string, ...string[]]))
        .min(1, { message: t('forms.validation.feedingSchedule.daysMin') })
        .max(7, { message: t('forms.validation.feedingSchedule.daysMax') }),

      isActive: z.boolean(),
    });

// Type inference from the form schema
export type FeedingScheduleFormData = z.infer<ReturnType<typeof feedingScheduleFormSchema>>;

// API schema (array-first; still accepts legacy comma-separated string)
export const feedingScheduleSchema = () =>
  z.object({
    petId: z
      .string()
      .min(1, { message: t('forms.validation.feedingSchedule.petRequired') })
      .pipe(objectIdSchema()),

    time: z
      .string()
      .min(1, { message: t('forms.validation.feedingSchedule.timeRequired') })
      .pipe(timeFormatValidator('forms.validation.feedingSchedule.timeInvalidFormat')),

    foodType: z
      .string()
      .min(1, { message: t('forms.validation.feedingSchedule.foodTypeRequired') }),

    amount: z
      .string()
      .min(1, { message: t('forms.validation.feedingSchedule.amountRequired') })
      .max(50, { message: t('forms.validation.feedingSchedule.amountMax') }),

    days: z.preprocess(
      (value) => normalizeFeedingDays(value as string | string[] | undefined),
      z
        .array(z.enum(Object.values(DAYS_OF_WEEK) as [string, ...string[]]))
        .min(1, { message: t('forms.validation.feedingSchedule.daysRequired') })
    ),

    isActive: z.boolean().optional().default(true),
  });

// Full FeedingSchedule schema including server-side fields
export const FeedingScheduleSchema = () =>
  feedingScheduleSchema().extend({
    _id: objectIdSchema(),
    createdAt: z.string().datetime(),
    // Notification fields from backend
    remindersEnabled: z.boolean().optional(),
    reminderMinutesBefore: z.number().optional(),
    lastNotificationAt: z.string().datetime().optional(),
    nextNotificationTime: z.string().datetime().optional(),
  });

// Type inference from the API schema
export type FeedingScheduleData = z.infer<ReturnType<typeof feedingScheduleSchema>>;
export type FeedingSchedule = z.infer<ReturnType<typeof FeedingScheduleSchema>>;

// Schema for feeding schedule updates (all fields optional)
export const updateFeedingScheduleSchema = () =>
  z.object({
    time: z
      .string()
      .pipe(timeFormatValidator('forms.validation.feedingSchedule.timeInvalidFormat'))
      .optional(),

    foodType: z.enum(Object.values(FOOD_TYPES) as [string, ...string[]], {
      message: t('forms.validation.feedingSchedule.foodTypeInvalid'),
    }).optional(),

    amount: z
      .string()
      .min(1, { message: t('forms.validation.feedingSchedule.amountRequired') })
      .max(50, { message: t('forms.validation.feedingSchedule.amountMax') })
      .optional(),

    days: z
      .preprocess(
        (value) => normalizeFeedingDays(value as string | string[] | undefined),
        z.array(z.enum(Object.values(DAYS_OF_WEEK) as [string, ...string[]]))
      )
      .optional(),

    isActive: z.boolean().optional(),
  });

export type UpdateFeedingScheduleFormData = z.infer<ReturnType<typeof updateFeedingScheduleSchema>>;
export type CreateFeedingScheduleInput = FeedingScheduleData;
export type UpdateFeedingScheduleInput = z.infer<ReturnType<typeof updateFeedingScheduleSchema>>;

// Helper function to transform form data to API format
export const transformFormDataToAPI = (formData: FeedingScheduleFormData): FeedingScheduleData => {
  return {
    petId: formData.petId,
    time: formData.time,
    foodType: formData.foodType,
    amount: formData.amount,
    days: formData.daysArray,
    isActive: formData.isActive ?? true,
  };
};

// Helper function to transform API data to form format
export const transformAPIDataToForm = (
  apiData: FeedingScheduleData
): FeedingScheduleFormData => {
  const daysArray = normalizeFeedingDays(apiData.days);

  return {
    petId: apiData.petId,
    time: apiData.time,
    foodType: apiData.foodType as (typeof FOOD_TYPES)[keyof typeof FOOD_TYPES],
    amount: apiData.amount,
    daysArray,
    isActive: apiData.isActive ?? true,
  };
};

// Helper function to validate time string
export const validateTimeString = (time: string): boolean => {
  return timeFormatValidator().safeParse(time).success;
};

// Helper function to parse time to hours and minutes
export const parseTime = (
  time: string
): { hours: number; minutes: number } | null => {
  if (!validateTimeString(time)) return null;

  const [hours, minutes] = time.split(':').map(Number);
  return { hours, minutes };
};

// Helper function to format time for display
export const formatTimeForDisplay = (time: string): string => {
  const parsed = parseTime(time);
  if (!parsed) return time;

  const { hours, minutes } = parsed;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');

  return `${displayHours}:${displayMinutes} ${period}`;
};

// Helper function to get next feeding time
export const getNextFeedingTime = (
  schedules: { time: string; days: string | string[]; isActive: boolean }[],
  timezone?: string
): Date | null => {
  const now = new Date();
  const tz = resolveEffectiveTimezone(timezone);
  const currentTime = formatInTimeZone(now, tz, 'HH:mm');

  const isoDayToName: Record<number, string> = {
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
    7: 'sunday',
  };

  const includesDay = (days: string | string[], dayName: string) =>
    normalizeFeedingDays(days).includes(dayName as DayOfWeek);

  const buildDateTime = (dayDate: Date, time: string) => {
    const dayKey = toLocalDateKey(dayDate, tz);
    return fromZonedTime(`${dayKey}T${time}:00`, tz);
  };

  for (let i = 0; i <= 7; i++) {
    const targetDate = addDays(now, i);
    const isoDay = Number(formatInTimeZone(targetDate, tz, 'i'));
    const dayName = isoDayToName[isoDay] ?? 'monday';

    const daySchedules = schedules
      .filter((s) => s.isActive && includesDay(s.days, dayName) && (i > 0 || s.time > currentTime))
      .sort((a, b) => a.time.localeCompare(b.time));

    if (daySchedules.length > 0) {
      return buildDateTime(targetDate, daySchedules[0].time);
    }
  }

  return null;
};

export const getPreviousFeedingTime = (
  schedules: { time: string; days: string | string[]; isActive: boolean }[],
  timezone?: string
): Date | null => {
  const now = new Date();
  const tz = resolveEffectiveTimezone(timezone);
  const currentTime = formatInTimeZone(now, tz, 'HH:mm');

  const isoDayToName: Record<number, string> = {
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
    7: 'sunday',
  };

  const includesDay = (days: string | string[], dayName: string) =>
    normalizeFeedingDays(days).includes(dayName as DayOfWeek);

  const buildDateTime = (dayDate: Date, time: string) => {
    const dayKey = toLocalDateKey(dayDate, tz);
    return fromZonedTime(`${dayKey}T${time}:00`, tz);
  };

  for (let i = 0; i <= 7; i++) {
    const targetDate = subDays(now, i);
    const isoDay = Number(formatInTimeZone(targetDate, tz, 'i'));
    const dayName = isoDayToName[isoDay] ?? 'monday';

    const daySchedules = schedules
      .filter((s) => s.isActive && includesDay(s.days, dayName) && (i > 0 || s.time <= currentTime))
      .sort((a, b) => b.time.localeCompare(a.time));

    if (daySchedules.length > 0) {
      return buildDateTime(targetDate, daySchedules[0].time);
    }
  }

  return null;
};

// Default form values
export const defaultFeedingScheduleFormValues: Partial<FeedingScheduleFormData> = {
  time: '08:00',
  amount: '',
  daysArray: [],
  isActive: true,
};
