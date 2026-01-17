import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/lib/i18n';
import { lightTheme, darkTheme } from '@/lib/theme/themes';
import { userSettingsService } from '@/lib/services/userSettingsService';
import { getCurrencySymbol as getCurrencySymbolUtil } from '@/lib/utils/currency';
import type { Theme, ThemeMode } from '@/lib/theme/types';
import type {
  SupportedCurrency,
  SupportedLanguage,
  UserSettings,
  UserSettingsUpdate,
} from '@/lib/types';
import { useEventReminderStore } from '@/stores/eventReminderStore';

export type {
  SupportedCurrency,
  SupportedLanguage,
  UserSettings,
  UserSettingsUpdate,
} from '@/lib/types';

interface UserSettingsState {
  settings: UserSettings | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isRTL: boolean;
  theme: Theme;
  isDark: boolean;
}

interface UserSettingsActions {
  fetchSettings: () => Promise<void>;
  updateSettings: (updates: UserSettingsUpdate) => Promise<void>;
  updateBaseCurrency: (currency: SupportedCurrency) => Promise<void>;
  initialize: () => Promise<void>;
  clear: () => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
}

const USER_SETTINGS_STORAGE_KEY = 'user-settings-storage';

const defaultSettings: UserSettings = {
  id: '',
  userId: '',
  baseCurrency: 'USD',
  timezone: 'Europe/Istanbul',
  language: 'en',
  theme: 'dark',
  notificationsEnabled: true,
  budgetNotificationsEnabled: true,
  quietHoursEnabled: true,
  quietHours: {
    startHour: 22,
    startMinute: 0,
    endHour: 8,
    endMinute: 0,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const deriveTheme = (themeMode: ThemeMode): Theme => {
  return themeMode === 'light' ? lightTheme : darkTheme;
};

const deriveRTL = (_language: SupportedLanguage): boolean => {
  return false;
};

export const useUserSettingsStore = create<UserSettingsState & UserSettingsActions>()(
  persist(
    (set, get) => ({
      settings: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
      isRTL: false,
      theme: darkTheme,
      isDark: true,

      fetchSettings: async () => {
        const { isAuthenticated } = get();

        if (!isAuthenticated) {
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await userSettingsService.getSettings();

          if (response.success && response.data) {
            const settings = response.data;
            const { setQuietHours, setQuietHoursEnabled } = useEventReminderStore.getState();

            if (settings.quietHours) {
              setQuietHours(settings.quietHours);
            }
            if (typeof settings.quietHoursEnabled === 'boolean') {
              setQuietHoursEnabled(settings.quietHoursEnabled);
            }

            set({
              settings,
              isLoading: false,
              error: null,
              isRTL: deriveRTL(settings.language),
              theme: deriveTheme(settings.theme),
              isDark: settings.theme === 'dark',
            });

            if (i18n.language !== settings.language) {
              i18n.changeLanguage(settings.language);
            }

          } else {
            throw new Error(response.message || 'Failed to fetch settings');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch settings';

          set({
            isLoading: false,
            error: errorMessage,
          });
        }
      },

      updateSettings: async (updates) => {
        const { isAuthenticated, settings } = get();

        if (!isAuthenticated) {
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await userSettingsService.updateSettings(updates);

          if (response.success && response.data) {
            const updatedSettings = response.data;
            const { setQuietHours, setQuietHoursEnabled } = useEventReminderStore.getState();

            if (updatedSettings.quietHours) {
              setQuietHours(updatedSettings.quietHours);
            }
            if (typeof updatedSettings.quietHoursEnabled === 'boolean') {
              setQuietHoursEnabled(updatedSettings.quietHoursEnabled);
            }

            set({
              settings: updatedSettings,
              isLoading: false,
              error: null,
            });

            if (updatedSettings.language !== settings?.language) {
              i18n.changeLanguage(updatedSettings.language);
              set({ isRTL: deriveRTL(updatedSettings.language) });
            }

            if (updatedSettings.theme !== settings?.theme) {
              const newTheme = deriveTheme(updatedSettings.theme);
              set({
                theme: newTheme,
                isDark: updatedSettings.theme === 'dark',
              });
            }

          } else {
            throw new Error(response.message || 'Failed to update settings');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update settings';

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      updateBaseCurrency: async (currency) => {
        const { isAuthenticated, settings } = get();

        if (!isAuthenticated) {
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await userSettingsService.updateBaseCurrency(currency);

          if (response.success && response.data) {
            const updatedSettings = response.data;

            set({
              settings: updatedSettings,
              isLoading: false,
              error: null,
            });

          } else {
            throw new Error(response.message || 'Failed to update base currency');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update base currency';

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      initialize: async () => {
        const { isAuthenticated, settings } = get();

        if (!isAuthenticated) {
          return;
        }

        if (settings && i18n.language !== settings.language) {
          i18n.changeLanguage(settings.language);
        }

        await get().fetchSettings();
      },

      clear: () => {
        set({
          settings: null,
          isLoading: false,
          error: null,
          isAuthenticated: false,
          isRTL: false,
          theme: darkTheme,
          isDark: true,
        });
      },

      setAuthenticated: (isAuthenticated: boolean) => {
        set({ isAuthenticated });
      },
    }),
    {
      name: USER_SETTINGS_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        settings: state.settings,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.settings) {
          const { settings } = state;
          const { setQuietHours, setQuietHoursEnabled } = useEventReminderStore.getState();
          state.isRTL = deriveRTL(settings.language);
          state.theme = deriveTheme(settings.theme);
          state.isDark = settings.theme === 'dark';

          if (i18n.language !== settings.language) {
            i18n.changeLanguage(settings.language);
          }
          if (settings.quietHours) {
            setQuietHours(settings.quietHours);
          }
          if (typeof settings.quietHoursEnabled === 'boolean') {
            setQuietHoursEnabled(settings.quietHoursEnabled);
          }

        }
      },
    }
  )
);

export const getSupportedLanguages = (): SupportedLanguage[] => ['tr', 'en'];

export const isLanguageSupported = (language: string): language is SupportedLanguage => {
  return ['tr', 'en'].includes(language);
};

export const getLanguageDirection = (_language: SupportedLanguage): 'ltr' | 'rtl' => {
  return 'ltr';
};

export const getLanguageDisplayName = (language: SupportedLanguage): string => {
  const displayNames: Record<SupportedLanguage, string> = {
    tr: 'Türkçe',
    en: 'English',
  };
  return displayNames[language] || language;
};

export const getLanguageNativeName = (language: SupportedLanguage): string => {
  const nativeNames: Record<SupportedLanguage, string> = {
    tr: 'Türkçe',
    en: 'English',
  };
  return nativeNames[language] || language;
};

export const getSupportedCurrencies = (): SupportedCurrency[] => ['TRY', 'USD', 'EUR', 'GBP'];

export const getCurrencyDisplayName = (currency: SupportedCurrency): string => {
  const displayNames: Record<SupportedCurrency, string> = {
    TRY: 'Turkish Lira',
    USD: 'US Dollar',
    EUR: 'Euro',
    GBP: 'British Pound',
  };
  return displayNames[currency] || currency;
};

export const getCurrencyFlag = (currency: SupportedCurrency): string => {
  const flags: Record<SupportedCurrency, string> = {
    TRY: '🇹🇷',
    USD: '🇺🇸',
    EUR: '🇪🇺',
    GBP: '🇬🇧',
  };
  return flags[currency] || '💱';
};

export const getCurrencySymbol = (currency: SupportedCurrency): string => {
  return getCurrencySymbolUtil(currency);
};

export type { UserSettingsState };
