import { useEffect } from 'react';
import { PostHogProvider, usePostHog } from 'posthog-react-native';
import { usePublicConfig } from '@/lib/hooks/usePublicConfig';

interface PostHogProviderWrapperProps {
  children: React.ReactNode;
}

function PostHogDebug() {
  const posthog = usePostHog();

  useEffect(() => {
    posthog.debug(__DEV__);
  }, [posthog]);

  return null;
}

function PostHogContent({ children }: { children: React.ReactNode }) {
  const { data: config, isLoading, error } = usePublicConfig();

  if (isLoading) {
    return children;
  }

  if (error || !config?.posthog?.apiKey) {
    return children;
  }

  return (
    <PostHogProvider
      apiKey={config.posthog.apiKey}
      options={{
        host: config.posthog.host,
        captureAppLifecycleEvents: true,
        flushAt: 20,
        enableSessionReplay: true,
        sessionReplayConfig: {
          maskAllTextInputs: true,
          maskAllImages: false,
        },
        errorTracking: {
          autocapture: {
            uncaughtExceptions: true,
            unhandledRejections: true,
            console: ['error', 'warn'],
          },
        },
      }}
      autocapture={{
        captureTouches: true,
        captureScreens: true,
      }}
    >
      <PostHogDebug />
      {children}
    </PostHogProvider>
  );
}

export function PostHogProviderWrapper({ children }: PostHogProviderWrapperProps) {
  return <PostHogContent>{children}</PostHogContent>;
}
