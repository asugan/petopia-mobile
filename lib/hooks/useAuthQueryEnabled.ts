import { authClient } from '@/lib/auth/client';

/**
 * Centralized hook for auth-aware query enabled state
 *
 * This hook provides a consistent pattern for enabling/disabling queries
 * based on authentication state. Use this in all server data hooks to prevent
 * unauthorized API requests when the user is not logged in.
 *
 * Usage:
 * ```typescript
 * export function usePets() {
 *   const { enabled, userId } = useAuthQueryEnabled();
 *
 *   return useResources<Pet>({
 *     queryKey: petKeys.all,
 *     queryFn: () => petService.getPets(userId),
 *     enabled,
 *   });
 * }
 * ```
 *
 * Returns:
 * - enabled: true only when user is authenticated and session is loaded
 * - userId: current user ID or undefined
 */
export function useAuthQueryEnabled() {
  const { data: session, isPending } = authClient.useSession();

  const enabled = !isPending && !!session?.user?.id;
  const userId = session?.user?.id;

  return { enabled, userId };
}
