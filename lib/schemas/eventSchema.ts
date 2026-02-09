import { z } from 'zod';
import { EVENT_TYPES } from '@/constants';
import { combineDateTimeToISO, dateOnlyToUTCMidnightISOString } from '@/lib/utils/dateConversion';
import { utcDateStringSchema } from '@/lib/schemas/core/dateSchemas';
import { t } from '@/lib/schemas/core/i18n';
import { objectIdSchema } from '@/lib/schemas/core/validators';
import { recurrenceSettingsSchema, type RecurrenceRuleData } from '@/lib/schemas/recurrenceSchema';
import type { ReminderPresetKey } from '@/constants/reminders';

// Re-export constants for convenience
export { EVENT_TYPES };

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

// Form input schema (matches the form structure with separate date/time fields)
export const eventFormSchema = () =>
  z
    .object({
      title: z
        .string()
        .min(1, { message: t('forms.validation.event.titleRequired') })
        .max(100, { message: t('forms.validation.event.titleMax') })
        .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ0-9\s\-_.,!?()]+$/, {
          message: t('forms.validation.event.titleInvalidChars'),
        }),

      petId: z
        .string({
          error: t('forms.validation.event.petRequired'),
        })
        .min(1, { message: t('forms.validation.event.petRequired') })
        .pipe(objectIdSchema()),

      type: z.enum(Object.values(EVENT_TYPES) as [string, ...string[]], {
        message: t('forms.validation.event.typeInvalid'),
      }),

      startDate: z.string().min(1, { message: t('forms.validation.event.startDateRequired') }),

      startTime: z.string().min(1, { message: t('forms.validation.event.startTimeRequired') }),

      reminder: z.boolean(),

      reminderPreset: z.enum(['standard', 'compact', 'minimal']).default('standard'),

      vaccineName: z
        .string()
        .optional()
        .transform((val) => val?.trim() || undefined),

      vaccineManufacturer: z
        .string()
        .optional()
        .transform((val) => val?.trim() || undefined),

      batchNumber: z
        .string()
        .optional()
        .transform((val) => val?.trim() || undefined),

      medicationName: z
        .string()
        .optional()
        .transform((val) => val?.trim() || undefined),

      dosage: z
        .string()
        .optional()
        .transform((val) => val?.trim() || undefined),

      frequency: z
        .string()
        .optional()
        .transform((val) => val?.trim() || undefined),

      // Recurrence fields
      isRecurring: z.boolean().default(false),

      recurrence: recurrenceSettingsSchema().optional(),
    })
    .superRefine((data, ctx) => {

      // Validate start time is in the future
      if (data.startDate && data.startTime) {
        let startDateTime: string;
        try {
          startDateTime = combineDateTimeToISO(data.startDate, data.startTime);
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('forms.validation.event.invalidStartDateTime'),
            path: ['startDate', 'startTime'],
          });
          return;
        }
        const selectedDate = new Date(startDateTime);
        const now = new Date();

        // Allow events that are at least 1 minute in the future
        const oneMinuteFromNow = new Date(now.getTime() + 60000);
        if (selectedDate < oneMinuteFromNow) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('forms.validation.event.startInFuture'),
            path: ['startTime'],
          });
        }
      }

      // Additional validation: reminder time should be reasonable if reminder is enabled
      if (data.reminder && data.startDate && data.startTime) {
        let startDateTime: string;
        try {
          startDateTime = combineDateTimeToISO(data.startDate, data.startTime);
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('forms.validation.event.invalidStartDateTime'),
            path: ['startDate', 'startTime'],
          });
          return;
        }
        const eventTime = new Date(startDateTime);
        const now = new Date();

        // Don't allow reminders for events more than 1 year in the future
        const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        if (eventTime > oneYearFromNow) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('forms.validation.event.reminderTooFar'),
            path: ['reminder'],
          });
        }
      }

      if (data.type === EVENT_TYPES.VACCINATION && !data.vaccineName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('forms.validation.event.vaccineNameRequired'),
          path: ['vaccineName'],
        });
      }

      if (data.type === EVENT_TYPES.MEDICATION) {
        if (!data.medicationName) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('forms.validation.event.medicationNameRequired'),
            path: ['medicationName'],
          });
        }
        if (!data.dosage) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('forms.validation.event.dosageRequired'),
            path: ['dosage'],
          });
        }
        if (!data.frequency) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('forms.validation.event.frequencyRequired'),
            path: ['frequency'],
          });
        }
      }

      // Validate recurrence fields when isRecurring is true
      if (data.isRecurring) {
        if (!data.recurrence?.frequency) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('forms.validation.recurrence.frequencyInvalid'),
            path: ['recurrence', 'frequency'],
          });
        }
        if (!data.recurrence?.timezone) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('forms.validation.recurrence.timezoneRequired'),
            path: ['recurrence', 'timezone'],
          });
        }
      }
    });

