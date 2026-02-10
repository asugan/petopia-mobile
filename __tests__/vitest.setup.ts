/**
 * Vitest setup for pure logic testing
 * Mocks React Native and Expo modules that aren't available in Node.js
 */

import type { ReactNode } from 'react';
import { vi, afterEach } from 'vitest';

// Mock __DEV__ global (used in React Native)
(globalThis as { __DEV__?: boolean }).__DEV__ = false;

// Mock React Native
vi.mock(
  'react-native',
  () => ({
  Platform: {
    OS: 'ios',
    select: (obj: { ios?: unknown }) => obj.ios,
    Version: 18,
  },
  Dimensions: {
    get: () => ({ width: 375, height: 667, scale: 2, fontScale: 1 }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
  StyleSheet: {
    create: <T extends Record<string, unknown>>(styles: T) => styles,
    flatten: (style: unknown) => style,
  },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  ScrollView: 'ScrollView',
  FlatList: 'FlatList',
  Image: 'Image',
  TextInput: 'TextInput',
  ActivityIndicator: 'ActivityIndicator',
  SafeAreaView: 'SafeAreaView',
  StatusBar: 'StatusBar',
  }),
);

// Mock AsyncStorage (used by Zustand persist)
vi.mock(
  '@react-native-async-storage/async-storage',
  () => ({
    setItem: vi.fn(),
    getItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    getAllKeys: vi.fn(),
    multiSet: vi.fn(),
    multiGet: vi.fn(),
    multiRemove: vi.fn(),
  }),
);

// Mock Expo modules
vi.mock(
  'expo-font',
  () => ({
    loadAsync: vi.fn(),
    isLoaded: vi.fn(() => true),
  }),
);

vi.mock('expo-localization', () => ({
  locale: 'en-US',
  locales: ['en-US'],
  timezone: 'Europe/Istanbul',
  getLocales: () => [
    {
      languageTag: 'en-US',
      languageCode: 'en',
      regionCode: 'US',
      isRTL: false,
    },
  ],
  getCalendars: () => [],
}));

// Mock static image assets required through constants/images
vi.mock('@/assets/images/cat_avatar.webp', () => ({ default: 1 }));
vi.mock('@/assets/images/dog_avatar.webp', () => ({ default: 1 }));
vi.mock('@/assets/images/bird_avatar.webp', () => ({ default: 1 }));
vi.mock('@/assets/images/rabbit_avatar.webp', () => ({ default: 1 }));
vi.mock('@/assets/images/hamster_avatar.webp', () => ({ default: 1 }));
vi.mock('@/assets/images/fish_avatar.webp', () => ({ default: 1 }));
vi.mock('@/assets/images/reptile_avatar.webp', () => ({ default: 1 }));
vi.mock('@/assets/images/other_avatar.webp', () => ({ default: 1 }));

// Mock React Navigation
vi.mock(
  '@react-navigation/native',
  () => ({
    useNavigation: () => ({
      navigate: vi.fn(),
      goBack: vi.fn(),
      replace: vi.fn(),
    }),
    useRoute: () => ({
      params: {},
      name: 'test',
    }),
  }),
);

// Mock expo-router
vi.mock(
  'expo-router',
  () => ({
    useRouter: () => ({
      navigate: vi.fn(),
      goBack: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
    }),
    useLocalSearchParams: () => ({}),
    useSegments: () => [],
  }),
);

// Mock Zustand persist
vi.mock('zustand/middleware', () => ({
  persist: <T>(config: T) => config,
  createJSONStorage: () => ({
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  }),
}));

// Mock react-hook-form
vi.mock('react-hook-form', () => ({
  useForm: vi.fn(() => ({
    control: {},
    errors: {},
    isSubmitting: false,
    isValid: false,
    touchedFields: {},
    dirtyFields: {},
    handleSubmit: vi.fn(),
    reset: vi.fn(),
    setValue: vi.fn(),
    getValues: vi.fn(),
    trigger: vi.fn(),
    watch: vi.fn(),
  })),
}));

// Mock react-i18next
vi.mock('react-i18next', () => {
  const t = (key: string) => key;
  const i18nInstance = {
    changeLanguage: vi.fn(),
    language: 'en',
    init: vi.fn(),
    use: vi.fn(() => i18nInstance),
  };

  return {
    initReactI18next: { type: '3rdParty', init: vi.fn() },
    useTranslation: () => ({
      t,
      i18n: i18nInstance,
    }),
    I18nextProvider: ({ children }: { children: ReactNode }) => children,
  };
});

// Mock i18next
vi.mock('i18next', () => ({
  default: {
    use: vi.fn(function (this: Record<string, unknown>) {
      return this;
    }),
    init: vi.fn(),
    createInstance: vi.fn(),
  },
}));

// Mock Better Auth client for hooks that read session info
vi.mock('@/lib/auth/client', () => ({
  authClient: {
    useSession: vi.fn(() => ({
      data: {
        user: {
          id: 'test-user-id',
        },
      },
    })),
  },
}));

// Mock @expo/vector-icons
vi.mock(
  '@expo/vector-icons',
  () => ({
    MaterialCommunityIcons: 'MaterialCommunityIcons',
    Ionicons: 'Ionicons',
    AntDesign: 'AntDesign',
    FontAwesome: 'FontAwesome',
  }),
);

// Mock expo-notifications
vi.mock(
  'expo-notifications',
  () => ({
    scheduleNotificationAsync: vi.fn(),
    cancelScheduledNotificationAsync: vi.fn(),
    cancelAllScheduledNotificationsAsync: vi.fn(),
    getAllScheduledNotificationsAsync: vi.fn(),
    setNotificationHandler: vi.fn(),
    addNotificationReceivedListener: vi.fn(),
    addNotificationResponseReceivedListener: vi.fn(),
    requestPermissionsAsync: vi.fn(),
    getPermissionsAsync: vi.fn(),
    AndroidImportance: { DEFAULT: 0, HIGH: 2 },
    iOSNotificationCategoryActionIdentifier: { DEFAULT: 'default' },
    NotificationBehaviorAndroid: { DEFAULT: 'default' },
  }),
);

// Mock RevenueCat SDK modules (JS bundle is not node-test friendly)
vi.mock('react-native-purchases', () => ({
  default: {
    isConfigured: vi.fn().mockResolvedValue(true),
    getOfferings: vi.fn(),
    getCustomerInfo: vi.fn(),
    purchasePackage: vi.fn(),
  },
  PURCHASES_ERROR_CODE: {
    PURCHASE_CANCELLED_ERROR: 'PURCHASE_CANCELLED_ERROR',
    PRODUCT_ALREADY_PURCHASED_ERROR: 'PRODUCT_ALREADY_PURCHASED_ERROR',
  },
}));

vi.mock('react-native-purchases-ui', () => ({
  default: {
    presentPaywall: vi.fn(),
    presentPaywallIfNeeded: vi.fn(),
    presentCustomerCenter: vi.fn(),
  },
  PAYWALL_RESULT: {
    PURCHASED: 'PURCHASED',
    RESTORED: 'RESTORED',
    CANCELLED: 'CANCELLED',
    NOT_PRESENTED: 'NOT_PRESENTED',
    ERROR: 'ERROR',
  },
}));

// Mock reminder scheduler hook
vi.mock('@/hooks/useReminderScheduler', () => ({
  useReminderScheduler: () => ({
    scheduleChainForEvent: vi.fn(),
    cancelRemindersForEvent: vi.fn(),
    clearReminderState: vi.fn(),
  }),
}));

// Mock theme related modules (simplify for pure logic tests)
vi.mock('@/lib/theme', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        primary: '#0000FF',
        background: '#FFFFFF',
        text: '#000000',
      },
    },
    isDark: false,
  }),
}));

