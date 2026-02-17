import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { TAB_ROUTES } from '@/constants/routes';

export function useOnboardingCompletion() {
  const router = useRouter();
  const { setHasSeenOnboarding } = useOnboardingStore();

  const completeOnboarding = useCallback(() => {
    setHasSeenOnboarding(true);
    router.replace(TAB_ROUTES.home);
  }, [setHasSeenOnboarding, router]);

  const skipPetAndComplete = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  return { completeOnboarding, skipPetAndComplete };
}
