import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { usePostHog } from 'posthog-react-native';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider provides authentication context to the app
 * and handles PostHog user identification
 * Navigation is handled by app/index.tsx to avoid conflicting redirects
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const { session, isAuthenticated } = useAuth();
  const posthog = usePostHog();

  useEffect(() => {
    if (!posthog) return;

    if (isAuthenticated && session?.user) {
      posthog.identify(session.user.id, {
        $set: {
          email: session.user.email,
          name: session.user.name,
        },
      });
    } else {
      posthog.reset();
    }
  }, [isAuthenticated, session, posthog]);

  return <>{children}</>;
}
