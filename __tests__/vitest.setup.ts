/**
 * Vitest setup for pure logic testing
 * Mocks React Native and Expo modules that aren't available in Node.js
 */

// Mock __DEV__ global (used in React Native)
(globalThis as any).__DEV__ = false;

// Mock React Native
vi.mock(
  'react-native',
  () => ({
  Platform: {
    OS: 'ios',
    select: (obj: any) => obj.ios,
    Version: 18,
  },
  Dimensions: {
    get: () => ({ width: 375, height: 667, scale: 2, fontScale: 1 }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
  StyleSheet: {
    create: (styles: any) => styles,
    flatten: (style: any) => style,
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
  { virtual: true }
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
  { virtual: true }
);

// Mock Expo modules
vi.mock(
  'expo-constants',
  () => ({
    default: {
      expoConfig: {
        version: '1.0.0',
      },
      executionEnvironment: 'storeClient',
    },
  }),
  { virtual: true }
);

vi.mock(
  'expo-font',
  () => ({
    loadAsync: vi.fn(),
    isLoaded: vi.fn(() => true),
  }),
  { virtual: true }
);

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
  { virtual: true }
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
  { virtual: true }
);

// Mock Zustand persist
vi.mock('zustand/middleware', () => ({
  persist: (config: any) => config,
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
    I18nextProvider: ({ children }: any) => children,
  };
});

// Mock i18next
vi.mock('i18next', () => ({
  default: {
    use: vi.fn(function(this: any) {
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
  { virtual: true }
);

// Mock expo modules that have internal dependencies
vi.mock(
  'expo',
  () => ({
    Constants: { expoConfig: { version: '1.0.0' } },
  }),
  { virtual: true }
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
  { virtual: true }
);

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
  }),
}));

vi.mock('@/stores/themeStore', () => ({
  useThemeStore: () => ({
    themeMode: 'light',
    theme: {
      colors: {
        primary: '#0000FF',
        background: '#FFFFFF',
      },
    },
    isDark: false,
    toggleTheme: vi.fn(),
    setTheme: vi.fn(),
  }),
}));

// Mock language store
vi.mock('@/stores/languageStore', () => ({
  useLanguageStore: () => ({
    language: 'en',
    isRTL: false,
    hasUserExplicitlySetLanguage: false,
    setLanguage: vi.fn(),
    toggleLanguage: vi.fn(),
    initializeLanguage: vi.fn(),
  }),
}));

// Global test utilities
global.fetch = vi.fn();

// Reset mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});
