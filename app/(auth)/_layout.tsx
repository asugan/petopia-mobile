import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTheme } from '@/lib/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { ONBOARDING_ROUTES } from '@/constants/routes';

export default function AuthLayout() {
  const { theme } = useTheme();
  const router = useRouter();
  const { hasSeenOnboarding, hasHydrated } = useOnboardingStore();

  useEffect(() => {
    if (!hasHydrated) return;

    if (!hasSeenOnboarding) {
      router.replace(ONBOARDING_ROUTES.step1);
    }
  }, [hasHydrated, hasSeenOnboarding, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="login" />
    </Stack>
  );
}
