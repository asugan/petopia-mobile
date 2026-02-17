import { useEffect } from 'react';
import { usePostHog } from 'posthog-react-native';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Local-first provider for analytics identification.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const posthog = usePostHog();

  useEffect(() => {
    if (!posthog) return;

    posthog.identify('local-user', {
      $set: {
        email: 'local@petopia.app',
        name: 'Petopia User',
      },
    });
  }, [posthog]);

  return <>{children}</>;
}
