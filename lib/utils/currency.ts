import type { Currency } from '@/lib/schemas/expenseSchema';
import type { IconName } from '@/lib/types';

// Currency to locale mapping for proper number formatting
const CURRENCY_LOCALE_MAP: Record<Currency, string> = {
  TRY: 'tr-TR',
  USD: 'en-US',
  EUR: 'fr-FR',
  GBP: 'en-GB',
  AUD: 'en-AU',
  BRL: 'pt-BR',
  CAD: 'en-CA',
  CHF: 'de-CH',
  CNY: 'zh-CN',
  CZK: 'cs-CZ',
  DKK: 'da-DK',
  HKD: 'zh-HK',
  HUF: 'hu-HU',
  IDR: 'id-ID',
  ILS: 'he-IL',
  INR: 'hi-IN',
  ISK: 'is-IS',
  JPY: 'ja-JP',
  KRW: 'ko-KR',
  MXN: 'es-MX',
  MYR: 'ms-MY',
  NOK: 'nb-NO',
  NZD: 'en-NZ',
  PHP: 'fil-PH',
  PLN: 'pl-PL',
  RON: 'ro-RO',
  SEK: 'sv-SE',
  SGD: 'en-SG',
  THB: 'th-TH',
  ZAR: 'en-ZA',
};

// Currency to icon name mapping for MaterialCommunityIcons
const CURRENCY_ICON_MAP: Record<Currency, IconName> = {
  TRY: 'currency-try',
  USD: 'currency-usd',
  EUR: 'currency-eur',
  GBP: 'currency-gbp',
  AUD: 'currency-usd', // Fallback to usd icon
  BRL: 'currency-usd',
  CAD: 'currency-usd',
  CHF: 'currency-usd',
  CNY: 'currency-usd',
  CZK: 'currency-usd',
  DKK: 'currency-usd',
  HKD: 'currency-usd',
  HUF: 'currency-usd',
  IDR: 'currency-usd',
  ILS: 'currency-usd',
  INR: 'currency-usd',
  ISK: 'currency-usd',
  JPY: 'currency-jpy',
  KRW: 'currency-usd',
  MXN: 'currency-usd',
  MYR: 'currency-usd',
  NOK: 'currency-usd',
  NZD: 'currency-usd',
  PHP: 'currency-usd',
  PLN: 'currency-usd',
  RON: 'currency-usd',
  SEK: 'currency-usd',
  SGD: 'currency-usd',
  THB: 'currency-usd',
  ZAR: 'currency-usd',
};

// Currency symbols (for fallback or custom formatting)
const CURRENCY_SYMBOLS: Record<Currency, string> = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AUD: 'A$',
  BRL: 'R$',
  CAD: 'C$',
  CHF: 'Fr',
  CNY: '¥',
  CZK: 'Kč',
  DKK: 'kr',
  HKD: 'HK$',
  HUF: 'Ft',
  IDR: 'Rp',
  ILS: '₪',
  INR: '₹',
  ISK: 'kr',
  JPY: '¥',
  KRW: '₩',
  MXN: '$',
  MYR: 'RM',
  NOK: 'kr',
  NZD: 'NZ$',
  PHP: '₱',
  PLN: 'zł',
  RON: 'lei',
  SEK: 'kr',
  SGD: 'S$',
  THB: '฿',
  ZAR: 'R',
};

/**
 * Get the icon name for a currency (for MaterialCommunityIcons)
 * @param currency - Currency code (e.g., 'TRY', 'USD', 'EUR', 'GBP')
 * @returns Icon name or undefined if not found
 */
export const getCurrencyIcon = (currency: Currency): IconName => {
  return CURRENCY_ICON_MAP[currency] || 'cash';
};

/**
 * Format currency amount using the proper locale for the currency
 * Uses Intl.NumberFormat for correct formatting
 * @param amount - The amount to format
 * @param currency - Currency code (e.g., 'TRY', 'USD', 'EUR', 'GBP')
 * @param locale - Optional locale override (defaults to currency's preferred locale)
 * @returns Formatted currency string (e.g., "₺1.234,56" or "$1,234.56")
 */
export const formatCurrency = (
  amount: number | null | undefined,
  currency: Currency,
  locale?: string
): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${CURRENCY_SYMBOLS[currency] || currency}0.00`;
  }

  // Use currency-specific locale if not provided
  const targetLocale = locale || CURRENCY_LOCALE_MAP[currency] || 'tr-TR';

  // Use Intl.NumberFormat for proper currency formatting
  const formatter = new Intl.NumberFormat(targetLocale, {
    style: 'decimal', // Use decimal style to avoid currency symbol prefix
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedNumber = formatter.format(amount);
  const symbol = CURRENCY_SYMBOLS[currency] || currency;

  return `${symbol}${formattedNumber}`;
};

/**
 * Format currency amount with currency style (includes currency code/symbol automatically)
 * Uses Intl.NumberFormat with style: 'currency'
 * @param amount - The amount to format
 * @param currency - Currency code
 * @returns Formatted currency string (e.g., "₺1,234.56" or "$1,234.56")
 *
 * NOTE: This may produce slightly different formatting than formatCurrency()
 * due to browser Intl implementation differences.
 */
export const formatCurrencyIntl = (
  amount: number | null | undefined,
  currency: Currency,
  locale?: string
): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `0.00 ${currency}`;
  }

  const targetLocale = locale || CURRENCY_LOCALE_MAP[currency] || 'tr-TR';

  const formatter = new Intl.NumberFormat(targetLocale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
};

/**
 * Parse currency string input to number
 * @param text - Input string (e.g., "1,234.56" or "1.234,56")
 * @returns Parsed number or undefined
 */
export const parseCurrencyInput = (text: string): number | undefined => {
  if (!text || text.trim() === '') {
    return undefined;
  }

  let cleaned = text.replace(/[^\d.,]/g, '');
  if (!cleaned) {
    return undefined;
  }

  const hasDot = cleaned.includes('.');
  const hasComma = cleaned.includes(',');

  if (hasDot && hasComma) {
    const lastDotIndex = cleaned.lastIndexOf('.');
    const lastCommaIndex = cleaned.lastIndexOf(',');
    const decimalSeparator = lastDotIndex > lastCommaIndex ? '.' : ',';
    const thousandsSeparator = decimalSeparator === '.' ? ',' : '.';

    cleaned = cleaned
      .split(thousandsSeparator)
      .join('')
      .replace(decimalSeparator, '.');
  } else {
    const separator = hasDot ? '.' : hasComma ? ',' : null;

    if (separator) {
      const firstIndex = cleaned.indexOf(separator);
      const lastIndex = cleaned.lastIndexOf(separator);
      const appearsOnce = firstIndex === lastIndex;
      const digitsAfter = cleaned.length - lastIndex - 1;
      const isSeparatorNearEnd = lastIndex >= cleaned.length - 3;

      const treatAsDecimal = appearsOnce && isSeparatorNearEnd && digitsAfter > 0;

      if (treatAsDecimal) {
        cleaned = cleaned.replace(separator, '.');
      } else {
        cleaned = cleaned.split(separator).join('');
      }
    }
  }

  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? undefined : parsed;
};

/**
 * Get currency symbol for display purposes
 * @param currency - Currency code
 * @returns Currency symbol (e.g., '₺', '$', '€', '£')
 */
export const getCurrencySymbol = (currency: Currency): string => {
  return CURRENCY_SYMBOLS[currency] || currency;
};
