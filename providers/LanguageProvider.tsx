import { useEffect } from 'react';
import { useUserSettingsStore } from '../stores/userSettingsStore';
import { I18nextProvider } from 'react-i18next';
import i18n from '../lib/i18n';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useUserSettingsStore();
  const language = settings?.language;

  useEffect(() => {
    if (language && i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}