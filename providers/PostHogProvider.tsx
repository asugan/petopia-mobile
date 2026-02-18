import { PostHogProvider } from 'posthog-react-native';
import { PUBLIC_CONFIG } from '@/lib/config/publicConfig';

interface PostHogProviderWrapperProps {
  children: React.ReactNode;
}

function PostHogContent({ children }: { children: React.ReactNode }) {
  if (!PUBLIC_CONFIG.posthog.apiKey) {
    return children;
  }

  return (
    <PostHogProvider
      apiKey={PUBLIC_CONFIG.posthog.apiKey}
      options={{
        host: PUBLIC_CONFIG.posthog.host,
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
      {children}
    </PostHogProvider>
  );
}

export function PostHogProviderWrapper({ children }: PostHogProviderWrapperProps) {
  return <PostHogContent>{children}</PostHogContent>;
}
