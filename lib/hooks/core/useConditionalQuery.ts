import { ConditionalQueryOptions } from './types';
import { LocalQueryResult, useLocalQuery } from './useLocalAsync';

/**
 * Generic hook for conditional/search queries
 *
 * This hook standardizes the pattern for queries that:
 * - Depend on multiple conditions
 * - Are search queries
 * - Have complex enabled logic
 * - Return mixed data types (not just arrays or single items)
 *
 * Features:
 * - Automatic ApiResponse unwrapping
 * - Flexible data types (arrays, objects, primitives)
 * - Standardized error handling
 * - Type-safe with generics
 * - Supports client-side transformation
 * - Required default value for type safety
 *
 * @example
 * ```typescript
 * // Search query
 * export function usePetSearch(query: string) {
 *   return useConditionalQuery<Pet[]>({
 *     queryKey: petKeys.search(query),
 *     queryFn: () => petService.searchPets(query),
 *     staleTime: CACHE_TIMES.SHORT,
 *     enabled: !!query && query.trim().length > 0,
 *     defaultValue: [],
 *   });
 * }
 *
 * // Stats/aggregation query
 * export function usePetStats(petId: string) {
 *   return useConditionalQuery<{ total: number; active: number }>({
 *     queryKey: ['pet-stats', petId],
 *     queryFn: () => petService.getPetStats(petId),
 *     staleTime: CACHE_TIMES.MEDIUM,
 *     enabled: !!petId,
 *     defaultValue: { total: 0, active: 0 },
 *   });
 * }
 *
 * // Multi-condition query
 * export function useFilteredEvents(petId: string, type: string) {
 *   return useConditionalQuery<Event[]>({
 *     queryKey: ['events', petId, type],
 *     queryFn: () => eventService.getEvents(petId, type),
 *     staleTime: CACHE_TIMES.SHORT,
 *     enabled: !!petId && !!type,
 *     defaultValue: [],
 *   });
 * }
 *
 * // With transformation
 * export function useExpenseSummary(petId: string) {
 *   return useConditionalQuery<ExpenseStats>({
 *     queryKey: ['expense-summary', petId],
 *     queryFn: () => expenseService.getExpenseStats(petId),
 *     staleTime: CACHE_TIMES.MEDIUM,
 *     enabled: !!petId,
 *     defaultValue: { total: 0, count: 0 },
 *     select: (data) => ({
 *       ...data,
 *       average: data.count > 0 ? data.total / data.count : 0,
 *     }),
 *   });
 * }
 * ```
 *
 * @template TData - The type of the query result data
 * @template TError - The type of error (defaults to Error)
 * @param options - Configuration options for the conditional query
 * @returns UseQueryResult from React Query
 */
export function useConditionalQuery<TData, TError = Error>(
  options: ConditionalQueryOptions<TData, TError>
): LocalQueryResult<TData> {
  const {
    queryKey,
    queryFn,
    refetchInterval,
    enabled = true,
    errorMessage,
    defaultValue,
    select,
  } = options;

  return useLocalQuery<TData>({
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
 *
 * Note: This variant doesn't support custom queryOptions to avoid type conflicts
 *
 * @example
 * ```typescript
 * export function usePetStatsSafe(petId: string) {
 *   return useConditionalQuerySafe<PetStats>({
 *     queryKey: ['pet-stats', petId],
 *     queryFn: () => petService.getPetStats(petId),
 *     staleTime: CACHE_TIMES.MEDIUM,
 *     enabled: !!petId,
 *     defaultValue: { total: 0, active: 0 },
 *   });
 * }
 * ```
 */
export function useConditionalQuerySafe<TData, TError = Error>(
  options: Omit<ConditionalQueryOptions<TData, TError>, 'queryOptions'>
): LocalQueryResult<TData> {
  const {
    queryKey,
    queryFn,
    refetchInterval,
    enabled = true,
    defaultValue,
    select,
  } = options;

  return useLocalQuery<TData>({
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
