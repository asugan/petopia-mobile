import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Import translation files
import en from '../locales/en.json';
import tr from '../locales/tr.json';

// Define resources
const resources = {
  en: {
    translation: en,
  },
  tr: {
    translation: tr,
  },
};

// Get device language or fallback to English
const getDeviceLanguage = () => {
  try {
    const locales = Localization.getLocales();
    const languageCode = locales[0]?.languageCode?.toLowerCase() || 'en';
    return languageCode === 'tr' ? 'tr' : 'en';
  } catch (error) {
    return 'en';
  }
};

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getDeviceLanguage(), // Use device language as default
    fallbackLng: 'en', // Fallback to English
    debug: __DEV__, // Enable debug in development
    supportedLngs: ['en', 'tr'],

    interpolation: {
      escapeValue: false, // React Native already safe from XSS
    },

    react: {
      useSuspense: false, // Disable suspense mode for React Native
      bindI18n: 'languageChanged',
    },
  });

export default i18n;
