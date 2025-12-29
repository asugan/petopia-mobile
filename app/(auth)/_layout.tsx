import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTheme } from '@/lib/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';

export default function AuthLayout() {
  const { theme } = useTheme();
  const router = useRouter();
  const { hasSeenOnboarding, hasHydrated } = useOnboardingStore();

  useEffect(() => {
    if (!hasHydrated) return;

    if (!hasSeenOnboarding) {
      router.replace('/(onboarding)');
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
      <Stack.Screen name="signup" />
    </Stack>
  );
}
