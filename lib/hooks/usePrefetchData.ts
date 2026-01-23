import { useQueryClient } from '@tanstack/react-query';
import { eventKeys, feedingScheduleKeys, healthRecordKeys, petKeys } from './queryKeys';
import { unwrapApiResponse } from './core/unwrapApiResponse';
import { toISODateStringWithFallback } from '@/lib/utils/dateConversion';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';

export function usePrefetchData() {
  const queryClient = useQueryClient();
  const { enabled } = useAuthQueryEnabled();

  const prefetchPetDetails = (petId: string) => {
    if (!enabled) return;

    queryClient.prefetchQuery({
      queryKey: petKeys.detail(petId),
      queryFn: () =>
        unwrapApiResponse(
          import('@/lib/services/petService').then(m => m.petService.getPetById(petId))
        ),
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  };

  const prefetchPetHealthRecords = (petId: string) => {
    if (!enabled) return;

    queryClient.prefetchQuery({
      queryKey: healthRecordKeys.list(petId),
      queryFn: () =>
        unwrapApiResponse(
          import('@/lib/services/healthRecordService').then(m =>
            m.healthRecordService.getHealthRecordsByPetId(petId)
          ),
          { defaultValue: [] }
        ),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  const prefetchPetEvents = (petId: string) => {
    if (!enabled) return;

    queryClient.prefetchQuery({
      queryKey: eventKeys.list({ petId }),
      queryFn: () =>
        unwrapApiResponse(
          import('@/lib/services/eventService').then(m =>
            m.eventService.getEventsByPetId(petId)
          ),
          { defaultValue: [] }
        ),
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  };

  const prefetchPetFeedingSchedules = (petId: string) => {
    if (!enabled) return;

    queryClient.prefetchQuery({
      queryKey: feedingScheduleKeys.list({ petId }),
      queryFn: () =>
        unwrapApiResponse(
          import('@/lib/services/feedingScheduleService').then(m =>
            m.feedingScheduleService.getFeedingSchedulesByPetId(petId)
          ),
          { defaultValue: [] }
        ),
      staleTime: 1 * 60 * 1000, // 1 minute
    });
  };

  const prefetchRelatedData = (petId: string) => {
    prefetchPetDetails(petId);
    prefetchPetHealthRecords(petId);
    prefetchPetEvents(petId);
    prefetchPetFeedingSchedules(petId);
  };

  const prefetchUpcomingEvents = () => {
    if (!enabled) return;

    queryClient.prefetchQuery({
      queryKey: eventKeys.upcoming(),
      queryFn: () =>
        unwrapApiResponse(
          import('@/lib/services/eventService').then(m =>
            m.eventService.getUpcomingEvents()
          ),
          { defaultValue: [] }
        ),
      staleTime: 1 * 60 * 1000, // 1 minute
    });
  };

  const prefetchTodayEvents = () => {
    if (!enabled) return;

    queryClient.prefetchQuery({
      queryKey: eventKeys.today(),
      queryFn: () =>
        unwrapApiResponse(
          import('@/lib/services/eventService').then(m => m.eventService.getTodayEvents()),
          { defaultValue: [] }
        ),
      staleTime: 30 * 1000, // 30 seconds
    });
  };

  const prefetchActiveFeedingSchedules = () => {
    if (!enabled) return;

    queryClient.prefetchQuery({
      queryKey: feedingScheduleKeys.active(),
      queryFn: () =>
        unwrapApiResponse(
          import('@/lib/services/feedingScheduleService').then(m =>
            m.feedingScheduleService.getActiveFeedingSchedules()
          ),
          { defaultValue: [] }
        ),
      staleTime: 30 * 1000, // 30 seconds
    });
  };

  // Smart prefetching based on user context
  const prefetchForPetDetailsView = (petId: string) => {
    prefetchRelatedData(petId);
    prefetchUpcomingEvents();
  };

  const prefetchForHealthTab = () => {
    prefetchUpcomingEvents();
    prefetchTodayEvents();
  };

  const prefetchForCalendarTab = (date?: string) => {
    if (!enabled) return;

    prefetchTodayEvents();

    const todayKey = toISODateStringWithFallback(new Date());
    if (date && date !== todayKey) {
      queryClient.prefetchQuery({
        queryKey: eventKeys.calendar(date),
        queryFn: () =>
          unwrapApiResponse(
            import('@/lib/services/eventService').then(m =>
              m.eventService.getEventsByDate(date)
            ),
            { defaultValue: [] }
          ),
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    }
  };

  return {
    prefetchPetDetails,
    prefetchPetHealthRecords,
    prefetchPetEvents,
    prefetchPetFeedingSchedules,
    prefetchRelatedData,
    prefetchUpcomingEvents,
    prefetchTodayEvents,
    prefetchActiveFeedingSchedules,
    prefetchForPetDetailsView,
    prefetchForHealthTab,
    prefetchForCalendarTab,
  };
}
