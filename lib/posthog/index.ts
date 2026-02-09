import { usePostHog, useFeatureFlag } from 'posthog-react-native';
import { useEffect, useCallback, useState } from 'react';

export { useFeatureFlag };

/**
 * PostHog event properties type
 */
type PostHogEventProperties = Record<string, string | number | boolean | null>;

/**
 * Track a custom event to PostHog
 */
export function useTracking() {
  const posthog = usePostHog();

  const trackEvent = useCallback(
    (eventName: string, properties?: PostHogEventProperties) => {
      posthog?.capture(eventName, properties);
    },
    [posthog]
  );

  const trackScreen = useCallback(
    (screenName: string, properties?: PostHogEventProperties) => {
      posthog?.capture('$screen', {
        $screen_name: screenName,
        ...properties,
      });
    },
    [posthog]
  );

  return {
    trackEvent,
    trackScreen,
  };
}

/**
 * Hook to track screen views on mount
 */
export function useScreenTracking(screenName: string) {
  const { trackScreen } = useTracking();

  useEffect(() => {
    trackScreen(screenName);
  }, [screenName, trackScreen]);
}

/**
 * Hook to get feature flag with payload
 */
export function useFeatureFlagWithPayload<T = unknown>(flagKey: string) {
  const [payload, setPayload] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const posthog = usePostHog();

  useEffect(() => {
    const fetchFlag = async () => {
      setIsLoading(true);
      await posthog.getFeatureFlag(flagKey);
      const flagPayload = await posthog.getFeatureFlagPayload(flagKey);
      setPayload(flagPayload as T | null);
      setIsLoading(false);
    };

    fetchFlag();
  }, [flagKey, posthog]);

  return { payload, isLoading };
}
