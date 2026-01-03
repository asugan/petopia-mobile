import { z } from 'zod';
import { objectIdSchema, amountValidator, currencyValidator, optionalUrlValidator } from './core/validators';
import { dateRangeSchema } from './core/dateSchemas';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, CURRENCIES } from './core/constants';
import { t } from './core/i18n';

// Re-export constants for convenience
export { EXPENSE_CATEGORIES, PAYMENT_METHODS, CURRENCIES };

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type Currency = (typeof CURRENCIES)[number];

// Base expense schema for common validations
const BaseExpenseSchema = () =>
  z.object({
    petId: objectIdSchema(),

    category: z.enum(EXPENSE_CATEGORIES, {
      message: t('forms.validation.expense.categoryInvalid'),
    }),

    amount: amountValidator(),

    currency: currencyValidator(),

    paymentMethod: z
      .enum(PAYMENT_METHODS, {
        message: t('forms.validation.expense.paymentMethodInvalid'),
      })
      .optional(),

    description: z
      .string()
      .max(500, { message: t('forms.validation.expense.descriptionMax') })
      .optional()
      .transform((val) => val?.trim() || undefined),

    date: dateRangeSchema({ maxYearsAgo: 10 }),

    receiptPhoto: optionalUrlValidator(),

    vendor: z
      .string()
      .max(200, { message: t('forms.validation.expense.vendorMax') })
      .optional()
      .transform((val) => val?.trim() || undefined),

    notes: z
      .string()
      .max(1000, { message: t('forms.validation.expense.notesMax') })
      .optional()
      .transform((val) => val?.trim() || undefined),
  });

// Full Expense schema including server-side fields
export const ExpenseSchema = () =>
  BaseExpenseSchema().extend({
    _id: objectIdSchema(),
    createdAt: z.string().datetime(),
    amountBase: z.number().optional(),
  });

// Schema for creating a new expense (currency defaults to user base currency)
export const ExpenseCreateSchema = () =>
  BaseExpenseSchema().extend({
    currency: currencyValidator().optional(),
  });

// Schema for updating an existing expense (all fields optional)
export const ExpenseUpdateSchema = () =>
  BaseExpenseSchema().partial().omit({ petId: true } as { petId?: true });

// Query params schema for filtering expenses
export const ExpenseQuerySchema = () =>
  z.object({
    page: z
      .number({ message: t('forms.validation.expense.query.pageInvalidType') })
      .int({ message: t('forms.validation.expense.query.pageInteger') })
      .positive({ message: t('forms.validation.expense.query.pagePositive') })
      .optional()
      .default(1),
    limit: z
      .number({ message: t('forms.validation.expense.query.limitInvalidType') })
      .int({ message: t('forms.validation.expense.query.limitInteger') })
      .positive({ message: t('forms.validation.expense.query.limitPositive') })
      .max(100, { message: t('forms.validation.expense.query.limitMax') })
      .optional()
      .default(20),
    category: z.enum(EXPENSE_CATEGORIES).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    minAmount: z
      .number({ message: t('forms.validation.expense.query.minAmountInvalidType') })
      .positive({ message: t('forms.validation.expense.query.minAmountPositive') })
      .optional(),
    maxAmount: z
      .number({ message: t('forms.validation.expense.query.maxAmountInvalidType') })
      .positive({ message: t('forms.validation.expense.query.maxAmountPositive') })
      .optional(),
    currency: z.enum(CURRENCIES).optional(),
    paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  });

// Type exports for TypeScript
export type Expense = z.infer<ReturnType<typeof ExpenseSchema>>;
export type ExpenseCreateInput = z.infer<ReturnType<typeof ExpenseCreateSchema>>;
export type ExpenseUpdateInput = z.infer<ReturnType<typeof ExpenseUpdateSchema>>;
export type ExpenseQueryParams = z.infer<ReturnType<typeof ExpenseQuerySchema>>;
export type ExpenseCreateFormInput = z.input<ReturnType<typeof ExpenseCreateSchema>>;

// Validation error type for better error handling
export type ValidationError = {
  path: string[];
  message: string;
};

// Helper function to format validation errors
export const formatExpenseValidationErrors = (error: z.ZodError): ValidationError[] => {
  return error.issues.map((err) => ({
    path: err.path.map(String),
    message: err.message,
  }));
};

// Helper to validate expense category
export const isValidExpenseCategory = (category: string): category is ExpenseCategory => {
  return EXPENSE_CATEGORIES.includes(category as ExpenseCategory);
};

// Helper to validate payment method
export const isValidPaymentMethod = (method: string): method is PaymentMethod => {
  return PAYMENT_METHODS.includes(method as PaymentMethod);
};

// Helper to validate currency
export const isValidCurrency = (currency: string): currency is Currency => {
  return CURRENCIES.includes(currency as Currency);
};
