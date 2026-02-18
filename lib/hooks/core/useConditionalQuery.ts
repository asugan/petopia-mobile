import { ConditionalQueryOptions } from './types';
import { LocalQueryResult, useLocalQuery } from './useLocalAsync';

/**
 * Generic hook for conditional/search queries.
 * Accepts a dependency key list (`deps`) to control reloads.
 *
 * @template TData - The type of the query result data
 * @param options - Configuration options for the local query
 * @returns LocalQueryResult
 */
export function useConditionalQuery<TData>(
  options: ConditionalQueryOptions<TData>
): LocalQueryResult<TData> {
  const {
    deps,
    queryFn,
    refetchInterval,
    enabled = true,
    errorMessage,
    defaultValue,
    select,
  } = options;

  return useLocalQuery<TData>({
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
          : result.error?.message || errorMessage || 'Veri yüklenemedi';
        throw new Error(extractedError);
      }

      // Return data or default value
      const data = (result.data ?? defaultValue) as TData;

      // Apply client-side transformation if provided
      return select ? select(data) : data;
    },
  });
}

/**
 * Variant of useConditionalQuery that returns default value on error instead of throwing
 * Useful when you want graceful degradation
 */
export function useConditionalQuerySafe<TData>(
  options: ConditionalQueryOptions<TData>
): LocalQueryResult<TData> {
  const {
    deps,
    queryFn,
    refetchInterval,
    enabled = true,
    defaultValue,
    select,
  } = options;

  return useLocalQuery<TData>({
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

        // Return data or default value
        const data = (result.data ?? defaultValue) as TData;

        // Apply client-side transformation if provided
        return select ? select(data) : data;
      } catch {
        // Catch any errors and return default value
        return defaultValue;
      }
    },
  });
}
