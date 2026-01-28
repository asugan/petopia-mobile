import { default as i18n } from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Import translation files
import en from '../locales/en.json';
import tr from '../locales/tr.json';
import it from '../locales/it.json';
import de from '../locales/de.json';
import fr from '../locales/fr.json';
import es from '../locales/es.json';
import pt from '../locales/pt.json';
import ja from '../locales/ja.json';
import ko from '../locales/ko.json';
import ru from '../locales/ru.json';
import ar from '../locales/ar.json';

// Define resources
const resources = {
  en: {
    translation: en,
  },
  tr: {
    translation: tr,
  },
  it: {
    translation: it,
  },
  de: {
    translation: de,
  },
  fr: {
    translation: fr,
  },
  es: {
    translation: es,
  },
  pt: {
    translation: pt,
  },
  ja: {
    translation: ja,
  },
  ko: {
    translation: ko,
  },
  ru: {
    translation: ru,
  },
  ar: {
    translation: ar,
  },
};

// Get device language or fallback to English
const getDeviceLanguage = () => {
  try {
    const locales = Localization.getLocales();
    const languageCode = locales[0]?.languageCode?.toLowerCase() || 'en';
    if (languageCode === 'tr') return 'tr';
    if (languageCode === 'it') return 'it';
    if (languageCode === 'de') return 'de';
    if (languageCode === 'fr') return 'fr';
    if (languageCode === 'es') return 'es';
    if (languageCode === 'pt') return 'pt';
    if (languageCode === 'ja') return 'ja';
    if (languageCode === 'ko') return 'ko';
    if (languageCode === 'ru') return 'ru';
    if (languageCode === 'ar') return 'ar';
    return 'en';
  } catch {
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
    supportedLngs: ['en', 'tr', 'it', 'de', 'fr', 'es', 'pt', 'ja', 'ko', 'ru', 'ar'],

    interpolation: {
      escapeValue: false, // React Native already safe from XSS
    },

    react: {
      useSuspense: false, // Disable suspense mode for React Native
      bindI18n: 'languageChanged',
    },
  });

export default i18n;
