import { useCallback, useMemo } from 'react';
import { usePrefetchData } from './usePrefetchData';
import { unwrapApiResponse } from './core/unwrapApiResponse';
import { toLocalDateKey } from '@/lib/utils/timezoneDate';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';
import { useUserTimezone } from './useUserTimezone';
import { feedingScheduleService } from '@/lib/services/feedingScheduleService';
import { eventService } from '@/lib/services/eventService';

interface PrefetchStrategy {
  priority: 'high' | 'medium' | 'low';
  timeout: number;
  conditions: string[];
}

export function useSmartPrefetching() {
  const {
    prefetchRelatedData,
    prefetchUpcomingEvents = () => {},
    prefetchTodayEvents = () => {},
  } = usePrefetchData();
  const { enabled } = useAuthQueryEnabled();
  const timezone = useUserTimezone();

  const runPrefetch = (callback: () => Promise<unknown>) => {
    if (!enabled) return;
    void callback();
  };

  const prefetchStrategies = useMemo<Record<string, PrefetchStrategy>>(() => ({
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
  }), []);

  // Prefetch based on user interaction
  const prefetchOnInteraction = useCallback((
    strategy: keyof typeof prefetchStrategies,
    context: { petId?: string; userId?: string }
  ) => {
    if (!enabled) return;

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
            runPrefetch(() =>
              unwrapApiResponse(
                feedingScheduleService.getFeedingSchedulesByPetId(context.petId!),
                { defaultValue: [] }
              )
            );
          }
          break;

        case 'healthTabFocus':
          prefetchUpcomingEvents();
          prefetchTodayEvents();
          break;

        case 'backgroundRefresh':
          // Refresh critical data in background
          runPrefetch(() =>
            unwrapApiResponse(eventService.getUpcomingEvents(timezone), {
              defaultValue: [],
            })
          );

          runPrefetch(() =>
            unwrapApiResponse(feedingScheduleService.getActiveFeedingSchedules(), {
              defaultValue: [],
            })
          );
          break;
      }
    };

    // Execute immediately or with delay
    if (config.timeout === 0) {
      executePrefetch();
    } else {
      setTimeout(executePrefetch, config.timeout);
    }
  }, [
    enabled,
    prefetchRelatedData,
    prefetchStrategies,
    prefetchTodayEvents,
    prefetchUpcomingEvents,
    runPrefetch,
    timezone,
  ]);

  // Prefetch based on user navigation patterns
  const prefetchOnNavigation = useCallback((
    from: string,
    to: string,
    context?: { petId?: string; userId?: string; [key: string]: unknown }
  ) => {
    if (!enabled) return;

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
  }, [enabled, prefetchOnInteraction]);

  // Intelligent prefetching based on time of day
  const prefetchBasedOnTime = useCallback(() => {
    if (!enabled) return;

    const hour = new Date().getHours();

    // Morning: prefetch today's events and feeding schedules
    if (hour >= 6 && hour < 12) {
      prefetchTodayEvents();

      runPrefetch(() =>
        unwrapApiResponse(feedingScheduleService.getTodayFeedingSchedules(), {
          defaultValue: [],
        })
      );
    }

    // Evening: prefetch tomorrow's events
    if (hour >= 18 && hour < 22) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const tomorrowKey = toLocalDateKey(tomorrow, timezone);

      runPrefetch(() =>
        unwrapApiResponse(eventService.getEventsByDate(tomorrowKey, timezone), {
          defaultValue: [],
        })
      );
    }
  }, [enabled, prefetchTodayEvents, runPrefetch, timezone]);

  return {
    prefetchOnInteraction,
    prefetchOnNavigation,
    prefetchBasedOnTime,
    prefetchStrategies,
  };
}
