import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from "expo-router";
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
import { NetworkStatus } from "@/lib/components/NetworkStatus";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { SubscriptionProvider } from "@/providers/SubscriptionProvider";
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import { useEventReminderStore } from '@/stores/eventReminderStore';
import { useUpcomingEvents } from '@/lib/hooks/useEvents';
import { useReminderScheduler } from '@/hooks/useReminderScheduler';
import { createToastConfig } from '@/lib/toast/toastConfig';
import { LAYOUT } from '@/constants';
import "../lib/i18n";

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
          <LanguageProvider>
            <ApiErrorBoundary>
              <AuthProvider>
                <SubscriptionProvider>
                  <SubscriptionGate>{children}</SubscriptionGate>
                </SubscriptionProvider>
              </AuthProvider>
            </ApiErrorBoundary>
          </LanguageProvider>
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
  const { initialize, theme, setAuthenticated, clear } = useUserSettingsStore();
  const quietHours = useEventReminderStore((state) => state.quietHours);
  const quietHoursEnabled = useEventReminderStore((state) => state.quietHoursEnabled);
  const { data: upcomingEvents = [] } = useUpcomingEvents();
  const { scheduleChainForEvent } = useReminderScheduler();
  const TIMEZONE_STORAGE_KEY = 'last-known-timezone';
  const rescheduleSignatureRef = useRef<string | null>(null);

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
      const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const storedTimezone = await AsyncStorage.getItem(TIMEZONE_STORAGE_KEY);
      const timezoneForSignature = deviceTimezone || storedTimezone || 'unknown';

      if (deviceTimezone && storedTimezone !== deviceTimezone) {
        await AsyncStorage.setItem(TIMEZONE_STORAGE_KEY, deviceTimezone);
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

      const nextSignature = `${timezoneForSignature}|${quietKey}|${eventsSignature}`;
      if (rescheduleSignatureRef.current === nextSignature) {
        return;
      }
      rescheduleSignatureRef.current = nextSignature;

      for (const event of upcomingEvents) {
        if (event.reminder) {
          await scheduleChainForEvent(event, event.reminderPreset);
        }
      }
    };

    void rescheduleUpcomingReminders();
  }, [
    isAuthenticated,
    upcomingEvents,
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
      </Stack>
      <Toast
        position="bottom"
        bottomOffset={LAYOUT.TAB_BAR_HEIGHT + 12}
        config={createToastConfig(theme)}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProviders>
          <RootLayoutContent />
        </AppProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
