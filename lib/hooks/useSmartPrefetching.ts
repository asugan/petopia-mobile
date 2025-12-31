import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePrefetchData } from './usePrefetchData';
import { eventKeys } from './useEvents';
import { feedingScheduleKeys } from './useFeedingSchedules';
import { unwrapApiResponse } from './core/unwrapApiResponse';
import { toISODateStringWithFallback } from '@/lib/utils/dateConversion';

interface PrefetchStrategy {
  priority: 'high' | 'medium' | 'low';
  timeout: number;
  conditions: string[];
}

export function useSmartPrefetching() {
  const queryClient = useQueryClient();
  const { prefetchRelatedData } = usePrefetchData();

  // Prefetching strategies based on user behavior
  const prefetchStrategies: Record<string, PrefetchStrategy> = {
    // When user spends time on pet list, prefetch details
    petListHover: {
      priority: 'medium',
      timeout: 1000, // 1 second
      conditions: ['user-on-pet-list'],
    },

    // When user opens pet details, prefetch related data
    petDetailsOpen: {
      priority: 'high',
      timeout: 0, // Immediate
      conditions: ['user-on-pet-details'],
    },

    // When user navigates to health tab, prefetch health records
    healthTabFocus: {
      priority: 'high',
      timeout: 0,
      conditions: ['user-on-health-tab'],
    },

    // Background prefetch for frequently accessed data
    backgroundRefresh: {
      priority: 'low',
      timeout: 5000, // 5 seconds
      conditions: ['app-in-background'],
    },
  };

  // Prefetch based on user interaction
  const prefetchOnInteraction = useCallback((
    strategy: keyof typeof prefetchStrategies,
    context: { petId?: string; userId?: string }
  ) => {
    const config = prefetchStrategies[strategy];

    if (!config) return;

    const executePrefetch = () => {
      switch (strategy) {
        case 'petListHover':
          if (context.petId) {
            prefetchRelatedData(context.petId);
          }
          break;

        case 'petDetailsOpen':
          if (context.petId) {
            prefetchRelatedData(context.petId);
            // Prefetch additional data for pet details view
            queryClient.prefetchQuery({
              queryKey: feedingScheduleKeys.list({ petId: context.petId }),
              queryFn: () =>
                unwrapApiResponse(
                  import('@/lib/services/feedingScheduleService').then(m =>
                    m.feedingScheduleService.getFeedingSchedulesByPetId(context.petId!)
                  ),
                  { defaultValue: [] }
                ),
              staleTime: 5 * 60 * 1000,
            });
          }
          break;

        case 'healthTabFocus':
          // Prefetch upcoming events and today's events
          queryClient.prefetchQuery({
            queryKey: eventKeys.upcoming(),
            queryFn: () =>
              unwrapApiResponse(
                import('@/lib/services/eventService').then(m =>
                  m.eventService.getUpcomingEvents()
                ),
                { defaultValue: [] }
              ),
            staleTime: 2 * 60 * 1000,
          });

          queryClient.prefetchQuery({
            queryKey: eventKeys.today(),
            queryFn: () =>
              unwrapApiResponse(
                import('@/lib/services/eventService').then(m =>
                  m.eventService.getTodayEvents()
                ),
                { defaultValue: [] }
              ),
            staleTime: 1 * 60 * 1000,
          });
          break;

        case 'backgroundRefresh':
          // Refresh critical data in background
          queryClient.prefetchQuery({
            queryKey: eventKeys.upcoming(),
            queryFn: () =>
              unwrapApiResponse(
                import('@/lib/services/eventService').then(m =>
                  m.eventService.getUpcomingEvents()
                ),
                { defaultValue: [] }
              ),
            staleTime: 1 * 60 * 1000,
          });

          queryClient.prefetchQuery({
            queryKey: feedingScheduleKeys.active(),
            queryFn: () =>
              unwrapApiResponse(
                import('@/lib/services/feedingScheduleService').then(m =>
                  m.feedingScheduleService.getActiveFeedingSchedules()
                ),
                { defaultValue: [] }
              ),
            staleTime: 1 * 60 * 1000,
          });
          break;
      }
    };

    // Execute immediately or with delay
    if (config.timeout === 0) {
      executePrefetch();
    } else {
      setTimeout(executePrefetch, config.timeout);
    }
  }, [queryClient, prefetchRelatedData]);

  // Prefetch based on user navigation patterns
  const prefetchOnNavigation = useCallback((
    from: string,
    to: string,
    context?: { petId?: string; userId?: string; [key: string]: unknown }
  ) => {
    // Define navigation patterns and their prefetching logic
    const navigationPatterns: Record<string, () => void> = {
      'pets -> pet-details': () => {
        prefetchOnInteraction('petDetailsOpen', { petId: context?.petId });
      },

      'tabs -> health': () => {
        prefetchOnInteraction('healthTabFocus', {});
      },

      'health -> health-record-form': () => {
        // Prefetch vets and clinics if needed
        // This would depend on your specific requirements
      },
    };

    const pattern = `${from} -> ${to}`;
    const prefetchFn = navigationPatterns[pattern];

    if (prefetchFn) {
      prefetchFn();
    }
  }, [prefetchOnInteraction]);

  // Intelligent prefetching based on time of day
  const prefetchBasedOnTime = useCallback(() => {
    const hour = new Date().getHours();

    // Morning: prefetch today's events and feeding schedules
    if (hour >= 6 && hour < 12) {
      queryClient.prefetchQuery({
        queryKey: eventKeys.today(),
        queryFn: () =>
          unwrapApiResponse(
            import('@/lib/services/eventService').then(m =>
              m.eventService.getTodayEvents()
            ),
            { defaultValue: [] }
          ),
        staleTime: 1 * 60 * 1000,
      });

      queryClient.prefetchQuery({
        queryKey: feedingScheduleKeys.today(),
        queryFn: () =>
          unwrapApiResponse(
            import('@/lib/services/feedingScheduleService').then(m =>
              m.feedingScheduleService.getTodayFeedingSchedules()
            ),
            { defaultValue: [] }
          ),
        staleTime: 1 * 60 * 1000,
      });
    }

    // Evening: prefetch tomorrow's events
    if (hour >= 18 && hour < 22) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const tomorrowKey = toISODateStringWithFallback(tomorrow);

      queryClient.prefetchQuery({
        queryKey: eventKeys.calendar(tomorrowKey),
        queryFn: () =>
          unwrapApiResponse(
            import('@/lib/services/eventService').then(m =>
              m.eventService.getEventsByDate(tomorrowKey)
            ),
            { defaultValue: [] }
          ),
        staleTime: 2 * 60 * 1000,
      });
    }
  }, [queryClient]);

  return {
    prefetchOnInteraction,
    prefetchOnNavigation,
    prefetchBasedOnTime,
    prefetchStrategies,
  };
}
