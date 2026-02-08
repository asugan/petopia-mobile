import { Tabs, useRouter, useSegments } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { authClient } from '@/lib/auth/client';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { ONBOARDING_ROUTES, AUTH_ROUTES } from '@/constants/routes';

export default function TabLayout() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const segments = useSegments();

  const { hasSeenOnboarding, hasHydrated } = useOnboardingStore();

  const { data: session, isPending } = authClient.useSession();
  const isAuthenticated = !!session?.user;

  useEffect(() => {
    if (isPending || !hasHydrated) return;

    if (!hasSeenOnboarding) {
      router.replace(ONBOARDING_ROUTES.step1);
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace(AUTH_ROUTES.login);
    }
  }, [hasHydrated, hasSeenOnboarding, isAuthenticated, isPending, segments, router]);

  if (isPending || !hasHydrated) {
    return null;
  }

  const TAB_BAR_HEIGHT = 56;
  const tabBarBottomInset = Math.max(insets.bottom - 8, 6);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurface,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          borderTopWidth: 1,
          paddingTop: 6,
          paddingBottom: tabBarBottomInset,
          height: TAB_BAR_HEIGHT + tabBarBottomInset,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarShowLabel: false,
        headerShown: false,
        sceneStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('navigation.home'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pets"
        options={{
          title: t('navigation.pets'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="paw" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t('navigation.calendar'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="care"
        options={{
          title: t('navigation.care'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="heart-pulse" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: t('navigation.finance'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="wallet" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
