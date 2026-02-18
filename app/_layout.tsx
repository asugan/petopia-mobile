import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { Stack, useRouter, useSegments } from "expo-router";
import Toast from 'react-native-toast-message';
import { ApiErrorBoundary } from "@/lib/components/ApiErrorBoundary";
import {
  disableLocalNotifications,
  enableLocalNotifications,
  notificationService,
} from '@/lib/services/notificationService';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { useDowngradeStatus } from '@/lib/hooks/useDowngrade';
import { NetworkStatus } from "@/lib/components/NetworkStatus";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { PostHogProviderWrapper } from "@/providers/PostHogProvider";
import { AnalyticsIdentityProvider } from "@/providers/AnalyticsIdentityProvider";
import { SubscriptionProvider } from "@/providers/SubscriptionProvider";
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import { useEventReminderStore } from '@/stores/eventReminderStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useUpcomingEvents } from '@/lib/hooks/useEvents';
import { useActiveFeedingSchedules } from '@/lib/hooks/useFeedingSchedules';
import { useReminderScheduler } from '@/hooks/useReminderScheduler';
import { useBudgetAlertNotifications } from '@/lib/hooks/useUserBudget';
import { createToastConfig } from '@/lib/toast/toastConfig';
import NotificationPermissionPrompt from '@/components/NotificationPermissionPrompt';
import { resolveNotificationSyncAction } from '@/lib/utils/notificationPermissionSync';
import { SUBSCRIPTION_ROUTES, TAB_ROUTES } from '@/constants/routes';
import { LAYOUT } from '@/constants';
import { initDatabase } from '@/lib/db/init';
import "../lib/i18n";
import { AnimatedSplashScreen } from '@/components/SplashScreen/AnimatedSplashScreen';

initDatabase();

function DowngradeGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { isProUser, isLoading: isSubscriptionLoading } = useSubscription();
  const { data: downgradeStatus, isLoading: isDowngradeLoading } = useDowngradeStatus();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (isSubscriptionLoading || isDowngradeLoading) {
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
  }, [isProUser, isSubscriptionLoading, isDowngradeLoading, downgradeStatus, segments, router]);

  return <>{children}</>;
}

function AppProviders({ children }: { children: React.ReactNode }) {
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
    <NetworkStatus>
      <PostHogProviderWrapper>
        <LanguageProvider>
          <ApiErrorBoundary>
            <AnalyticsIdentityProvider>
              <SubscriptionProvider>
                <DowngradeGate>{children}</DowngradeGate>
              </SubscriptionProvider>
            </AnalyticsIdentityProvider>
          </ApiErrorBoundary>
        </LanguageProvider>
      </PostHogProviderWrapper>
    </NetworkStatus>
  );
}

function RootLayoutContent() {
  const router = useRouter();
  const {
    initialize,
    theme,
    settings,
    updateSettings,
    updateBaseCurrency,
    syncDeviceTimezone,
    setNotificationDisabledBySystemPermission,
  } = useUserSettingsStore();
  const {
    hasSeenOnboarding,
    preferredLanguage,
    preferredCurrency,
    preferencesSynced,
    markPreferencesSynced,
  } = useOnboardingStore();
  const quietHours = useEventReminderStore((state) => state.quietHours);
  const quietHoursEnabled = useEventReminderStore((state) => state.quietHoursEnabled);
  const { data: upcomingEvents = [] } = useUpcomingEvents();
  const { data: activeFeedingSchedules = [] } = useActiveFeedingSchedules();
  const { scheduleChainForEvent } = useReminderScheduler();
  useBudgetAlertNotifications();
  const rescheduleSignatureRef = useRef<string | null>(null);
  const preferenceSyncInFlightRef = useRef(false);
  const hasCheckedLaunchNotificationPromptRef = useRef(false);
  const lastKnownNotificationPermissionRef = useRef<boolean | null>(null);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  const syncNotificationState = useCallback(async () => {
    const {
      settings: currentSettings,
      notificationDisabledBySystemPermission: disabledBySystemPermission,
      updateSettings: updateSettingsAction,
      setNotificationDisabledBySystemPermission: setDisabledBySystemPermission,
    } = useUserSettingsStore.getState();

    if (!currentSettings) {
      return false;
    }

    const permissionEnabled = await notificationService.areNotificationsEnabled();
    const previousPermissionEnabled = lastKnownNotificationPermissionRef.current;
    lastKnownNotificationPermissionRef.current = permissionEnabled;
    const notificationsEnabled = currentSettings.notificationsEnabled === true;
    const action = resolveNotificationSyncAction({
      permissionEnabled,
      notificationsEnabled,
      disabledBySystemPermission,
      previousPermissionEnabled,
    });

    if (action === 'disable') {
      setDisabledBySystemPermission(true);
      void disableLocalNotifications();
      await updateSettingsAction({ notificationsEnabled: false });
      return false;
    }

    if (action === 'enable') {
      void enableLocalNotifications();
      await updateSettingsAction({ notificationsEnabled: true });
      setDisabledBySystemPermission(false);
      return true;
    }

    return notificationsEnabled && permissionEnabled;
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (hasCheckedLaunchNotificationPromptRef.current || !hasSeenOnboarding || !settings) {
      return;
    }

    hasCheckedLaunchNotificationPromptRef.current = true;

    const syncAndMaybePrompt = async () => {
      const notificationsActive = await syncNotificationState();

      if (!notificationsActive) {
        setShowNotificationPrompt(true);
      }
    };

    void syncAndMaybePrompt();
  }, [hasSeenOnboarding, settings, syncNotificationState]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void syncDeviceTimezone();
        void syncNotificationState();
        setTimeout(() => {
          void syncNotificationState();
        }, 600);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [syncDeviceTimezone, syncNotificationState]);

  useEffect(() => {
    if (!hasSeenOnboarding || !settings) {
      return;
    }

    if (preferencesSynced || preferenceSyncInFlightRef.current) {
      return;
    }

    const shouldUpdateLanguage =
      !!preferredLanguage && preferredLanguage !== settings.language;
    const shouldUpdateCurrency =
      !!preferredCurrency && preferredCurrency !== settings.baseCurrency;

    if (!shouldUpdateLanguage && !shouldUpdateCurrency) {
      markPreferencesSynced(true);
      return;
    }

    preferenceSyncInFlightRef.current = true;

    const syncPreferences = async () => {
      try {
        if (shouldUpdateLanguage && preferredLanguage) {
          await updateSettings({
            ...(shouldUpdateLanguage && preferredLanguage
              ? { language: preferredLanguage }
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
    hasSeenOnboarding,
    settings,
    preferredLanguage,
    preferredCurrency,
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
    const rescheduleUpcomingReminders = async () => {
      const timezoneForSignature = settings?.timezone ?? 'unknown';

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
    upcomingEvents,
    activeFeedingSchedules,
    scheduleChainForEvent,
    quietHours,
    quietHoursEnabled,
    settings?.timezone,
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
      <NotificationPermissionPrompt
        visible={showNotificationPrompt}
        onDismiss={() => setShowNotificationPrompt(false)}
        onPermissionGranted={async () => {
          void enableLocalNotifications();
          await updateSettings({ notificationsEnabled: true });
          setNotificationDisabledBySystemPermission(false);
          setShowNotificationPrompt(false);
        }}
        onPermissionDenied={async () => {
          setNotificationDisabledBySystemPermission(true);
          void disableLocalNotifications();
          await updateSettings({ notificationsEnabled: false });
        }}
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
