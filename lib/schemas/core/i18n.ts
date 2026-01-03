import i18n from '../../i18n';

/**
 * Gets the translation function dynamically with fallback support.
 * Handles cases where i18n may not be initialized yet.
 */
const getT = () => {
  try {
    const translate = i18n.t;
    if (typeof translate !== 'function') {
      return (key: string, _options?: Record<string, unknown>) => key;
    }
    return translate.bind(i18n);
  } catch {
    // Fallback for when i18n is not available (e.g., during SSR or initialization)
    return (key: string, _options?: Record<string, unknown>) => key;
  }
};

/**
 * Translation function wrapper for Zod schema validation messages.
 * Provides safe i18n access with fallback to the key itself.
 *
 * @param key - The translation key (e.g., 'forms.validation.required')
 * @param options - Optional interpolation values
 * @returns The translated string or the key if translation fails
 *
 * @example
 * t('forms.validation.required')
 * t('forms.validation.nameMin', { min: 2 })
 */
export const t = (key: string, options?: Record<string, unknown>) => {
  const translate = getT();
  return translate(key, options);
};

/**
 * Type for translation function to support proper TypeScript intellisense.
 */
export type TranslateFunction = typeof t;

/**
 * Creates a bound translation function with prepended namespace.
 * Useful for creating domain-specific translation helpers.
 *
 * @param namespace - The namespace to prepend (e.g., 'forms.validation')
 * @returns A translation function that prepends the namespace to keys
 *
 * @example
 * const tValidation = createNamespaceT('forms.validation');
 * tValidation('required'); // translates 'forms.validation.required'
 */
export const createNamespaceT = (namespace: string) => {
  const translate = getT();
  return (key: string, options?: Record<string, unknown>) => {
    const fullKey = `${namespace}.${key}`;
    return translate(fullKey, options);
  };
};

/**
 * Safe translation function that returns null instead of the key on failure.
 * Useful for optional translations.
 *
 * @param key - The translation key
 * @param options - Optional interpolation values
 * @returns The translated string, null if not found, or the key as fallback
 */
export const safeT = (
  key: string,
  options?: Record<string, unknown>
): string | null => {
  const translate = getT();
  const result = translate(key, options);
  // If result equals key, translation was not found
  return result === key ? null : result;
};
