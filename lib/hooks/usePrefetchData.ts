import { useQueryClient } from '@tanstack/react-query';
import { petKeys } from './usePets';
import { healthRecordKeys } from './useHealthRecords';
import { eventKeys } from './useEvents';
import { feedingScheduleKeys } from './useFeedingSchedules';
import { unwrapApiResponse } from './core/unwrapApiResponse';
import { toISODateString } from '@/lib/utils/dateConversion';

export function usePrefetchData() {
  const queryClient = useQueryClient();

  const prefetchPetDetails = (petId: string) => {
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
    prefetchTodayEvents();

    const todayKey = toISODateString(new Date()) ?? new Date().toISOString().split('T')[0];
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
