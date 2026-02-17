import { Tabs, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { ONBOARDING_ROUTES } from '@/constants/routes';
import { CustomTabBar } from '@/components/navigation/CustomTabBar';

export default function TabLayout() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const { hasSeenOnboarding, hasHydrated } = useOnboardingStore();

  useEffect(() => {
    if (!hasHydrated) return;

    if (!hasSeenOnboarding) {
      router.replace(ONBOARDING_ROUTES.step1);
    }
  }, [hasHydrated, hasSeenOnboarding, router]);

  if (!hasHydrated || !hasSeenOnboarding) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarHideOnKeyboard: true,
        headerShown: false,
        sceneStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
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
