import { z } from 'zod';
import { EVENT_TYPES } from '@/constants';
import { RECURRENCE_FREQUENCIES, RecurrenceFrequency } from '@/constants/recurrence';
import { t } from '@/lib/schemas/core/i18n';
import { objectIdSchema } from '@/lib/schemas/core/validators';

// Re-export for convenience
export { RECURRENCE_FREQUENCIES, type RecurrenceFrequency } from '@/constants/recurrence';

/**
 * Recurrence settings schema (for form)
 * All fields are optional to allow partial form state when isRecurring is false.
 * Validation of required fields is done in eventFormSchema when isRecurring is true.
 */
export const recurrenceSettingsSchema = () =>
  z.object({
    frequency: z.enum(
      Object.values(RECURRENCE_FREQUENCIES) as [RecurrenceFrequency, ...RecurrenceFrequency[]],
      { message: t('forms.validation.recurrence.frequencyInvalid') }
    ).optional(),

    // interval: accepts both string (from SmartDropdown) and number, coerces to number
    interval: z
      .union([z.string(), z.number()])
      .transform((val) => (typeof val === 'string' ? parseInt(val, 10) : val))
      .pipe(
        z.number()
          .int()
          .min(1, { message: t('forms.validation.recurrence.intervalMin') })
          .max(365, { message: t('forms.validation.recurrence.intervalMax') })
      )
      .default(1),

    daysOfWeek: z
      .array(z.number().int().min(0).max(6))
      .optional(),

    // dayOfMonth: accepts both string (from SmartDropdown) and number, coerces to number
    dayOfMonth: z
      .union([z.string(), z.number()])
      .transform((val) => (typeof val === 'string' ? parseInt(val, 10) : val))
      .pipe(
        z.number()
          .int()
          .min(1, { message: t('forms.validation.recurrence.dayOfMonthMin') })
          .max(31, { message: t('forms.validation.recurrence.dayOfMonthMax') })
      )
      .optional(),

    // timesPerDay: accepts both string and number for consistency
    timesPerDay: z
      .union([z.string(), z.number()])
      .transform((val) => (typeof val === 'string' ? parseInt(val, 10) : val))
      .pipe(
        z.number()
          .int()
          .min(1, { message: t('forms.validation.recurrence.timesPerDayMin') })
          .max(10, { message: t('forms.validation.recurrence.timesPerDayMax') })
      )
      .optional(),

    dailyTimes: z
      .array(z.string().regex(/^\d{2}:\d{2}$/, { message: t('forms.validation.recurrence.timeFormatInvalid') }))
      .optional(),

    endDate: z
      .string()
      .optional()
      .transform((val) => val?.trim() || undefined),

    timezone: z.string().optional(),
  });

export type RecurrenceSettings = z.infer<ReturnType<typeof recurrenceSettingsSchema>>;

/**
 * Full recurrence rule schema (for API)
 */
export const recurrenceRuleSchema = () =>
  z.object({
    petId: objectIdSchema(),
    title: z
      .string()
      .min(1, { message: t('forms.validation.event.titleRequired') })
      .max(100, { message: t('forms.validation.event.titleMax') }),

    type: z.enum(Object.values(EVENT_TYPES) as [string, ...string[]], {
      message: t('forms.validation.event.typeInvalid'),
    }),

    reminder: z.boolean().default(false),
    reminderPreset: z.enum(['standard', 'compact', 'minimal']).optional(),

    // Medication/Vaccination fields
    vaccineName: z.string().optional(),
    vaccineManufacturer: z.string().optional(),
    batchNumber: z.string().optional(),
    medicationName: z.string().optional(),
    dosage: z.string().optional(),

    // Recurrence settings
    frequency: z.enum(
      Object.values(RECURRENCE_FREQUENCIES) as [RecurrenceFrequency, ...RecurrenceFrequency[]]
    ),
    interval: z.number().int().min(1).default(1),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
    dayOfMonth: z.number().int().min(1).max(31).optional(),
    timesPerDay: z.number().int().min(1).max(10).optional(),
    dailyTimes: z.array(z.string()).optional(),

    // Timezone
    timezone: z.string(),

    // Date boundaries
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional(),
  });

export type RecurrenceRuleData = z.infer<ReturnType<typeof recurrenceRuleSchema>>;

/**
 * Full RecurrenceRule type including server fields
 */
export const RecurrenceRuleResponseSchema = () =>
  recurrenceRuleSchema().extend({
    _id: objectIdSchema(),
    userId: objectIdSchema(),
    isActive: z.boolean(),
    lastGeneratedDate: z.string().datetime().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  });

export type RecurrenceRule = z.infer<ReturnType<typeof RecurrenceRuleResponseSchema>>;

/**
 * Update recurrence rule schema
 */
export const updateRecurrenceRuleSchema = () =>
  recurrenceRuleSchema().partial().extend({
    isActive: z.boolean().optional(),
    endDate: z.string().datetime().nullable().optional(),
  });

export type UpdateRecurrenceRuleData = z.infer<ReturnType<typeof updateRecurrenceRuleSchema>>;

/**
 * Default recurrence settings
 */
export const defaultRecurrenceSettings: RecurrenceSettings = {
  frequency: 'weekly',
  interval: 1,
  daysOfWeek: [1], // Monday
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  endDate: undefined,
};