// Type inference from the form schema
export type EventFormData = z.infer<ReturnType<typeof eventFormSchema>>;

// API schema (matches backend expectations with ISO datetime strings)
export const eventSchema = () =>
  z.object({
    title: z
      .string()
      .min(1, { message: t('forms.validation.event.titleRequired') })
      .max(100, { message: t('forms.validation.event.titleMax') }),

    petId: z
      .string()
      .min(1, { message: t('forms.validation.event.petRequired') })
      .pipe(objectIdSchema()),

    type: z.enum(Object.values(EVENT_TYPES) as [string, ...string[]], {
      message: t('forms.validation.event.typeInvalid'),
    }),

    startTime: utcDateStringSchema(),

    reminder: z.boolean().optional(),

    reminderPreset: z.enum(['standard', 'compact', 'minimal']).optional(),

    vaccineName: z.string().optional(),
    vaccineManufacturer: z.string().optional(),
    batchNumber: z.string().optional(),
    medicationName: z.string().optional(),
    dosage: z.string().optional(),
    frequency: z.string().optional(),
  });

// Full Event schema including server-side fields
export const EventSchema = () =>
  eventSchema().extend({
    _id: objectIdSchema(),
    status: z.enum(['upcoming', 'completed', 'cancelled', 'missed']).default('upcoming'),
    // Recurrence fields - present when event is part of a recurring series
    recurrenceRuleId: objectIdSchema().optional(),
    seriesIndex: z.number().int().min(0).optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  });

// Type inference from the API schema
export type EventData = z.infer<ReturnType<typeof eventSchema>>;
export type Event = z.infer<ReturnType<typeof EventSchema>>;

// Schema for event updates (all fields optional)
export const updateEventSchema = () =>
  z.object({
    title: z
      .string()
      .min(1, { message: t('forms.validation.event.titleRequired') })
      .max(100, { message: t('forms.validation.event.titleMax') })
      .optional(),
    petId: objectIdSchema().optional(),
    type: z.enum(Object.values(EVENT_TYPES) as [string, ...string[]], {
      message: t('forms.validation.event.typeInvalid'),
    }).optional(),
    startTime: z
      .string()
      .min(1, { message: t('forms.validation.event.startTimeRequired') })
      .refine((val) => utcDateStringSchema().safeParse(val).success, {
        params: { i18nKey: 'forms.validation.event.startTimeUtcInvalid' },
      })
      .optional(),
    reminder: z.boolean().optional(),
    reminderPreset: z.enum(['standard', 'compact', 'minimal']).optional(),
    status: z.enum(['upcoming', 'completed', 'cancelled', 'missed']).optional(),
    vaccineName: z
      .string()
      .max(100, { message: t('forms.validation.event.vaccineNameMax') })
      .nullable()
      .optional(),
    vaccineManufacturer: z
      .string()
      .max(100, { message: t('forms.validation.event.vaccineManufacturerMax') })
      .nullable()
      .optional(),
    batchNumber: z
      .string()
      .max(50, { message: t('forms.validation.event.batchNumberMax') })
      .nullable()
      .optional(),
    medicationName: z
      .string()
      .max(100, { message: t('forms.validation.event.medicationNameMax') })
      .nullable()
      .optional(),
    dosage: z
      .string()
      .max(50, { message: t('forms.validation.event.dosageMax') })
      .nullable()
      .optional(),
    frequency: z
      .string()
      .max(100, { message: t('forms.validation.event.frequencyMax') })
      .nullable()
      .optional(),
  });

export type UpdateEventFormData = z.infer<ReturnType<typeof updateEventSchema>>;
export type CreateEventInput = EventData;
export type UpdateEventInput = z.infer<ReturnType<typeof updateEventSchema>>;

// Helper function to validate date strings
// Helper function to get current datetime string in ISO format
export const getCurrentDateTimeString = (): string => {
  const now = new Date();
  return now.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
};