// Mock user settings store
vi.mock('@/stores/userSettingsStore', () => ({
  useUserSettingsStore: () => ({
    settings: {
      id: 'test-settings-id',
      userId: 'test-user-id',
      baseCurrency: 'TRY',
      timezone: 'Europe/Istanbul',
      language: 'en',
      theme: 'light',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    theme: {
      colors: {
        primary: '#0000FF',
        background: '#FFFFFF',
        text: '#000000',
      },
    },
    isDark: false,
    isLoading: false,
    error: null,
    isAuthenticated: false,
    isRTL: false,
    fetchSettings: vi.fn(),
    updateSettings: vi.fn(),
    updateBaseCurrency: vi.fn(),
    initialize: vi.fn(),
    clear: vi.fn(),
    setAuthenticated: vi.fn(),
  }),
  isLanguageSupported: (lang: unknown): lang is 'tr' | 'en' =>
    typeof lang === 'string' && ['tr', 'en'].includes(lang),
  getLanguageDirection: (_lang: string) => 'ltr',
  getLanguageDisplayName: (lang: string) => ({ tr: 'Türkçe', en: 'English' })[lang] || lang,
  getLanguageNativeName: (lang: string) => ({ tr: 'Türkçe', en: 'English' })[lang] || lang,
  getSupportedLanguages: () => ['tr', 'en'], 
  getSupportedCurrencies: () => ['TRY', 'USD', 'EUR', 'GBP'],
  getCurrencyDisplayName: (curr: string) => ({ TRY: 'Turkish Lira', USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound' })[curr] || curr,
  getCurrencyFlag: (curr: string) => ({ TRY: '🇹🇷', USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧' })[curr] || '💱',
  getCurrencySymbol: (curr: string) => ({ TRY: '₺', USD: '$', EUR: '€', GBP: '£' })[curr] || curr,
}));

// Global test utilities
globalThis.fetch = vi.fn() as typeof fetch;

// Reset mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});
