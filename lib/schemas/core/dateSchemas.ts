import { z } from 'zod';
import i18n from '../../i18n';
import { VALIDATION_LIMITS } from './constants';

/**
 * Gets the translation function dynamically with fallback.
 */
const getT = () => {
  try {
    const translate = i18n.t;
    if (typeof translate !== 'function') {
      return (key: string, _options?: Record<string, unknown>) => key;
    }
    return translate.bind(i18n);
  } catch {
    return (key: string, _options?: Record<string, unknown>) => key;
  }
};

/**
 * Translation function wrapper.
 */
const t = (key: string, options?: Record<string, unknown>) => {
  const translate = getT();
  return translate(key, options);
};

const parseDateValue = (value: unknown): Date | null => {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return isNaN(date.getTime()) ? null : date;
    }

    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  return null;
};

/**
 * Date string validation - checks if string is a valid date.
 */
export const dateStringSchema = (fieldName = 'date') =>
  z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: t('forms.validation.healthRecord.dateInvalid'),
    });

/**
 * Birth date validation - ensures date is valid and within acceptable range.
 * Validates that date is not in the future and not older than maxYearsAgo.
 */
export const birthDateSchema = () =>
  z
    .union([z.string(), z.date()])
    .refine((val) => {
      return Boolean(parseDateValue(val));
    }, {
      message: t('forms.validation.pet.birthDateInvalid'),
    })
    .refine((val) => {
      const date = parseDateValue(val);
      if (!date) return false;
      const now = new Date();
      const minDate = new Date(
        now.getFullYear() - VALIDATION_LIMITS.dateRange.maxYearsAgo,
        now.getMonth(),
        now.getDate()
      );
      return date <= now && date >= minDate;
    }, {
      message: t('forms.validation.pet.birthDateRange'),
    });

/**
 * Future date validation - ensures date is not in the past.
 */
export const futureDateSchema = () =>
  z
    .union([z.string(), z.date()])
    .refine((val) => {
      const date = parseDateValue(val);
      return date !== null && date >= new Date();
    }, {
      message: t('forms.validation.healthRecord.dateFuture'),
    });

/**
 * Past date validation - ensures date is not in the future.
 */
export const pastDateSchema = () =>
  z
    .union([z.string(), z.date()])
    .refine((val) => {
      const date = parseDateValue(val);
      return date !== null && date <= new Date();
    }, {
      message: t('forms.validation.healthRecord.dateFuture'),
    });

/**
 * Date range validation - ensures date is within specified range.
 */
export const dateRangeSchema = (options: {
  maxYearsAgo?: number;
  allowFuture?: boolean;
  messageKey?: string;
  messageParams?: Record<string, unknown>;
}) => {
  const maxAge = options.maxYearsAgo ?? VALIDATION_LIMITS.dateRange.maxYearsAgo;
  const messageKey = options.messageKey ?? 'forms.validation.dateInvalidRange';
  const messageParams = options.messageParams ?? { maxYears: maxAge };

  return z
    .union([z.string(), z.date()])
    .refine((val) => {
      const date = parseDateValue(val);
      if (!date) return false;
      const now = new Date();
      const minDate = new Date(now.getFullYear() - maxAge, now.getMonth(), now.getDate());
      const validMin = date >= minDate;
      const validMax = options.allowFuture ? true : date <= now;
      return validMin && validMax;
    }, {
      message: t(messageKey, messageParams),
    });
};

/**
 * UTC date string validation - ensures string is valid UTC ISO format.
 */
export const utcDateStringSchema = () =>
  z
    .string()
    .refine((val) => {
      // Check for valid UTC ISO format
      const date = new Date(val);
      return !isNaN(date.getTime()) && (val.endsWith('Z') || val.includes('+'));
    }, {
      message: t('forms.validation.healthRecord.dateUtcInvalid'),
    });
