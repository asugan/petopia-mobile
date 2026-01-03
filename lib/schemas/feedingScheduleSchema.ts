import { z } from 'zod';
import { DAYS_OF_WEEK, FOOD_TYPES } from '../../constants';
import { objectIdSchema, timeFormatValidator } from './core/validators';
import { t } from './core/i18n';

// Re-export constants for convenience
export { DAYS_OF_WEEK, FOOD_TYPES };

export type DayOfWeek = (typeof DAYS_OF_WEEK)[keyof typeof DAYS_OF_WEEK];
export type FoodType = (typeof FOOD_TYPES)[keyof typeof FOOD_TYPES];

// Valid day names for validation
const VALID_DAYS = Object.values(DAYS_OF_WEEK);

// Helper function to validate days string (comma-separated day names)
const isValidDaysString = (days: string): boolean => {
  if (!days || days.trim() === '') return false;

  const dayArray = days.split(',').map((d) => d.trim().toLowerCase());

  // Check if all days are valid
  return (
    dayArray.every((day) => VALID_DAYS.includes(day as DayOfWeek)) && dayArray.length > 0
  );
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

// API schema (matches backend expectations with comma-separated days string)
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

    days: z
      .string()
      .min(1, { message: t('forms.validation.feedingSchedule.daysRequired') })
      .refine(isValidDaysString, {
        error: () => t('forms.validation.feedingSchedule.daysInvalidFormat'),
      }),

    isActive: z.boolean().optional().default(true),
  });

// Full FeedingSchedule schema including server-side fields
export const FeedingScheduleSchema = () =>
  feedingScheduleSchema().extend({
    _id: objectIdSchema(),
    createdAt: z.string().datetime(),
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
      .string()
      .refine(isValidDaysString, {
        error: () => t('forms.validation.feedingSchedule.daysInvalid'),
      })
      .optional(),

    isActive: z.boolean().optional(),
  });

export type UpdateFeedingScheduleFormData = z.infer<ReturnType<typeof updateFeedingScheduleSchema>>;
export type CreateFeedingScheduleInput = FeedingScheduleData;
export type UpdateFeedingScheduleInput = z.infer<ReturnType<typeof updateFeedingScheduleSchema>>;

// Helper function to transform form data to API format
export const transformFormDataToAPI = (formData: FeedingScheduleFormData): FeedingScheduleData => {
  // Convert days array to comma-separated string
  const daysString = formData.daysArray.join(',');

  return {
    petId: formData.petId,
    time: formData.time,
    foodType: formData.foodType,
    amount: formData.amount,
    days: daysString,
    isActive: formData.isActive ?? true,
  };
};

// Helper function to transform API data to form format
export const transformAPIDataToForm = (
  apiData: FeedingScheduleData
): FeedingScheduleFormData => {
  // Convert comma-separated days string to array
  const daysArray = apiData.days.split(',').map((d) => d.trim()) as Array<
    (typeof DAYS_OF_WEEK)[keyof typeof DAYS_OF_WEEK]
  >;

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
  schedules: Array<{ time: string; days: string; isActive: boolean }>
): Date | null => {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;

  // Map JS day index to day name
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayName = dayNames[currentDay];

  // Filter active schedules for today that haven't passed yet
  const upcomingToday = schedules
    .filter((s) => s.isActive && s.days.toLowerCase().includes(todayName) && s.time > currentTime)
    .sort((a, b) => a.time.localeCompare(b.time));

  if (upcomingToday.length > 0) {
    // Return the earliest upcoming feeding today
    const nextSchedule = upcomingToday[0];
    const [hours, minutes] = nextSchedule.time.split(':').map(Number);
    const nextTime = new Date(now);
    nextTime.setHours(hours, minutes, 0, 0);
    return nextTime;
  }

  // If no more feedings today, find the next feeding on a future day
  for (let i = 1; i <= 7; i++) {
    const futureDay = (currentDay + i) % 7;
    const futureDayName = dayNames[futureDay];

    const futureDaySchedules = schedules
      .filter((s) => s.isActive && s.days.toLowerCase().includes(futureDayName))
      .sort((a, b) => a.time.localeCompare(b.time));

    if (futureDaySchedules.length > 0) {
      const nextSchedule = futureDaySchedules[0];
      const [hours, minutes] = nextSchedule.time.split(':').map(Number);
      const nextTime = new Date(now);
      nextTime.setDate(now.getDate() + i);
      nextTime.setHours(hours, minutes, 0, 0);
      return nextTime;
    }
  }

  return null;
};

export const getPreviousFeedingTime = (
  schedules: Array<{ time: string; days: string; isActive: boolean }>
): Date | null => {
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayName = dayNames[currentDay];

  const pastToday = schedules
    .filter((s) => s.isActive && s.days.toLowerCase().includes(todayName) && s.time <= currentTime)
    .sort((a, b) => b.time.localeCompare(a.time));

  if (pastToday.length > 0) {
    const prevSchedule = pastToday[0];
    const [hours, minutes] = prevSchedule.time.split(':').map(Number);
    const prevTime = new Date(now);
    prevTime.setHours(hours, minutes, 0, 0);
    return prevTime;
  }

  for (let i = 1; i <= 7; i++) {
    const pastDay = (currentDay - i + 7) % 7;
    const pastDayName = dayNames[pastDay];

    const pastDaySchedules = schedules
      .filter((s) => s.isActive && s.days.toLowerCase().includes(pastDayName))
      .sort((a, b) => b.time.localeCompare(a.time));

    if (pastDaySchedules.length > 0) {
      const prevSchedule = pastDaySchedules[0];
      const [hours, minutes] = prevSchedule.time.split(':').map(Number);
      const prevTime = new Date(now);
      prevTime.setDate(now.getDate() - i);
      prevTime.setHours(hours, minutes, 0, 0);
      return prevTime;
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
