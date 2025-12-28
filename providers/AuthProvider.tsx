import { useAuth } from '@/lib/auth';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider provides authentication context to the app
 * Navigation is handled by app/index.tsx to avoid conflicting redirects
 */
export function AuthProvider({ children }: AuthProviderProps) {
  useAuth();

  return <>{children}</>;
}
