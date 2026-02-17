import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "@/lib/i18n";
import { lightTheme, darkTheme } from "@/lib/theme/themes";
import { userSettingsService } from "@/lib/services/userSettingsService";
import { getCurrencySymbol as getCurrencySymbolUtil } from "@/lib/utils/currency";
import { detectDeviceTimezone, isValidTimezone } from "@/lib/utils/timezone";
import type { Theme, ThemeMode } from "@/lib/theme/types";
import type {
  SupportedCurrency,
  SupportedLanguage,
  UserSettings,
  UserSettingsUpdate,
} from "@/lib/types";
import { useEventReminderStore } from "@/stores/eventReminderStore";

export type {
  SupportedCurrency,
  SupportedLanguage,
  UserSettings,
  UserSettingsUpdate,
} from "@/lib/types";

// Trigger lint refresh
interface UserSettingsState {
  settings: UserSettings | null;
  isLoading: boolean;
  error: string | null;
  isRTL: boolean;
  theme: Theme;
  isDark: boolean;
}

interface UserSettingsActions {
  fetchSettings: () => Promise<void>;
  updateSettings: (updates: UserSettingsUpdate) => Promise<void>;
  updateBaseCurrency: (currency: SupportedCurrency) => Promise<void>;
  syncDeviceTimezone: () => Promise<void>;
  initialize: () => Promise<void>;
  clear: () => void;
}

const USER_SETTINGS_STORAGE_KEY = "user-settings-storage";
let timezoneSyncInFlight: Promise<void> | null = null;

const defaultSettings: UserSettings = {
  id: "",
  userId: "",
  baseCurrency: "USD",
  timezone: detectDeviceTimezone(),
  language: "en",
  theme: "dark",
  notificationsEnabled: true,
  budgetNotificationsEnabled: true,
  feedingRemindersEnabled: true,
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
  return themeMode === "light" ? lightTheme : darkTheme;
};

const deriveRTL = (language: SupportedLanguage): boolean => {
  return language === "ar" || language === "he";
};

export const useUserSettingsStore = create<
  UserSettingsState & UserSettingsActions
