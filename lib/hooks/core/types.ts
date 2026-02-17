import type { ApiResponse } from '@/lib/contracts/api';
import { ApiServiceFn as BaseApiServiceFn } from '@/lib/types';

export type QueryKey = readonly unknown[];

/**
 * Base options for resource queries
 */
export interface BaseResourceOptions<TData, TError = Error> {
  /**
   * The query key for React Query
   */
  queryKey: QueryKey;

  /**
   * How long the data is considered fresh (in milliseconds)
   * Must be explicitly provided - use CACHE_TIMES constants from config/cacheTimes
   */
  staleTime: number;

  /**
   * Optional garbage collection time (in milliseconds)
   * Defaults to React Query's default if not provided
   */
  gcTime?: number;

  /**
   * Optional refetch interval (in milliseconds)
   * Use for real-time or frequently updating data
   */
  refetchInterval?: number | false;

  /**
   * Whether the query should be enabled
   * Defaults to true if not provided
   */
  enabled?: boolean;

  /**
   * Custom error message to use when query fails
   * If not provided, uses the error from ApiResponse
   */
  errorMessage?: string;

  /**
   * Reserved for future query extensions
   */
  queryOptions?: Record<string, unknown>;
}

/**
 * Options for single resource detail queries (useResource)
 */
export interface ResourceOptions<TData, TError = Error> extends BaseResourceOptions<TData, TError> {
  /**
   * The service function that fetches the resource
   * Should return a Promise with ApiResponse<TData>
   */
  queryFn: () => Promise<ApiResponse<TData>>;

  /**
   * Default value to return if no data
   * Defaults to null if not provided
   */
  defaultValue?: TData | null;
}

/**
 * Options for list/collection resource queries (useResources)
 */
export interface ResourcesOptions<TData, TError = Error> extends BaseResourceOptions<TData[], TError> {
  /**
   * The service function that fetches the resources
   * Should return a Promise with ApiResponse<TData[]>
   */
  queryFn: () => Promise<ApiResponse<TData[]>>;

  /**
   * Default value to return if no data
   * Defaults to [] (empty array) if not provided
   */
  defaultValue?: TData[];

  /**
   * Optional client-side data transformation/filtering
   * Applied after data is fetched and unwrapped
   */
  select?: (data: TData[]) => TData[];
}

/**
 * Options for conditional queries (useConditionalQuery)
 * Used for search, filtered queries, or queries with complex conditions
 */
export interface ConditionalQueryOptions<TData, TError = Error> extends BaseResourceOptions<TData, TError> {
  /**
   * The service function that fetches the data
   * Should return a Promise with ApiResponse<TData>
   */
  queryFn: () => Promise<ApiResponse<TData>>;

  /**
   * Default value to return if no data
   */
  defaultValue: TData;

  /**
   * Optional client-side data transformation
   * Applied after data is fetched and unwrapped
   */
  select?: (data: TData) => TData;
}

/**
 * Helper type for service functions that return ApiResponse
 */
export type ApiServiceFn<T> = BaseApiServiceFn<T>;

/**
 * Helper type for extracting the data type from an ApiResponse
 */
export type ExtractApiResponseData<T> = T extends ApiResponse<infer U> ? U : never;
