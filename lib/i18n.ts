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
import hi from '../locales/hi.json';
import th from '../locales/th.json';
import vi from '../locales/vi.json';
import ms from '../locales/ms.json';
import zh from '../locales/zh.json';
import zhTW from '../locales/zh-TW.json';
import pl from '../locales/pl.json';
import el from '../locales/el.json';
import he from '../locales/he.json';
import ro from '../locales/ro.json';
import nl from '../locales/nl.json';
import sv from '../locales/sv.json';
import da from '../locales/da.json';
import no from '../locales/no.json';
import fi from '../locales/fi.json';
import cs from '../locales/cs.json';
import hu from '../locales/hu.json';
import sk from '../locales/sk.json';
import ca from '../locales/ca.json';
import hr from '../locales/hr.json';
import uk from '../locales/uk.json';

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
  he: {
    translation: he,
  },
  ro: {
    translation: ro,
  },
  nl: {
    translation: nl,
  },
  sv: {
    translation: sv,
  },
  da: {
    translation: da,
  },
  no: {
    translation: no,
  },
  fi: {
    translation: fi,
  },
  cs: {
    translation: cs,
  },
  hu: {
    translation: hu,
  },
  sk: {
    translation: sk,
  },
  ca: {
    translation: ca,
  },
  hr: {
    translation: hr,
  },
  uk: {
    translation: uk,
  },
  hi: {
    translation: hi,
  },
  th: {
    translation: th,
  },
  vi: {
    translation: vi,
  },
  ms: {
    translation: ms,
  },
  zh: {
    translation: zh,
  },
  'zh-TW': {
    translation: zhTW,
  },
  pl: {
    translation: pl,
  },
  el: {
    translation: el,
  },
};

// Get device language or fallback to English
const getDeviceLanguage = () => {
  try {
    const locales = Localization.getLocales();
    const languageCode = locales[0]?.languageCode?.toLowerCase() || 'en';
    const regionCode = locales[0]?.regionCode?.toUpperCase();

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
    if (languageCode === 'he') return 'he';
    if (languageCode === 'ro') return 'ro';
    if (languageCode === 'nl') return 'nl';
    if (languageCode === 'sv') return 'sv';
    if (languageCode === 'da') return 'da';
    if (languageCode === 'no') return 'no';
    if (languageCode === 'fi') return 'fi';
    if (languageCode === 'cs') return 'cs';
    if (languageCode === 'hu') return 'hu';
    if (languageCode === 'sk') return 'sk';
    if (languageCode === 'ca') return 'ca';
    if (languageCode === 'hr') return 'hr';
    if (languageCode === 'hi') return 'hi';
    if (languageCode === 'th') return 'th';
    if (languageCode === 'vi') return 'vi';
    if (languageCode === 'ms') return 'ms';
    if (languageCode === 'pl') return 'pl';
    if (languageCode === 'el') return 'el';
    if (languageCode === 'uk') return 'uk';
    if (languageCode === 'zh') {
      if (regionCode === 'TW' || regionCode === 'HK' || regionCode === 'MO') {
        return 'zh-TW';
      }
      return 'zh';
    }
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
    supportedLngs: ['en', 'tr', 'it', 'de', 'fr', 'es', 'pt', 'ja', 'ko', 'ru', 'ar', 'he', 'ro', 'nl', 'sv', 'da', 'no', 'fi', 'cs', 'hu', 'sk', 'ca', 'hr', 'hi', 'th', 'vi', 'ms', 'zh', 'zh-TW', 'pl', 'el', 'uk'],

    interpolation: {
      escapeValue: false, // React Native already safe from XSS
    },

    react: {
      useSuspense: false, // Disable suspense mode for React Native
      bindI18n: 'languageChanged',
    },
  });

export default i18n;
