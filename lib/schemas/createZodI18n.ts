import i18n from '../i18n';
import { z } from 'zod';

/**
 * Gets the translation function dynamically
 * @returns The i18n translation function
 */
const getT = () => {
  try {
    const translate = i18n.t;

    if (typeof translate !== 'function') {
      return (key: string, _options?: string | Record<string, unknown>) => key;
    }

    return translate.bind(i18n);
  } catch {
    // Fallback for when i18n is not available
    return (key: string, _options?: string | Record<string, unknown>) => key;
  }
};

/**
 * Creates a validation error message with translation key
 * @param key - The translation key
 * @param options - Options for interpolation
 * @returns Translated message string
 */
export const t = (key: string, options?: Record<string, unknown>) => {
  const translate = getT();
  return translate(key, options);
};

/**
 * MongoDB ObjectId validation schema
 */
export const createObjectIdSchema = () =>
  z.string().regex(/^[0-9a-fA-F]{24}$/, { message: t('forms.validation.objectIdInvalid') });

/**
 * Creates a Zod error map for internationalized error messages
 * @returns Zod error map function
 */
export const createZodI18nErrorMap = () => {
  return (issue: { code?: string; input?: unknown; message?: string }) => {
    const translate = getT();
    const params = (issue as { params?: Record<string, unknown> }).params as {
      i18nKey?: string;
      i18nOptions?: Record<string, unknown>;
    } | undefined;

    if (issue.code === 'custom' && params?.i18nKey) {
      return { message: translate(params.i18nKey, params.i18nOptions) };
    }

    if (issue.message) {
      return { message: issue.message };
    }

    if (issue.code === 'invalid_type' && issue.input === undefined) {
      return { message: translate('forms.validation.required') };
    }

    return { message: translate('forms.validation.invalid') };
  };
};

z.setErrorMap(createZodI18nErrorMap());
