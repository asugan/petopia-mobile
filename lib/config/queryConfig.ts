import { QueryClient, QueryClientConfig } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { QueryFilters } from '../types';

// Cache time constants
export const CACHE_TIMES = {
  IMMUTABLE: 24 * 60 * 60 * 1000, // 24 hours
  LONG: 15 * 60 * 1000, // 15 minutes
  MEDIUM: 5 * 60 * 1000,  // 5 minutes
  SHORT: 2 * 60 * 1000,   // 2 minutes
  VERY_SHORT: 30 * 1000,  // 30 seconds
} as const;

// Retry configurations
export const RETRY_CONFIGS = {
  NETWORK_ERROR: {
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },
  SERVER_ERROR: {
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 15000),
  },
  CLIENT_ERROR: {
    retry: 0,
  },
} as const;

// Query configurations by type
export const QUERY_CONFIGS = {
  pets: {
    staleTime: CACHE_TIMES.MEDIUM,
    gcTime: CACHE_TIMES.LONG,
  },
  petDetails: {
    staleTime: CACHE_TIMES.LONG,
    gcTime: CACHE_TIMES.IMMUTABLE,
  },
  healthRecords: {
    staleTime: CACHE_TIMES.MEDIUM,
    gcTime: CACHE_TIMES.LONG,
  },
  events: {
    staleTime: CACHE_TIMES.SHORT,
    gcTime: CACHE_TIMES.MEDIUM,
  },
  feedingSchedules: {
    staleTime: CACHE_TIMES.VERY_SHORT,
    gcTime: CACHE_TIMES.SHORT,
  },
  realTime: {
    staleTime: CACHE_TIMES.VERY_SHORT,
    refetchInterval: 30 * 1000, // 30 seconds
  },
} as const;

// Mobile-specific query configuration
export const MOBILE_QUERY_CONFIG: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // Mobile app focused settings
      staleTime: CACHE_TIMES.MEDIUM,
      gcTime: CACHE_TIMES.LONG,
      retry: (failureCount, error: Error | AxiosError) => {
        // Type guard for AxiosError
        const isAxiosError = (err: Error | AxiosError): err is AxiosError => {
          return 'response' in err && 'code' in err;
        };

        // Network errors: retry more times
        if (error.message?.includes('network') || (isAxiosError(error) && error.code === 'NETWORK_ERROR')) {
          return failureCount < 3;
        }
        // 5xx server errors: retry fewer times
        if (isAxiosError(error) && error.response?.status && error.response.status >= 500) {
          return failureCount < 2;
        }
        // 4xx client errors: don't retry
        if (isAxiosError(error) && error.response?.status && error.response.status >= 400 && error.response.status < 500) {
          return false;
        }
        // Other errors: retry once
        return failureCount < 1;
      },
      retryDelay: (attemptIndex: number) => {
        // Exponential backoff with jitter for mobile
        const baseDelay = Math.min(1000 * 2 ** attemptIndex, 30000);
        const jitter = Math.random() * 1000; // Add random jitter
        return baseDelay + jitter;
      },
      // Mobile app doesn't typically refocus
      refetchOnWindowFocus: false,
      // Disable automatic refetch on reconnect - handled manually in useOnlineManager
      refetchOnReconnect: false,
      // Network-aware refetching
      networkMode: 'online',
      // Prevent unnecessary re-renders
      structuralSharing: true,
      // Prefetching for better UX
      placeholderData: <T>(previousData: T | undefined) => previousData,
    },
    mutations: {
      retry: 1, // Retry mutations once
      networkMode: 'online', // Only when online
      // Global error handling for mutations
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
};

// Query key factory functions
export const createQueryKeys = (entity: string) => ({
  all: [entity] as const,
  lists: () => [...createQueryKeys(entity).all, 'list'] as const,
  list: (filters?: QueryFilters) => [...createQueryKeys(entity).lists(), filters] as const,
  details: () => [...createQueryKeys(entity).all, 'detail'] as const,
  detail: (id: string) => [...createQueryKeys(entity).details(), id] as const,
  search: (query: string) => [...createQueryKeys(entity).all, 'search', query] as const,
});

// Prefetching strategies
export const PREFETCH_STRATEGIES = {
  // Prefetch related data when viewing details
  onDetailsView: async (queryClient: QueryClient, id: string) => {
    // Prefetch related entities
    await Promise.all([
      // Prefetch related health records, events, etc.
      // Implementation depends on specific entity relationships
    ]);
  },
  // Prefetch data for next navigation
  onNextNavigation: async (queryClient: QueryClient) => {
    // Implementation for intelligent prefetching
  },
} as const;