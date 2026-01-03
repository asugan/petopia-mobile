import { ZodError, ZodIssue } from 'zod';

/**
 * Type representing a single validation error with path information.
 */
export type ValidationError = {
  path: string[];
  message: string;
  code?: string;
};

/**
 * Type representing formatted errors for form display.
 * Maps Zod error paths to human-readable field names.
 */
export type FormattedError = {
  field: string;
  message: string;
};

/**
 * Formats Zod errors into a structured array of validation errors.
 * @param zodError - The ZodError to format
 * @returns Array of ValidationError objects
 */
export const formatZodErrors = (zodError: ZodError): ValidationError[] => {
  return zodError.issues.map((err: ZodIssue) => ({
    path: err.path.map(String),
    message: err.message,
    code: err.code,
  }));
};

/**
 * Formats Zod errors into a simple field-error map.
 * Useful for direct field error display in forms.
 * @param zodError - The ZodError to format
 * @returns Object with field names as keys and error messages as values
 */
export const formatZodErrorsToFieldMap = (zodError: ZodError): Record<string, string> => {
  const errorMap: Record<string, string> = {};
  zodError.issues.forEach((err: ZodIssue) => {
    const field = err.path.join('.');
    errorMap[field] = err.message;
  });
  return errorMap;
};

/**
 * Formats Zod errors into FormattedError array for API responses.
 * @param zodError - The ZodError to format
 * @returns Array of FormattedError objects
 */
export const formatZodErrorsForApi = (zodError: ZodError): FormattedError[] => {
  return zodError.issues.map((err: ZodIssue) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
};

/**
 * Gets a specific error message for a field from a ZodError.
 * @param zodError - The ZodError to search
 * @param fieldPath - The path to the field (e.g., 'name' or 'pet.name')
 * @returns The error message or undefined if not found
 */
export const getFieldError = (
  zodError: ZodError,
  fieldPath: string
): string | undefined => {
  const error = zodError.issues.find((err: ZodIssue) =>
    err.path.join('.') === fieldPath
  );
  return error?.message;
};

/**
 * Checks if a specific field has an error in a ZodError.
 * @param zodError - The ZodError to check
 * @param fieldPath - The path to the field
 * @returns True if the field has an error
 */
export const hasFieldError = (zodError: ZodError, fieldPath: string): boolean => {
  return zodError.issues.some((err: ZodIssue) => err.path.join('.') === fieldPath);
};

/**
 * Creates an error map with custom field labels.
 * Useful for displaying errors with user-friendly field names.
 * @param zodError - The ZodError to format
 * @param fieldLabels - Object mapping field paths to display labels
 * @returns Array of FormattedError with custom labels
 */
export const formatErrorsWithLabels = (
  zodError: ZodError,
  fieldLabels: Record<string, string>
): FormattedError[] => {
  return zodError.issues.map((err: ZodIssue) => ({
    field: fieldLabels[err.path.join('.')] ?? err.path.join('.'),
    message: err.message,
  }));
};
