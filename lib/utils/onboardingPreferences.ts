import * as Localization from 'expo-localization';
import type { SupportedCurrency, SupportedLanguage } from '@/lib/types';
import { detectDeviceTimezone } from '@/lib/utils/timezone';

const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  'tr',
  'en',
  'it',
  'de',
  'fr',
  'es',
  'pt',
  'ja',
  'ko',
  'ru',
  'ar',
  'he',
  'ro',
  'nl',
  'sv',
  'da',
  'no',
  'fi',
  'cs',
  'hu',
  'sk',
  'ca',
  'hr',
  'hi',
  'th',
  'vi',
  'ms',
  'zh',
  'zh-TW',
  'pl',
  'el',
  'uk',
  'id',
];

const REGION_TO_CURRENCY: Partial<Record<string, SupportedCurrency>> = {
  TR: 'TRY',
  US: 'USD',
  CA: 'CAD',
  MX: 'MXN',
  BR: 'BRL',
  AR: 'USD',
  CL: 'USD',
  CO: 'USD',
  PE: 'USD',
  UY: 'USD',
  GB: 'GBP',
  IE: 'EUR',
  FR: 'EUR',
  DE: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  PT: 'EUR',
  NL: 'EUR',
  BE: 'EUR',
  AT: 'EUR',
  GR: 'EUR',
  FI: 'EUR',
  SK: 'EUR',
  SI: 'EUR',
  LV: 'EUR',
  LT: 'EUR',
  EE: 'EUR',
  CY: 'EUR',
  LU: 'EUR',
  MT: 'EUR',
  PL: 'PLN',
  CZ: 'CZK',
  HU: 'HUF',
  RO: 'RON',
  DK: 'DKK',
  SE: 'SEK',
  NO: 'NOK',
  IS: 'ISK',
  CH: 'CHF',
  AU: 'AUD',
  NZ: 'NZD',
  ZA: 'ZAR',
  IN: 'INR',
  JP: 'JPY',
  KR: 'KRW',
  CN: 'CNY',
  HK: 'HKD',
  SG: 'SGD',
  TH: 'THB',
  MY: 'MYR',
  ID: 'IDR',
  PH: 'PHP',
  IL: 'ILS',
};

const isLanguageSupported = (value: string): value is SupportedLanguage => {
  return SUPPORTED_LANGUAGES.includes(value as SupportedLanguage);
};

const detectRecommendedLanguage = (): SupportedLanguage => {
  try {
    const locales = Localization.getLocales();
    const languageCode = locales[0]?.languageCode?.toLowerCase() ?? 'en';
    const regionCode = locales[0]?.regionCode?.toUpperCase();

    if (languageCode === 'zh') {
      if (regionCode === 'TW' || regionCode === 'HK' || regionCode === 'MO') {
        return 'zh-TW';
      }
      return 'zh';
    }

    if (isLanguageSupported(languageCode)) {
      return languageCode;
    }

    return 'en';
  } catch {
    return 'en';
  }
};

const detectRecommendedCurrency = (): SupportedCurrency => {
  try {
    const locales = Localization.getLocales();
    const regionCode = locales[0]?.regionCode?.toUpperCase();
    if (!regionCode) {
      return 'USD';
    }

    return REGION_TO_CURRENCY[regionCode] ?? 'USD';
  } catch {
    return 'USD';
  }
};

export const getRecommendedOnboardingPreferences = (): {
  language: SupportedLanguage;
  currency: SupportedCurrency;
  timezone: string;
} => {
  return {
    language: detectRecommendedLanguage(),
    currency: detectRecommendedCurrency(),
    timezone: detectDeviceTimezone(),
  };
};
