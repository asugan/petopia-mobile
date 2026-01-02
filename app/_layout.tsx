import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from "expo-router";
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { ApiErrorBoundary } from "@/lib/components/ApiErrorBoundary";
import { MOBILE_QUERY_CONFIG } from "@/lib/config/queryConfig";
import { useAuth } from '@/lib/auth';
import { setOnUnauthorized } from '@/lib/api/client';
import { notificationService } from '@/lib/services/notificationService';
import { useOnlineManager } from "@/lib/hooks/useOnlineManager";
import { NetworkStatus } from "@/lib/components/NetworkStatus";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { SubscriptionProvider } from "@/providers/SubscriptionProvider";
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import { useEventReminderStore } from '@/stores/eventReminderStore';
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
                  {children}
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

export default function RootLayout() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { initialize, theme, setAuthenticated, clear } = useUserSettingsStore();
  const quietHours = useEventReminderStore((state) => state.quietHours);

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
      router.push(target as any);
    });

    const checkLastNotification = async () => {
      const response = await Notifications.getLastNotificationResponseAsync();
      if (response) {
        notificationService.handleNotificationResponse(response);
      }
    };

    void checkLastNotification();
  }, [router]);

  const isDark = theme.mode === 'dark';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <AppProviders>
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
        </AppProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
