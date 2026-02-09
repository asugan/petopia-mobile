import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { ApiErrorBoundary } from "@/lib/components/ApiErrorBoundary";
import { MOBILE_QUERY_CONFIG } from "@/lib/config/queryConfig";
import { useAuth } from '@/lib/auth';
import { setOnUnauthorized, setOnProRequired } from '@/lib/api/client';
import { notificationService } from '@/lib/services/notificationService';
import { useOnlineManager } from "@/lib/hooks/useOnlineManager";
import { useSubscription } from '@/lib/hooks/useSubscription';
import { useDowngradeStatus } from '@/lib/hooks/useDowngrade';
import { NetworkStatus } from "@/lib/components/NetworkStatus";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { PostHogProviderWrapper } from "@/providers/PostHogProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { SubscriptionProvider } from "@/providers/SubscriptionProvider";
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import { useEventReminderStore } from '@/stores/eventReminderStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useUpcomingEvents } from '@/lib/hooks/useEvents';
import { useActiveFeedingSchedules } from '@/lib/hooks/useFeedingSchedules';
import { useReminderScheduler } from '@/hooks/useReminderScheduler';
import { createToastConfig } from '@/lib/toast/toastConfig';
import { SUBSCRIPTION_ROUTES, TAB_ROUTES } from '@/constants/routes';
import { LAYOUT } from '@/constants';
import { detectDeviceTimezone } from '@/lib/utils/timezone';
import "../lib/i18n";
import { AnimatedSplashScreen } from '@/components/SplashScreen/AnimatedSplashScreen';

// Enhanced QueryClient with better configuration
const queryClient = new QueryClient(MOBILE_QUERY_CONFIG);

// Custom hook for app state management
function onAppStateChange(status: AppStateStatus) {
  if (status === 'active') {
    focusManager.setFocused(true);
  } else {
    focusManager.setFocused(false);
  }
}

// Enhanced App Providers with better state management
function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { presentPaywall } = useSubscription();

  useEffect(() => {
    setOnProRequired(() => {
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'subscription' });
      void presentPaywall();
    });
  }, [presentPaywall]);

  return <>{children}</>;
}

function DowngradeGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated } = useAuth();
  const { isProUser, isLoading: isSubscriptionLoading } = useSubscription();
  const { data: downgradeStatus, isLoading: isDowngradeLoading } = useDowngradeStatus();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // Only check downgrade when user is authenticated, not pro, and data is loaded
    if (!isAuthenticated || isSubscriptionLoading || isDowngradeLoading) {
      return;
    }

    // If user is pro, no need to check downgrade
    if (isProUser) {
      hasRedirectedRef.current = false;
      return;
    }

    const isOnDowngradePage = segments.includes('downgrade' as never);
    const requiresDowngrade = downgradeStatus?.requiresDowngrade ?? false;

    if (requiresDowngrade && !isOnDowngradePage && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      router.replace(SUBSCRIPTION_ROUTES.downgrade);
    } else if (!requiresDowngrade && isOnDowngradePage) {
      hasRedirectedRef.current = false;
      router.replace(TAB_ROUTES.home);
    }
  }, [isAuthenticated, isProUser, isSubscriptionLoading, isDowngradeLoading, downgradeStatus, segments, router]);

  return <>{children}</>;
}

function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    setOnUnauthorized(() => {
      queryClient.clear();
    });
  }, []);



  useEffect(() => {
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => notificationService.handleNotificationReceived(notification)
    );
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => notificationService.handleNotificationResponse(response)
    );

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <OnlineManagerProvider>
        <NetworkStatus>
          <PostHogProviderWrapper>
            <LanguageProvider>
              <ApiErrorBoundary>
                <AuthProvider>
                  <SubscriptionProvider>
                    <SubscriptionGate>
                      <DowngradeGate>{children}</DowngradeGate>
                    </SubscriptionGate>
                  </SubscriptionProvider>
                </AuthProvider>
              </ApiErrorBoundary>
            </LanguageProvider>
          </PostHogProviderWrapper>
        </NetworkStatus>
      </OnlineManagerProvider>
    </QueryClientProvider>
  );
}


// Separate component for online management to ensure QueryClient context is available
function OnlineManagerProvider({ children }: { children: React.ReactNode }) {
  useOnlineManager();

  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  return <>{children}</>;
}