// Helper function to add minimum time to current date
export const getMinimumEventDateTime = (): string => {
  const now = new Date();
  // Add 1 minute to current time as minimum
  const minimumTime = new Date(now.getTime() + 60000);
  return minimumTime.toISOString().slice(0, 16);
};

// Default form values
export const defaultEventFormValues: Partial<EventFormData> = {
  reminder: false,
  reminderPreset: 'standard',
  isRecurring: false,
};

// Event type specific validation rules
export const getEventTypeSpecificRules = (eventType: string) => {
  switch (eventType) {
    case 'feeding':
      return {
        title: {
          min: 1,
          max: 50,
          pattern: /^[a-zA-ZğüşıöçĞÜŞİÖÇ0-9\s\-_.,!?()]+$/,
          message: t('forms.validation.event.rules.feedingTitleMax'),
        },
        duration: {
          maxMinutes: 60, // Feeding activities shouldn't exceed 1 hour
          message: t('forms.validation.event.rules.feedingDurationMax'),
        },
      };

    case 'vet_visit':
      return {
        title: {
          min: 1,
          max: 100,
          pattern: /^[a-zA-ZğüşıöçĞÜŞİÖÇ0-9\s\-_.,!?()]+$/,
          message: t('forms.validation.event.rules.vetVisitTitleRequired'),
        },
        duration: {
          minMinutes: 30, // Vet visits usually take at least 30 minutes
          maxMinutes: 480, // 8 hours max
          message: t('forms.validation.event.rules.vetVisitDurationRange'),
        },
      };

    case 'exercise':
    case 'walk':
      return {
        duration: {
          minMinutes: 15,
          maxMinutes: 240, // 4 hours max
          message: t('forms.validation.event.rules.exerciseDurationRange'),
        },
      };

    default:
      return {
        duration: {
          minMinutes: 15,
          maxMinutes: 480, // 8 hours max default
          message: t('forms.validation.event.rules.defaultDurationRange'),
        },
      };
  }
};

// Helper function to transform form data to API format
export const transformFormDataToAPI = (formData: EventFormData): EventData => {
  // Combine date and time into ISO datetime strings
  const startTime = combineDateTimeToISO(formData.startDate, formData.startTime);

  return {
    title: formData.title,
    petId: formData.petId,
    type: formData.type,
    startTime,
    reminder: formData.reminder || undefined,
    reminderPreset: formData.reminder ? formData.reminderPreset : undefined,
    vaccineName: formData.vaccineName || undefined,
    vaccineManufacturer: formData.vaccineManufacturer || undefined,
    batchNumber: formData.batchNumber || undefined,
    medicationName: formData.medicationName || undefined,
    dosage: formData.dosage || undefined,
    frequency: formData.frequency || undefined,
  };
};

/**
 * Transform form data to RecurrenceRuleData format for creating recurring events.
 * This maps the EventFormData structure to the API's expected RecurrenceRuleData format.
 */
export const transformFormDataToRecurrenceRule = (
  formData: EventFormData,
  reminderEnabled: boolean,
  reminderPresetKey: ReminderPresetKey
): RecurrenceRuleData => {
  if (!formData.recurrence) {
    throw new Error('Recurrence settings are required for recurring events');
  }

  const recurrenceStartDate = dateOnlyToUTCMidnightISOString(formData.startDate);

  return {
    petId: formData.petId,
    title: formData.title,
    type: formData.type,
    reminder: reminderEnabled,
    reminderPreset: reminderEnabled ? reminderPresetKey : undefined,

    // Medication/Vaccination fields
    vaccineName: formData.vaccineName || undefined,
    vaccineManufacturer: formData.vaccineManufacturer || undefined,
    batchNumber: formData.batchNumber || undefined,
    medicationName: formData.medicationName || undefined,
    dosage: formData.dosage || undefined,

    // Recurrence settings
    frequency: formData.recurrence.frequency!,
    interval: formData.recurrence.interval ?? 1,
    daysOfWeek: formData.recurrence.daysOfWeek,
    dayOfMonth: formData.recurrence.dayOfMonth,
    timesPerDay: formData.recurrence.timesPerDay,
    dailyTimes: formData.recurrence.dailyTimes ?? [formData.startTime],

    // Timezone
    timezone: formData.recurrence.timezone!,

    // Date boundaries
    startDate: recurrenceStartDate,
    endDate: formData.recurrence.endDate 
      ? new Date(formData.recurrence.endDate).toISOString() 
      : undefined,
  };
};
