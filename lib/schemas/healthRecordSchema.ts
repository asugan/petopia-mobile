import { z } from 'zod';
import { objectIdSchema } from './core/validators';
import {
  dateRangeSchema,
} from './core/dateSchemas';
import { HEALTH_RECORD_TYPES, CURRENCIES } from './core/constants';
import { t } from './core/i18n';
import { toUTCWithOffset } from '@/lib/utils/dateConversion';

// Re-export constants for convenience
export { HEALTH_RECORD_TYPES, CURRENCIES };

export type HealthRecordType = (typeof HEALTH_RECORD_TYPES)[number];
export type Currency = (typeof CURRENCIES)[number];

// Base health record schema for common validations
const BaseHealthRecordSchema = () => {
  const HealthRecordTypeEnum = z.enum(
    HEALTH_RECORD_TYPES as unknown as [string, ...string[]],
    {
      message: t('forms.validation.healthRecord.typeInvalid'),
    }
  );

  return z.object({
    petId: z
      .string()
      .min(1, { message: t('forms.validation.healthRecord.petRequired') })
      .pipe(objectIdSchema()),

    type: HealthRecordTypeEnum,

    title: z
      .string()
      .min(2, { message: t('forms.validation.healthRecord.titleMin') })
      .max(100, { message: t('forms.validation.healthRecord.titleMax') })
      .transform((val) => val.trim()),

    date: z
      .union([z.string(), z.date()])
      .pipe(dateRangeSchema({
        maxYearsAgo: 30,
        allowFuture: false,
        messageKey: 'forms.validation.healthRecord.dateInvalidRange',
      }))
      .transform((val): string => {
        if (val instanceof Date) {
          return toUTCWithOffset(val);
        }
        if (typeof val === 'string') {
          if (!val.endsWith('Z') && !val.includes('+')) {
            return toUTCWithOffset(new Date(val));
          }
          return val;
        }
        throw new Error('Invalid date type');
      }),

    treatmentPlan: z
      .array(
        z.object({
          name: z.string().min(1, { message: t('forms.validation.required') }),
          dosage: z.string().min(1, { message: t('forms.validation.required') }),
          frequency: z.string().min(1, { message: t('forms.validation.required') }),
          duration: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .optional(),
  });
};

// Base schema for form input (before transformation)
const BaseHealthRecordFormSchema = () =>
  z.object({
    title: z
      .string()
      .min(1, { message: t('forms.validation.healthRecord.titleRequired') })
      .max(100, { message: t('forms.validation.healthRecord.titleMax') })
      .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ0-9\s\-_.,!?()]+$/, {
        message: t('forms.validation.healthRecord.titleInvalidChars'),
      }),

    type: z.enum(HEALTH_RECORD_TYPES as unknown as [string, ...string[]], {
      message: t('forms.validation.healthRecord.typeInvalid'),
    }),

    date: dateRangeSchema({
      maxYearsAgo: 30,
      allowFuture: false,
      messageKey: 'forms.validation.healthRecord.dateInvalidRange',
      messageParams: { maxYears: 30 },
    }),

    petId: objectIdSchema().refine(() => true, {
      params: { i18nKey: 'forms.validation.healthRecord.petRequired' },
    }),

    treatmentPlan: z
      .array(
        z.object({
          name: z.string().min(1, { message: t('forms.validation.required') }),
          dosage: z.string().min(1, { message: t('forms.validation.required') }),
          frequency: z.string().min(1, { message: t('forms.validation.required') }),
          duration: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .optional(),
  });

// Schema for form input (before transformation)
export const HealthRecordCreateFormSchema = () => BaseHealthRecordFormSchema();

// Schema for updating an existing health record form (before transformation)
export const HealthRecordUpdateFormSchema = () => BaseHealthRecordFormSchema().partial();

// Full HealthRecord schema including server-side fields
export const HealthRecordSchema = () =>
  BaseHealthRecordSchema().extend({
    _id: objectIdSchema(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  });

// Schema for creating a new health record
export const HealthRecordCreateSchema = () => BaseHealthRecordSchema();

// Schema for updating an existing health record (all fields optional)
// Note: ID is handled separately in the mutation function, not in the schema
export const HealthRecordUpdateSchema = () => BaseHealthRecordSchema().partial();

// Type exports for TypeScript
export type HealthRecord = z.infer<ReturnType<typeof HealthRecordSchema>>;
export type HealthRecordCreateInput = z.infer<ReturnType<typeof HealthRecordCreateSchema>>;
export type HealthRecordUpdateInput = z.infer<ReturnType<typeof HealthRecordUpdateSchema>>;
export type HealthRecordCreateFormInput = z.input<ReturnType<typeof HealthRecordCreateFormSchema>>;
export type HealthRecordUpdateFormInput = z.input<ReturnType<typeof HealthRecordUpdateFormSchema>>;

// Validation error type for better error handling
export type ValidationError = {
  path: string[];
  message: string;
  code?: string;
};

// Helper function to format validation errors
export const formatValidationErrors = (error: z.ZodError): ValidationError[] => {
  return error.issues.map((err) => ({
    path: err.path.map(String),
    message: err.message,
    code: err.code,
  }));
};

// Helper function to get field-specific error message
export const getFieldError = (error: z.ZodError, fieldName: string): string | undefined => {
  const fieldError = error.issues.find((err) => err.path[0] === fieldName);
  return fieldError?.message;
};

// Custom validation rules specific to Turkish veterinary practices
export const TurkishHealthValidations = {
  // Validate Turkish Veteriner Chamber Association number
  validateVeterinerChamberNumber: (number: string): boolean => {
    if (!number) return true; // Optional field
    const chamberRegex = /^\d{6}$/;
    return chamberRegex.test(number.replace(/\s/g, ''));
  },

  // Validate Turkish veterinary clinic license
  validateClinicLicense: (license: string): boolean => {
    if (!license) return true; // Optional field
    const licenseRegex = /^[A-Z]{2}\d{4}$/;
    return licenseRegex.test(license.replace(/\s/g, ''));
  },

  // Validate Turkish drug registry number
  validateDrugRegistryNumber: (number: string): boolean => {
    if (!number) return true; // Optional field
    const drugRegex = /^\d{8}\/\d{4}$/;
    return drugRegex.test(number.replace(/\s/g, ''));
  },

  // Validate vaccine batch number (Turkish format)
  validateVaccineBatchNumber: (batchNumber: string): boolean => {
    if (!batchNumber) return true; // Optional field
    const batchRegex = /^[A-Z0-9]{6,12}$/;
    return batchRegex.test(batchNumber.replace(/\s/g, ''));
  },

  // Validate Turkish identification number for pet ownership
  validateTurkishID: (tckn: string): boolean => {
    if (!tckn) return true; // Optional field
    if (tckn.length !== 11) return false;
    if (!/^\d+$/.test(tckn)) return false;

    // TC kimlik numarası algoritması
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(tckn[i]) * (7 - (i % 2));
    }

    const tenthDigit = (sum % 10) + '';
    if (tenthDigit !== tckn[9]) return false;

    let total = 0;
    for (let i = 0; i < 10; i++) {
      total += parseInt(tckn[i]);
    }

    return (total % 10) === parseInt(tckn[10]);
  },

  // Validate Turkish phone number for veterinary clinics
  validateTurkishClinicPhone: (phone: string): boolean => {
    if (!phone) return true; // Optional field
    const phoneRegex = /^(\+90|0)?[2-3]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },
};

// Type union for health record types
type HealthRecordTypeUnion = 'checkup' | 'visit' | 'surgery' | 'dental' | 'grooming' | 'other';

// Health record type-specific validation schemas
export const HealthRecordTypeSchemas = {
  checkup: HealthRecordCreateSchema,
  visit: HealthRecordCreateSchema,
  surgery: HealthRecordCreateSchema,
  dental: HealthRecordCreateSchema,
  grooming: HealthRecordCreateSchema,
  other: HealthRecordCreateSchema,
} as const;

// Dynamic schema selector based on record type
export const getHealthRecordSchema = (type: HealthRecordTypeUnion) => {
  return HealthRecordTypeSchemas[type]();
};

const isHealthRecordType = (type: string): type is HealthRecordTypeUnion => {
  return Object.prototype.hasOwnProperty.call(HealthRecordTypeSchemas, type);
};

// Helper function to validate health record data with type-specific rules
export const validateHealthRecord = (data: unknown, type: string) => {
  if (!isHealthRecordType(type)) {
    return {
      success: false,
      error: new z.ZodError([
        {
          code: z.ZodIssueCode.custom,
          path: ['type'],
          message: t('forms.validation.healthRecord.typeInvalid'),
        },
      ]),
    };
  }

  const schema = getHealthRecordSchema(type);
  return schema.safeParse(data);
};
