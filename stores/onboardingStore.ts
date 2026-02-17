import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupportedCurrency, SupportedLanguage } from '@/lib/types';

interface OnboardingState {
  hasSeenOnboarding: boolean;
  hasHydrated: boolean;
  preferredLanguage: SupportedLanguage | null;
  preferredCurrency: SupportedCurrency | null;
  preferencesSynced: boolean;
}

interface OnboardingActions {
  setHasSeenOnboarding: (value: boolean) => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
  setHasHydrated: (value: boolean) => void;
  setOnboardingPreferences: (preferences: {
    language: SupportedLanguage;
    currency: SupportedCurrency;
  }) => void;
  markPreferencesSynced: (value: boolean) => void;
}

type OnboardingStore = OnboardingState & OnboardingActions;

/**
 * Zustand store for onboarding state management
 * Persists hasSeenOnboarding to prevent showing onboarding again
 */
export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      // Initial state
      hasSeenOnboarding: false,
      hasHydrated: false,
      preferredLanguage: null,
      preferredCurrency: null,
      preferencesSynced: false,

      // Actions
      setHasSeenOnboarding: (value) => set({ hasSeenOnboarding: value }),

      skipOnboarding: () => {
        set({ hasSeenOnboarding: true });
      },

      resetOnboarding: () => {
        set({
          hasSeenOnboarding: false,
          preferredLanguage: null,
          preferredCurrency: null,
          preferencesSynced: false,
        });
      },
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setOnboardingPreferences: ({ language, currency }) =>
        set({
          preferredLanguage: language,
          preferredCurrency: currency,
          preferencesSynced: false,
        }),
      markPreferencesSynced: (value) => set({ preferencesSynced: value }),
    }),
    {
      name: '@petopia_onboarding_storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasSeenOnboarding: state.hasSeenOnboarding,
        preferredLanguage: state.preferredLanguage,
        preferredCurrency: state.preferredCurrency,
        preferencesSynced: state.preferencesSynced,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
