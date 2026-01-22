import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useAuth } from '@/lib/auth/useAuth';

export function useOnboardingCompletion() {
  const router = useRouter();
  const { setHasSeenOnboarding } = useOnboardingStore();
  const { isAuthenticated } = useAuth();

  const completeOnboarding = useCallback(() => {
    setHasSeenOnboarding(true);
    router.replace(isAuthenticated ? '/(tabs)' : '/(auth)/login');
  }, [isAuthenticated, setHasSeenOnboarding, router]);

  const skipPetAndComplete = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  return { completeOnboarding, skipPetAndComplete };
}
