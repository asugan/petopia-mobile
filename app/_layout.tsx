import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { MOBILE_QUERY_CONFIG } from "@/lib/config/queryConfig";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { SubscriptionProvider } from "@/providers/SubscriptionProvider";
import { NetworkStatus } from "@/lib/components/NetworkStatus";
import { ApiErrorBoundary } from "@/lib/components/ApiErrorBoundary";
import { useOnlineManager } from "@/lib/hooks/useOnlineManager";
import { AppState, AppStateStatus } from 'react-native';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from '@/lib/theme';
import { useThemeStore } from '@/stores/themeStore';
import "../lib/i18n"; // Initialize i18n

// Enhanced QueryClient with better configuration
const queryClient = new QueryClient(MOBILE_QUERY_CONFIG);

// Custom hook for app state management
function onAppStateChange(status: AppStateStatus) {
  // React Query already handles refetching on app focus by default
  if (status === 'active') {
    focusManager.setFocused(true);
  } else {
    focusManager.setFocused(false);
  }
}

// Enhanced App Providers with better state management
// Theme is now managed by Zustand store (useThemeStore) - no provider needed
function AppProviders({ children }: { children: React.ReactNode }) {
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
  // Handle online/offline state - now has access to QueryClient
  useOnlineManager();

  // Listen to app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  return <>{children}</>;
}

export default function RootLayout() {
  const { theme } = useTheme();
  const { themeMode } = useThemeStore();
  const isDark = themeMode === 'dark';

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
