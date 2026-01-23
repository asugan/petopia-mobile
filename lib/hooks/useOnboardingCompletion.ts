import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useAuth } from '@/lib/auth/useAuth';
import { TAB_ROUTES, AUTH_ROUTES } from '@/constants/routes';

export function useOnboardingCompletion() {
  const router = useRouter();
  const { setHasSeenOnboarding } = useOnboardingStore();
  const { isAuthenticated } = useAuth();

  const completeOnboarding = useCallback(() => {
    setHasSeenOnboarding(true);
    router.replace(isAuthenticated ? TAB_ROUTES.home : AUTH_ROUTES.login);
  }, [isAuthenticated, setHasSeenOnboarding, router]);

  const skipPetAndComplete = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  return { completeOnboarding, skipPetAndComplete };
}
