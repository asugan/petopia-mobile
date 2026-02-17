import { useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { usePostHog } from 'posthog-react-native';
import { createObjectId } from '@/lib/db/utils';

interface AnalyticsIdentityProviderProps {
  children: React.ReactNode;
}

const ANALYTICS_ID_STORAGE_KEY = 'analytics.identity.id';

const getOrCreateAnalyticsId = async (): Promise<string> => {
  const existingId = await SecureStore.getItemAsync(ANALYTICS_ID_STORAGE_KEY);
  if (existingId) {
    return existingId;
  }

  const nextId = `device-${createObjectId()}`;
  await SecureStore.setItemAsync(ANALYTICS_ID_STORAGE_KEY, nextId);
  return nextId;
};

export function AnalyticsIdentityProvider({
  children,
}: AnalyticsIdentityProviderProps) {
  const posthog = usePostHog();

  useEffect(() => {
    let isCancelled = false;

    const identifyDevice = async () => {
      if (!posthog) {
        return;
      }

      try {
        const distinctId = await getOrCreateAnalyticsId();

        if (isCancelled) {
          return;
        }

        posthog.identify(distinctId, {
          $set: {
            identity_type: 'device',
            app_mode: 'local-first',
          },
        });
      } catch {
        // Keep analytics as best-effort only.
      }
    };

    void identifyDevice();

    return () => {
      isCancelled = true;
    };
  }, [posthog]);

  return <>{children}</>;
}
