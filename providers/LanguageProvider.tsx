import { useEffect } from 'react';
import { useLanguageStore } from '../stores/languageStore';
import { I18nextProvider } from 'react-i18next';
import i18n from '../lib/i18n';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { language, initializeLanguage } = useLanguageStore();

  useEffect(() => {
    initializeLanguage();
  }, []);

  useEffect(() => {
    // Update i18n language when store language changes
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}