/**
 * Centralized validation limits and enums for Zod schemas.
 * Used across all form schemas for consistent validation rules.
 */

export const VALIDATION_LIMITS = {
  name: { min: 2, max: 50 },
  title: { min: 1, max: 100 },
  description: { max: 500 },
  amount: { min: 0.01, max: 1000000 },
  weight: { min: 0.1, max: 200 },
  dateRange: { maxYearsAgo: 30 },
  timeFormat: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
} as const;

export const CURRENCIES = [
  'TRY', 'USD', 'EUR', 'GBP', 'AUD', 'BRL', 'CAD', 'CHF', 'CNY', 'CZK', 'DKK',
  'HKD', 'HUF', 'IDR', 'ILS', 'INR', 'ISK', 'JPY', 'KRW', 'MXN', 'MYR', 'NOK',
  'NZD', 'PHP', 'PLN', 'RON', 'SEK', 'SGD', 'THB', 'ZAR',
] as const;
export const PAYMENT_METHODS = ['cash', 'credit_card', 'debit_card', 'bank_transfer'] as const;
export const PET_TYPES = ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other'] as const;
export const PET_GENDERS = ['male', 'female', 'other'] as const;
export const EXPENSE_CATEGORIES = [
  'food',
  'premium_food',
  'veterinary',
  'vaccination',
  'medication',
  'grooming',
  'toys',
  'accessories',
  'training',
  'insurance',
  'emergency',
  'other',
] as const;
export const HEALTH_RECORD_TYPES = [
  'checkup',
  'visit',
  'surgery',
  'dental',
  'grooming',
  'other',
] as const;

export type Currency = (typeof CURRENCIES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type PetType = (typeof PET_TYPES)[number];
export type PetGender = (typeof PET_GENDERS)[number];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type HealthRecordType = (typeof HEALTH_RECORD_TYPES)[number];
