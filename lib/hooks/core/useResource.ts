import { ResourceOptions } from './types';
import { LocalQueryResult, useLocalQuery } from './useLocalAsync';

/**
 * Generic hook for fetching a single resource (detail queries)
 *
 * This hook standardizes the pattern for fetching single resources like:
 * - Pet by ID
 * - Health record by ID
 * - Event by ID
 * - etc.
 *
 * Features:
 * - Automatic ApiResponse unwrapping
 * - Standardized error handling
 * - Type-safe with generics
 * - Supports enabled conditions
 * - Configurable cache times
 *
 * @example
 * ```typescript
 * // Usage in a hook file
 * export function usePet(id: string) {
 *   return useResource<Pet>({
 *     queryKey: petKeys.detail(id),
 *     queryFn: () => petService.getPetById(id),
 *     staleTime: CACHE_TIMES.LONG,
 *     enabled: !!id,
 *     errorMessage: 'Pet yüklenemedi',
 *   });
 * }
 * ```
 *
 * @template TData - The type of the resource data
 * @template TError - The type of error (defaults to Error)
 * @param options - Configuration options for the resource query
 * @returns UseQueryResult from React Query
 */
export function useResource<TData, TError = Error>(
  options: ResourceOptions<TData, TError>
): LocalQueryResult<TData> {
  const {
    queryKey,
    queryFn,
    refetchInterval,
    enabled = true,
    errorMessage,
    defaultValue = null,
  } = options;

  return useLocalQuery<TData>({
    deps: [JSON.stringify(queryKey)],
    refetchInterval,
    enabled,
    defaultValue: defaultValue as TData,
    queryFn: async () => {
      const result = await queryFn();

      // Handle unsuccessful API response
      if (!result.success) {
        const extractedError = typeof result.error === 'string'
          ? result.error
          : result.error?.message || errorMessage || 'Veri yüklenemedi';
        throw new Error(extractedError);
      }

      // Return data or default value
      return (result.data ?? defaultValue) as TData;
    },
  });
}

/**
 * Variant of useResource that returns data or null instead of throwing
 * Useful when you want to handle errors at the component level
 *
 * Note: This variant doesn't support custom queryOptions to avoid type conflicts
 *
 * @example
 * ```typescript
 * export function usePetSafe(id: string) {
 *   return useResourceSafe<Pet>({
 *     queryKey: petKeys.detail(id),
 *     queryFn: () => petService.getPetById(id),
 *     staleTime: CACHE_TIMES.LONG,
 *     enabled: !!id,
 *   });
 * }
 * ```
 */
export function useResourceSafe<TData, TError = Error>(
  options: Omit<ResourceOptions<TData, TError>, 'queryOptions'>
): LocalQueryResult<TData | null> {
  const {
    queryKey,
    queryFn,
    refetchInterval,
    enabled = true,
    defaultValue = null,
  } = options;

  return useLocalQuery<TData | null>({
    deps: [JSON.stringify(queryKey)],
    refetchInterval,
    enabled,
    defaultValue,
    queryFn: async () => {
      try {
        const result = await queryFn();

        // Return data or default value (don't throw)
        if (!result.success) {
          return defaultValue;
        }

        return (result.data ?? defaultValue) as TData;
      } catch {
        // Catch any errors and return default value
        return defaultValue;
      }
    },
  });
}