function RootLayoutContent() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const {
    initialize,
    theme,
    setAuthenticated,
    clear,
    settings,
    updateSettings,
    updateBaseCurrency,
  } = useUserSettingsStore();
  const {
    hasSeenOnboarding,
    preferredLanguage,
    preferredCurrency,
    preferredTimezone,
    preferencesSynced,
    markPreferencesSynced,
  } = useOnboardingStore();
  const quietHours = useEventReminderStore((state) => state.quietHours);
  const quietHoursEnabled = useEventReminderStore((state) => state.quietHoursEnabled);
  const { data: upcomingEvents = [] } = useUpcomingEvents();
  const { data: activeFeedingSchedules = [] } = useActiveFeedingSchedules();
  const { scheduleChainForEvent } = useReminderScheduler();
  const TIMEZONE_STORAGE_KEY = 'last-known-timezone';
  const rescheduleSignatureRef = useRef<string | null>(null);
  const preferenceSyncInFlightRef = useRef(false);

  useEffect(() => {
    setAuthenticated(isAuthenticated);
  }, [isAuthenticated, setAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      initialize();
    } else {
      clear();
    }
  }, [isAuthenticated, initialize, clear]);

  useEffect(() => {
    if (!isAuthenticated || !hasSeenOnboarding || !settings) {
      return;
    }

    if (preferencesSynced || preferenceSyncInFlightRef.current) {
      return;
    }

    const shouldUpdateLanguage =
      !!preferredLanguage && preferredLanguage !== settings.language;
    const shouldUpdateCurrency =
      !!preferredCurrency && preferredCurrency !== settings.baseCurrency;
    const shouldUpdateTimezone =
      !!preferredTimezone && preferredTimezone !== settings.timezone;

    if (!shouldUpdateLanguage && !shouldUpdateCurrency && !shouldUpdateTimezone) {
      markPreferencesSynced(true);
      return;
    }

    preferenceSyncInFlightRef.current = true;

    const syncPreferences = async () => {
      try {
        if ((shouldUpdateLanguage && preferredLanguage) || (shouldUpdateTimezone && preferredTimezone)) {
          await updateSettings({
            ...(shouldUpdateLanguage && preferredLanguage
              ? { language: preferredLanguage }
              : {}),
            ...(shouldUpdateTimezone && preferredTimezone
              ? { timezone: preferredTimezone }
              : {}),
          });
        }

        if (shouldUpdateCurrency && preferredCurrency) {
          await updateBaseCurrency(preferredCurrency);
        }

        markPreferencesSynced(true);
      } catch {
      } finally {
        preferenceSyncInFlightRef.current = false;
      }
    };

    void syncPreferences();
  }, [
    isAuthenticated,
    hasSeenOnboarding,
    settings,
    preferredLanguage,
    preferredCurrency,
    preferredTimezone,
    preferencesSynced,
    markPreferencesSynced,
    updateSettings,
    updateBaseCurrency,
  ]);

  useEffect(() => {
    notificationService.setQuietHours(quietHours);
  }, [quietHours]);

  useEffect(() => {
    notificationService.setNavigationHandler((target) => {
      router.push(target);
    });

    const checkLastNotification = async () => {
      const response = await Notifications.getLastNotificationResponseAsync();
      if (response) {
        notificationService.handleNotificationResponse(response);
      }
    };

    void checkLastNotification();
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const rescheduleUpcomingReminders = async () => {
      const safeDeviceTimezone = detectDeviceTimezone();
      const storedTimezone = await AsyncStorage.getItem(TIMEZONE_STORAGE_KEY);
      const timezoneForSignature = safeDeviceTimezone || storedTimezone || 'unknown';

      if (safeDeviceTimezone && storedTimezone !== safeDeviceTimezone) {
        await AsyncStorage.setItem(TIMEZONE_STORAGE_KEY, safeDeviceTimezone);
      }

      const quietKey = [
        quietHoursEnabled,
        quietHours.startHour,
        quietHours.startMinute,
        quietHours.endHour,
        quietHours.endMinute,
      ].join(':');

      const eventsSignature = upcomingEvents
        .filter((event) => event.reminder)
        .map((event) =>
          [
            event._id,
            event.updatedAt,
            event.startTime,
            event.reminderPreset ?? 'standard',
            event.reminder ? 1 : 0,
          ].join(':')
        )
        .sort()
        .join('|');

      const feedingSignature = activeFeedingSchedules
        .map((schedule) =>
          [
            schedule._id,
            schedule.time,
            schedule.days,
            schedule.reminderMinutesBefore ?? 15,
            schedule.isActive ? 1 : 0,
          ].join(':')
        )
        .sort()
        .join('|');

      const nextSignature = `${timezoneForSignature}|${quietKey}|${eventsSignature}|${feedingSignature}`;
      if (rescheduleSignatureRef.current === nextSignature) {
        return;
      }
      rescheduleSignatureRef.current = nextSignature;

      const deliveryChannel = await notificationService.getNotificationDeliveryChannel();
      if (deliveryChannel === 'backend') {
        await notificationService.cancelEventAndFeedingNotifications();
        return;
      }

      for (const event of upcomingEvents) {
        if (event.reminder) {
          await scheduleChainForEvent(event, event.reminderPreset);
        }
      }

      for (const schedule of activeFeedingSchedules) {
        await notificationService.syncFeedingReminderForSchedule(schedule, {
          deliveryChannel: 'local',
        });
      }
    };

    void rescheduleUpcomingReminders();
  }, [
    isAuthenticated,
    upcomingEvents,
    activeFeedingSchedules,
    scheduleChainForEvent,
    quietHours,
    quietHoursEnabled,
  ]);

  const isDark = theme.mode === 'dark';

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="subscription"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="downgrade"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            gestureEnabled: false,
          }}
        />
      </Stack>
      <Toast
        position="bottom"
        bottomOffset={LAYOUT.TAB_BAR_HEIGHT + 12}
        config={createToastConfig(theme)}
      />
    </>
  );
}

// Prevent splash screen from auto-hiding before font loading
SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AnimatedSplashScreen>
          <AppProviders>
            <RootLayoutContent />
          </AppProviders>
        </AnimatedSplashScreen>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
