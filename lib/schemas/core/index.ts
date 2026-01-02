/**
 * Core utilities for Zod schema validation.
 * Reusable constants, validators, and helper functions.
 */

// Constants and types
export * from './constants';

// Reusable validation functions (excluding 't' to avoid conflict with i18n.ts)
export { objectIdSchema, turkishNameValidator, nameValidator, amountValidator, weightValidator, timeFormatValidator, currencyValidator, paymentMethodValidator, urlValidator, optionalUrlValidator } from './validators';

// Date-related schemas
export * from './dateSchemas';

// Error formatting utilities
export * from './errorHelpers';

// i18n utilities (includes 't' function)
export { t, createNamespaceT, safeT } from './i18n';

// Re-export common Zod types
export type { ZodError, ZodIssue } from 'zod';
