import { ResourceOptions } from './types';
import { LocalQueryResult, useLocalQuery } from './useLocalAsync';

/**
 * Generic hook for fetching a single resource.
 * Accepts a dependency key list (`deps`) to control reloads.
 *
 * @template TData - The type of the resource data
 * @param options - Configuration options for the local query
 * @returns LocalQueryResult
 */
export function useResource<TData>(
  options: ResourceOptions<TData>
): LocalQueryResult<TData> {
  const {
    deps,
    queryFn,
    refetchInterval,
    enabled = true,
    errorMessage,
    defaultValue = null,
  } = options;

  return useLocalQuery<TData>({
    deps,
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
 */
export function useResourceSafe<TData>(
  options: ResourceOptions<TData>
): LocalQueryResult<TData | null> {
  const {
    deps,
    queryFn,
    refetchInterval,
    enabled = true,
    defaultValue = null,
  } = options;

  return useLocalQuery<TData | null>({
    deps,
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
