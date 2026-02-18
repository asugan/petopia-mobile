import { ResourcesOptions } from './types';
import { LocalQueryResult, useLocalQuery } from './useLocalAsync';

/**
 * Generic hook for fetching a list/collection of resources.
 * Accepts a dependency key list (`deps`) to control reloads.
 *
 * @template TData - The type of items in the collection
 * @param options - Configuration options for the local query
 * @returns LocalQueryResult
 */
export function useResources<TData>(
  options: ResourcesOptions<TData>
): LocalQueryResult<TData[]> {
  const {
    deps,
    queryFn,
    refetchInterval,
    enabled = true,
    errorMessage,
    defaultValue = [],
    select,
  } = options;

  return useLocalQuery<TData[]>({
    deps,
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
 */
export function useResourcesSafe<TData>(
  options: ResourcesOptions<TData>
): LocalQueryResult<TData[]> {
  const {
    deps,
    queryFn,
    refetchInterval,
    enabled = true,
    defaultValue = [],
    select,
  } = options;

  return useLocalQuery<TData[]>({
    deps,
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
