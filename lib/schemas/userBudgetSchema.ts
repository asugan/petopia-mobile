import { z } from 'zod';
import { amountValidator, currencyValidator } from './core/validators';
import { CURRENCIES } from './core/constants';
import { t } from './core/i18n';

// Re-export constants for convenience
export { CURRENCIES };

export type Currency = (typeof CURRENCIES)[number];

// Schema for setting/updating user budget (simplified)
export const SetUserBudgetSchema = () =>
  z
    .object({
      amount: amountValidator(),

      currency: currencyValidator(),

      alertThreshold: z
        .number()
        .min(0, { message: t('forms.validation.budget.alertThresholdMin') })
        .max(1, { message: t('forms.validation.budget.alertThresholdMax') })
        .default(0.8)
        .optional(),

      isActive: z.boolean().default(true).optional(),
    })
    .refine(
      (data) => {
        return data.amount > 0 && data.currency;
      },
      {
        params: { i18nKey: 'forms.validation.budget.amountAndCurrencyRequired' },
        path: ['amount'],
      }
    );

// Type exports for TypeScript
export type SetUserBudgetInput = z.infer<ReturnType<typeof SetUserBudgetSchema>>;

// Validation error type for better error handling
export type ValidationError = {
  path: string[];
  message: string;
};

// Helper function to format validation errors
export const formatUserBudgetValidationErrors = (
  error: z.ZodError
): ValidationError[] => {
  return error.issues.map((err) => ({
    path: err.path.map(String),
    message: err.message,
  }));
};

// Helper to calculate percentage of budget used
export const calculateBudgetPercentage = (spent: number, limit: number): number => {
  if (limit <= 0) return 0;
  return Math.min((spent / limit) * 100, 100);
};

// Helper to check if budget alert should be triggered
export const shouldTriggerBudgetAlert = (
  spent: number,
  limit: number,
  threshold: number
): boolean => {
  if (limit <= 0) return false;
  const percentage = spent / limit;
  return percentage >= threshold;
};

// Helper to format budget amount with currency
export const formatBudgetAmount = (
  amount: number,
  currency: string,
  locale?: string
): string => {
  const currencySymbols: Record<string, string> = {
    TRY: '₺',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };

  const symbol = currencySymbols[currency] || currency;
  const targetLocale = locale === 'tr' ? 'tr-TR' : 'en-US';

  return `${symbol}${amount.toLocaleString(targetLocale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
