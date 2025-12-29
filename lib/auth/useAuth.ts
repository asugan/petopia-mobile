import { authClient, type Session, type User } from './client';

/**
 * Re-export useSession from authClient for direct access
 */
export const useSession = authClient.useSession;

/**
 * Custom hook that provides authentication functionality
 * including sign in, sign up, sign out, and session data
 *
 * Mirrors the web PawTrack useAuth pattern for consistency
 */
export function useAuth() {
  const { data: session, isPending, error, refetch } = authClient.useSession();

  /**
   * Sign in methods for different providers
   */
  const signIn = {
    /**
     * Sign in with email and password
     */
    email: async (email: string, password: string) => {
      return authClient.signIn.email({
        email,
        password,
      });
    },

    /**
     * Sign in with Google OAuth
     * @param callbackURL - Optional URL to redirect to after authentication
     */
    google: async (callbackURL?: string) => {
      return authClient.signIn.social({
        provider: 'google',
        callbackURL,
      });
    },

    /**
     * Sign in with Apple OAuth
     * @param callbackURL - Optional URL to redirect to after authentication
     */
    apple: async (callbackURL?: string) => {
      return authClient.signIn.social({
        provider: 'apple',
        callbackURL,
      });
    },

    facebook: async (callbackURL?: string) => {
      return authClient.signIn.social({
        provider: 'facebook',
        callbackURL,
      });
    },
  };

  /**
   * Sign up with email and password
   */
  const signUp = async (email: string, password: string, name: string) => {
    return authClient.signUp.email({
      email,
      password,
      name,
    });
  };

  /**
   * Sign out the current user
   */
  const signOut = async () => {
    return authClient.signOut();
  };

  /**
   * Get the current session cookie for API requests
   */
  const getCookie = () => {
    return authClient.getCookie();
  };

  return {
    // Session data
    session,
    user: session?.user ?? null,
    isAuthenticated: !!session?.user,
    isPending,
    error,
    refetch,

    // Auth methods
    signIn,
    signUp,
    signOut,
    getCookie,
  };
}