>()(
  persist(
    (set, get) => ({
      settings: null,
      isLoading: false,
      error: null,
      isRTL: false,
      theme: darkTheme,
      isDark: true,

      fetchSettings: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await userSettingsService.getSettings();

          if (response.success && response.data) {
            let settings = response.data;
            const { setQuietHours, setQuietHoursEnabled } =
              useEventReminderStore.getState();

            if (settings.quietHours) {
              setQuietHours(settings.quietHours);
            }
            if (typeof settings.quietHoursEnabled === "boolean") {
              setQuietHoursEnabled(settings.quietHoursEnabled);
            }

            const deviceTimezone = detectDeviceTimezone();

            if (!settings.timezone || !isValidTimezone(settings.timezone) || settings.timezone !== deviceTimezone) {
              const updateResponse = await userSettingsService.updateSettings({
                timezone: deviceTimezone,
              });
              if (updateResponse.success && updateResponse.data) {
                settings = updateResponse.data;
              }
            }

            set({
              settings,
              isLoading: false,
              error: null,
              isRTL: deriveRTL(settings.language),
              theme: deriveTheme(settings.theme),
              isDark: settings.theme === "dark",
            });

            if (i18n.language !== settings.language) {
              i18n.changeLanguage(settings.language);
            }
          } else {
            throw new Error(response.message || "Failed to fetch settings");
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to fetch settings";

          set({
            isLoading: false,
            error: errorMessage,
          });
        }
      },

      updateSettings: async (updates) => {
        const { settings } = get();

        set({ isLoading: true, error: null });

        try {
          const response = await userSettingsService.updateSettings(updates);

          if (response.success && response.data) {
            const updatedSettings = response.data;
            const { setQuietHours, setQuietHoursEnabled } =
              useEventReminderStore.getState();

            if (updatedSettings.quietHours) {
              setQuietHours(updatedSettings.quietHours);
            }
            if (typeof updatedSettings.quietHoursEnabled === "boolean") {
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
                isDark: updatedSettings.theme === "dark",
              });
            }
          } else {
            throw new Error(response.message || "Failed to update settings");
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to update settings";

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      updateBaseCurrency: async (currency) => {
        set({ isLoading: true, error: null });

        try {
          const response =
            await userSettingsService.updateBaseCurrency(currency);

          if (response.success && response.data) {
            const updatedSettings = response.data;

            set({
              settings: updatedSettings,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error(
              response.message || "Failed to update base currency",
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to update base currency";

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      syncDeviceTimezone: async () => {
        const { settings } = get();
        if (!settings) {
          return;
        }

        const deviceTimezone = detectDeviceTimezone();
        if (!isValidTimezone(deviceTimezone) || settings.timezone === deviceTimezone) {
          return;
        }

        if (timezoneSyncInFlight) {
          await timezoneSyncInFlight;
          return;
        }

        timezoneSyncInFlight = (async () => {
          try {
            const response = await userSettingsService.updateSettings({
              timezone: deviceTimezone,
            });

            if (response.success && response.data) {
              set({
                settings: response.data,
                error: null,
              });
            }
          } finally {
            timezoneSyncInFlight = null;
          }
        })();

        await timezoneSyncInFlight;
      },

      initialize: async () => {
        const { settings } = get();

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
          isRTL: false,
          theme: darkTheme,
          isDark: true,
        });
      },
    }),
    {
      name: USER_SETTINGS_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        settings: state.settings,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.settings) {
          const { settings } = state;
          const { setQuietHours, setQuietHoursEnabled } =
            useEventReminderStore.getState();
          state.isRTL = deriveRTL(settings.language);
          state.theme = deriveTheme(settings.theme);
          state.isDark = settings.theme === "dark";

          if (i18n.language !== settings.language) {
            i18n.changeLanguage(settings.language);
          }
          if (settings.quietHours) {
            setQuietHours(settings.quietHours);
          }
          if (typeof settings.quietHoursEnabled === "boolean") {
            setQuietHoursEnabled(settings.quietHoursEnabled);
          }
        }
      },
    },
  ),
);

export const getSupportedLanguages = (): SupportedLanguage[] => [
  "tr",
  "en",
  "it",
  "de",
  "fr",
  "es",
  "pt",
  "ja",
  "ko",
  "ru",
  "ar",
  "he",
  "ro",
  "nl",
  "sv",
  "da",
  "no",
  "fi",
  "cs",
  "hu",
  "sk",
  "ca",
  "hr",
  "hi",
  "th",
  "vi",
  "ms",
  "zh",
  "zh-TW",
  "pl",
  "el",
  "uk",
  "id",
];

export const isLanguageSupported = (
  language: string,
): language is SupportedLanguage => {
  return [
    "tr",
    "en",
    "it",
    "de",
    "fr",
    "es",
    "pt",
    "ja",
    "ko",
    "ru",
    "ar",
    "he",
    "ro",
    "nl",
    "sv",
    "da",
    "no",
    "fi",
    "cs",
    "hu",
    "sk",
    "ca",
    "hr",
    "hi",
    "th",
    "vi",
    "ms",
    "zh",
    "zh-TW",
    "pl",
    "el",
    "uk",
    "id",
  ].includes(language);
};

export const getLanguageDirection = (
  language: SupportedLanguage,
): "ltr" | "rtl" => {
  return language === "ar" || language === "he" ? "rtl" : "ltr";
};

export const getLanguageDisplayName = (language: SupportedLanguage): string => {
  const displayNames: Record<SupportedLanguage, string> = {
    tr: "Türkçe",
    en: "English",
    it: "Italiano",
    de: "Deutsch",
    fr: "Français",
    es: "Español",
    pt: "Português",
    ja: "日本語",
    ko: "Korean",
    ru: "Russian",
    ar: "Arabic",
    he: "Hebrew",
    ro: "Romanian",
    nl: "Dutch",
    sv: "Swedish",
    da: "Danish",
    no: "Norwegian",
    fi: "Finnish",
    cs: "Czech",
    hu: "Hungarian",
    sk: "Slovak",
    ca: "Catalan",
    hr: "Croatian",
    hi: "Hindi",
    th: "Thai",
    vi: "Vietnamese",
    ms: "Malay",
    zh: "Chinese",
    "zh-TW": "Traditional Chinese",
    pl: "Polish",
    el: "Greek",
    uk: "Ukrainian",
    id: "Indonesian",
  };
  return displayNames[language] || language;
};

export const getLanguageNativeName = (language: SupportedLanguage): string => {
  const nativeNames: Record<SupportedLanguage, string> = {
    tr: "Türkçe",
    en: "English",
    it: "Italiano",
    de: "Deutsch",
    fr: "Français",
    es: "Español",
    pt: "Português",
    ja: "日本語",
    ko: "한국어",
    ru: "Русский",
    ar: "العربية",
    he: "עברית",
    ro: "Română",
    nl: "Nederlands",
    sv: "Svenska",
    da: "Dansk",
    no: "Norsk",
    fi: "Suomi",
    cs: "Čeština",
    hu: "Magyar",
    sk: "Slovenčina",
    ca: "Català",
    hr: "Hrvatski",
    hi: "हिन्दी",
    th: "ไทย",
    vi: "Tiếng Việt",
    ms: "Bahasa Melayu",
    zh: "简体中文",
    "zh-TW": "繁體中文",
    pl: "Polski",
    el: "Ελληνικά",
    uk: "Українська",
    id: "Bahasa Indonesia",
  };
  return nativeNames[language] || language;
};

export const getSupportedCurrencies = (): SupportedCurrency[] => [
  "TRY",
  "USD",
  "EUR",
  "GBP",
  "AUD",
  "BRL",
  "CAD",
  "CHF",
  "CNY",
  "CZK",
  "DKK",
  "HKD",
  "HUF",
  "IDR",
  "ILS",
  "INR",
  "ISK",
  "JPY",
  "KRW",
  "MXN",
  "MYR",
  "NOK",
  "NZD",
  "PHP",
  "PLN",
  "RON",
  "SEK",
  "SGD",
  "THB",
  "ZAR",
];

export const getCurrencyDisplayName = (currency: SupportedCurrency): string => {
  const displayNames: Record<SupportedCurrency, string> = {
    TRY: "Turkish Lira",
    USD: "US Dollar",
    EUR: "Euro",
    GBP: "British Pound",
    AUD: "Australian Dollar",
    BRL: "Brazilian Real",
    CAD: "Canadian Dollar",
    CHF: "Swiss Franc",
    CNY: "Chinese Yuan",
    CZK: "Czech Koruna",
    DKK: "Danish Krone",
    HKD: "Hong Kong Dollar",
    HUF: "Hungarian Forint",
    IDR: "Indonesian Rupiah",
    ILS: "Israeli New Shekel",
    INR: "Indian Rupee",
    ISK: "Icelandic Króna",
    JPY: "Japanese Yen",
    KRW: "South Korean Won",
    MXN: "Mexican Peso",
    MYR: "Malaysian Ringgit",
    NOK: "Norwegian Krone",
    NZD: "New Zealand Dollar",
    PHP: "Philippine Peso",
    PLN: "Polish Złoty",
    RON: "Romanian Leu",
    SEK: "Swedish Krona",
    SGD: "Singapore Dollar",
    THB: "Thai Baht",
    ZAR: "South African Rand",
  };
  return displayNames[currency] || currency;
};

export const getCurrencyFlag = (currency: SupportedCurrency): string => {
  const flags: Record<SupportedCurrency, string> = {
    TRY: "🇹🇷",
    USD: "🇺🇸",
    EUR: "🇪🇺",
    GBP: "🇬🇧",
    AUD: "🇦🇺",
    BRL: "🇧🇷",
    CAD: "🇨🇦",
    CHF: "🇨🇭",
    CNY: "🇨🇳",
    CZK: "🇨🇿",
    DKK: "🇩🇰",
    HKD: "🇭🇰",
    HUF: "🇭🇺",
    IDR: "🇮🇩",
    ILS: "🇮🇱",
    INR: "🇮🇳",
    ISK: "🇮🇸",
    JPY: "🇯🇵",
    KRW: "🇰🇷",
    MXN: "🇲🇽",
    MYR: "🇲🇾",
    NOK: "🇳🇴",
    NZD: "🇳🇿",
    PHP: "🇵🇭",
    PLN: "🇵🇱",
    RON: "🇷🇴",
    SEK: "🇸🇪",
    SGD: "🇸🇬",
    THB: "🇹🇭",
    ZAR: "🇿🇦",
  };
  return flags[currency] || "💱";
};

export const getCurrencySymbol = (currency: SupportedCurrency): string => {
  return getCurrencySymbolUtil(currency);
};

export type { UserSettingsState };
