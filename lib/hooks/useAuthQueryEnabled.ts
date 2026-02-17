const LOCAL_USER_ID = 'local-user';

/**
 * Centralized hook for query enabled state
 *
 * This hook provides a consistent pattern for enabling/disabling queries
 * based on local session state.
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
 * - enabled: always true for local-first mode
 * - userId: fixed local user ID
 */
export function useAuthQueryEnabled() {
  return { enabled: true, userId: LOCAL_USER_ID };
}
