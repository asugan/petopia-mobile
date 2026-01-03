import { z } from 'zod';
import { VALIDATION_LIMITS, CURRENCIES, PAYMENT_METHODS } from './constants';
import { t } from './i18n';

/**
 * MongoDB ObjectId validation schema (24-character hex string).
 */
export const objectIdSchema = () =>
  z.string().regex(/^[0-9a-fA-F]{24}$/, {
    message: t('forms.validation.objectIdInvalid'),
  });

/**
 * Turkish name validator with character support.
 * Supports Turkish characters: ç, Ç, ğ, Ğ, ı, İ, ö, Ö, ş, Ş, ü, Ü
 */
export const turkishNameValidator = (min = 2, max = 50) =>
  z
    .string()
    .min(min, { message: t('forms.validation.pet.nameMin', { min }) })
    .max(max, { message: t('forms.validation.pet.nameMax', { max }) })
    .regex(/^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$/, {
      message: t('forms.validation.pet.nameInvalidChars'),
    });

/**
 * Generic name validator for non-Turkish names.
 */
export const nameValidator = (min = 2, max = 50) =>
  z
    .string()
    .min(min, { message: t('forms.validation.nameMinLength', { min }) })
    .max(max, { message: t('forms.validation.nameMaxLength', { max }) });

/**
 * Amount validator for currency values.
 */
export const amountValidator = () =>
  z
    .number()
    .positive({ message: t('forms.validation.expense.amountPositive') })
    .min(VALIDATION_LIMITS.amount.min, {
      message: t('forms.validation.expense.amountMin'),
    })
    .max(VALIDATION_LIMITS.amount.max, {
      message: t('forms.validation.expense.amountMax'),
    });

/**
 * Weight validator for pet weight in kg.
 */
export const weightValidator = () =>
  z
    .number()
    .positive({ message: t('forms.validation.pet.weightPositive') })
    .min(VALIDATION_LIMITS.weight.min, {
      message: t('forms.validation.pet.weightMin'),
    })
    .max(VALIDATION_LIMITS.weight.max, {
      message: t('forms.validation.pet.weightMax'),
    });

/**
 * Time format validator (HH:MM 24-hour format).
 */
export const timeFormatValidator = (
  messageKey: string = 'forms.validation.feedingSchedule.timeInvalidFormat'
) =>
  z.string().regex(VALIDATION_LIMITS.timeFormat, {
    message: t(messageKey),
  });

/**
 * Currency validator.
 */
export const currencyValidator = () =>
  z.enum(CURRENCIES, {
    message: t('forms.validation.expense.currencyInvalid'),
  });

/**
 * Payment method validator.
 */
export const paymentMethodValidator = () =>
  z.enum(PAYMENT_METHODS, {
    message: t('forms.validation.expense.paymentMethodInvalid'),
  });

/**
 * URL validator for photo/image URLs.
 */
export const urlValidator = (fieldName = 'URL') =>
  z
    .string()
    .url({ message: t('forms.validation.invalid', { field: fieldName }) });

/**
 * Optional URL validator (allows empty or valid URL).
 */
export const optionalUrlValidator = () =>
  z
    .string()
    .optional()
    .or(z.literal('').transform(() => undefined))
    .refine((val) => {
      if (!val) return true;
      return (
        val.startsWith('file://') ||
        val.startsWith('/') ||
        val.startsWith('data:image/') ||
        val.startsWith('http')
      );
    }, {
      message: t('forms.validation.photoInvalid'),
    });
