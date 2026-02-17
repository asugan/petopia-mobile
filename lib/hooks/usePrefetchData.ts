import { unwrapApiResponse } from './core/unwrapApiResponse';
import { toLocalDateKey } from '@/lib/utils/timezoneDate';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';
import { useUserTimezone } from './useUserTimezone';
import { petService } from '@/lib/services/petService';
import { healthRecordService } from '@/lib/services/healthRecordService';
import { eventService } from '@/lib/services/eventService';
import { feedingScheduleService } from '@/lib/services/feedingScheduleService';

export function usePrefetchData() {
  const { enabled } = useAuthQueryEnabled();
  const timezone = useUserTimezone();

  const runPrefetch = (callback: () => Promise<unknown>) => {
    if (!enabled) return;
    void callback();
  };

  const prefetchPetDetails = (petId: string) => {
    runPrefetch(() =>
      unwrapApiResponse(petService.getPetById(petId))
    );
  };

  const prefetchPetHealthRecords = (petId: string) => {
    runPrefetch(() =>
      unwrapApiResponse(healthRecordService.getHealthRecordsByPetId(petId), {
        defaultValue: [],
      })
    );
  };

  const prefetchPetEvents = (petId: string) => {
    runPrefetch(() =>
      unwrapApiResponse(eventService.getEventsByPetId(petId), {
        defaultValue: [],
      })
    );
  };

  const prefetchPetFeedingSchedules = (petId: string) => {
    runPrefetch(() =>
      unwrapApiResponse(feedingScheduleService.getFeedingSchedulesByPetId(petId), {
        defaultValue: [],
      })
    );
  };

  const prefetchRelatedData = (petId: string) => {
    prefetchPetDetails(petId);
    prefetchPetHealthRecords(petId);
    prefetchPetEvents(petId);
    prefetchPetFeedingSchedules(petId);
  };

  const prefetchUpcomingEvents = () => {
    runPrefetch(() =>
      unwrapApiResponse(eventService.getUpcomingEvents(timezone), {
        defaultValue: [],
      })
    );
  };

  const prefetchTodayEvents = () => {
    runPrefetch(() =>
      unwrapApiResponse(eventService.getTodayEvents(timezone), {
        defaultValue: [],
      })
    );
  };

  const prefetchActiveFeedingSchedules = () => {
    runPrefetch(() =>
      unwrapApiResponse(feedingScheduleService.getActiveFeedingSchedules(), {
        defaultValue: [],
      })
    );
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

    const todayKey = toLocalDateKey(new Date(), timezone);
    if (date && date !== todayKey) {
      runPrefetch(() =>
        unwrapApiResponse(eventService.getEventsByDate(date, timezone), {
          defaultValue: [],
        })
      );
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
