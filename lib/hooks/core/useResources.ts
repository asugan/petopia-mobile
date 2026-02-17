import { ResourcesOptions } from './types';
import { LocalQueryResult, useLocalQuery } from './useLocalAsync';

/**
 * Generic hook for fetching a list/collection of resources
 *
 * This hook standardizes the pattern for fetching resource lists like:
 * - List of pets
 * - List of health records for a pet
 * - List of events
 * - List of feeding schedules
 * - etc.
 *
 * Features:
 * - Automatic ApiResponse unwrapping
 * - Returns empty array by default if no data
 * - Standardized error handling
 * - Type-safe with generics
 * - Supports client-side filtering with select
 * - Configurable cache times
 *
 * @example
 * ```typescript
 * // Basic usage
 * export function usePets() {
 *   return useResources<Pet>({
 *     queryKey: petKeys.all,
 *     queryFn: () => petService.getPets(),
 *     staleTime: CACHE_TIMES.MEDIUM,
 *   });
 * }
 *
 * // With filters
 * export function usePetsByType(type: string) {
 *   return useResources<Pet>({
 *     queryKey: petKeys.list({ type }),
 *     queryFn: () => petService.getPetsByType(type),
 *     staleTime: CACHE_TIMES.MEDIUM,
 *     enabled: !!type,
 *   });
 * }
 *
 * // With client-side filtering
 * export function useActivePets() {
 *   return useResources<Pet>({
 *     queryKey: petKeys.all,
 *     queryFn: () => petService.getPets(),
 *     staleTime: CACHE_TIMES.MEDIUM,
 *     select: (pets) => pets.filter(p => p.isActive),
 *   });
 * }
 * ```
 *
 * @template TData - The type of items in the collection
 * @template TError - The type of error (defaults to Error)
 * @param options - Configuration options for the resources query
 * @returns UseQueryResult from React Query
 */
export function useResources<TData, TError = Error>(
  options: ResourcesOptions<TData, TError>
): LocalQueryResult<TData[]> {
  const {
    queryKey,
    queryFn,
    refetchInterval,
    enabled = true,
    errorMessage,
    defaultValue = [],
    select,
  } = options;

  return useLocalQuery<TData[]>({
    deps: [JSON.stringify(queryKey)],
    refetchInterval,
    enabled,
    defaultValue,
    queryFn: async () => {
      const result = await queryFn();

      // Handle unsuccessful API response
      if (!result.success) {
        const extractedError = typeof result.error === 'string'
          ? result.error
          : result.error?.message || errorMessage || 'Veriler yüklenemedi';
        throw new Error(extractedError);
      }

      // Return data or default empty array
      const data = (result.data ?? defaultValue) as TData[];

      // Apply client-side transformation if provided
      return select ? select(data) : data;
    },
  });
}

/**
 * Variant of useResources that returns empty array on error instead of throwing
 * Useful when you want to show an empty state instead of error state
 *
 * Note: This variant doesn't support custom queryOptions to avoid type conflicts
 *
 * @example
 * ```typescript
 * export function usePetsSafe() {
 *   return useResourcesSafe<Pet>({
 *     queryKey: petKeys.all,
 *     queryFn: () => petService.getPets(),
 *     staleTime: CACHE_TIMES.MEDIUM,
 *   });
 * }
 * ```
 */
export function useResourcesSafe<TData, TError = Error>(
  options: Omit<ResourcesOptions<TData, TError>, 'queryOptions'>
): LocalQueryResult<TData[]> {
  const {
    queryKey,
    queryFn,
    refetchInterval,
    enabled = true,
    defaultValue = [],
    select,
  } = options;

  return useLocalQuery<TData[]>({
    deps: [JSON.stringify(queryKey)],
    refetchInterval,
    enabled,
    defaultValue,
    queryFn: async () => {
      try {
        const result = await queryFn();

        // Return default on unsuccessful response (don't throw)
        if (!result.success) {
          return defaultValue;
        }

        // Return data or default empty array
        const data = (result.data ?? defaultValue) as TData[];

        // Apply client-side transformation if provided
        return select ? select(data) : data;
      } catch {
        // Catch any errors and return default value
        return defaultValue;
      }
    },
  });
}
