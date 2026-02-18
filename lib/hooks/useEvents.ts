import { eventService } from "@/lib/services/eventService";
import { CreateEventInput, Event, UpdateEventInput } from "@/lib/types";
import {
  useCreateResource,
  useDeleteResource,
  useUpdateResource,
} from "./useCrud";
import { useResource } from "./core/useResource";
import { useResources } from "./core/useResources";
import { useConditionalQuery } from "./core/useConditionalQuery";
import { eventKeys } from "./queryKeys";
import { useMemo } from "react";
import { filterUpcomingEvents, groupEventsByTime } from "@/lib/utils/events";
import { useReminderScheduler } from "@/hooks/useReminderScheduler";
import { ReminderPresetKey } from "@/constants/reminders";
import { useUserTimezone } from "@/lib/hooks/useUserTimezone";
import { normalizeTimezone } from "@/lib/utils/timezone";

export { eventKeys } from "./queryKeys";

// Hooks
export const useEvents = (petId: string) => {
  return useResources<Event>({
    deps: [JSON.stringify(eventKeys.list({ petId }))],
    queryFn: () => eventService.getEventsByPetId(petId),
    enabled: !!petId,
  });
};

const MISSING_ID_PLACEHOLDER = "__missing__";

const buildCalendarQueryKey = (date: string, timezone?: string) => {
  return eventKeys.calendarScoped(date, timezone);
};

export const useEvent = (id?: string, options?: { enabled?: boolean }) => {
  const safeId = id ?? MISSING_ID_PLACEHOLDER;
  const isEnabled =
    options?.enabled !== undefined ? options.enabled && !!id : !!id;

  return useResource<Event>({
    deps: [JSON.stringify(eventKeys.detail(safeId))],
    queryFn: () => eventService.getEventById(safeId),
    enabled: isEnabled,
  });
};

export const useCalendarEvents = (
  date: string,
  options?: { enabled?: boolean; timezone?: string },
) => {
  const timezone = normalizeTimezone(options?.timezone);
  const isEnabled =
    options?.enabled !== undefined ? options.enabled && !!date : !!date;

  return useConditionalQuery<Event[]>({
    deps: [JSON.stringify(buildCalendarQueryKey(date, timezone))],
    queryFn: () => eventService.getEventsByDate(date, timezone),
    enabled: isEnabled,
    defaultValue: [],
  });
};

export const useUpcomingEvents = () => {
  const timezone = useUserTimezone();

  return useResources<Event>({
    deps: [JSON.stringify(eventKeys.upcomingScoped(timezone))],
    queryFn: () => eventService.getUpcomingEvents(timezone),
    refetchInterval: 5 * 60 * 1000,
  });
};

export const useTodayEvents = () => {
  const timezone = useUserTimezone();

  return useResources<Event>({
    deps: [JSON.stringify(eventKeys.todayScoped(timezone))],
    queryFn: () => eventService.getTodayEvents(timezone),
    refetchInterval: 30 * 1000,
  });
};

/**
 * Combined hook that provides filtered and grouped upcoming events
 * Combines useUpcomingEvents with filtering and grouping logic
 *
 * @param daysToShow - Number of days to show from now (default: 7)
 * @param maxEvents - Maximum number of events to return (default: 5)
 * @returns Object containing:
 *   - upcomingEvents: Filtered array of events
 *   - eventGroups: Events grouped by time categories (now, today, tomorrow, thisWeek)
 *   - isLoading: Loading state
 *   - refetch: Function to refetch the data
 */
export const useGroupedUpcomingEvents = (
  daysToShow: number = 7,
  maxEvents: number = 5,
) => {
  const { data: allEvents = [], isLoading, refetch } = useUpcomingEvents();
  const timezone = useUserTimezone();

  const upcomingEvents = useMemo(() => {
    return filterUpcomingEvents(allEvents, daysToShow, maxEvents, timezone);
  }, [allEvents, daysToShow, maxEvents, timezone]);

  const eventGroups = useMemo(() => {
    return groupEventsByTime(upcomingEvents, timezone);
  }, [upcomingEvents, timezone]);

  return {
    upcomingEvents,
    eventGroups,
    isLoading,
    refetch,
  };
};

export const useEventsByType = (petId: string, type: string) => {
  return useResources<Event>({
    deps: [JSON.stringify(eventKeys.type(petId, type))],
    queryFn: () => eventService.getEventsByPetId(petId),
    enabled: !!petId && !!type,
    select: (events) => events.filter((event: Event) => event.type === type),
  });
};

export const useAllEvents = () => {
  return useResources<Event>({
    deps: [JSON.stringify(eventKeys.list({ petId: "all" }))],
    queryFn: () => eventService.getEvents(),
  });
};

/**
 * Hook for getting the last 3 past events
 * Shows recent events when there are no upcoming events
 */
export const useRecentPastEvents = () => {
  const { data: allEvents = [], isLoading } = useAllEvents();

  const recentPastEvents = useMemo(() => {
    const now = new Date();
    return allEvents
      .filter((event) => new Date(event.startTime) < now)
      .sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
      )
      .slice(0, 3);
  }, [allEvents]);

  return {
    data: recentPastEvents,
    isLoading,
  };
};

// Mutations
export const useCreateEvent = () => {
  const { scheduleChainForEvent, cancelRemindersForEvent, clearReminderState } =
    useReminderScheduler();

  type CreateEventWithPreset = CreateEventInput & {
    reminderPresetKey?: ReminderPresetKey;
  };

  return useCreateResource<Event, CreateEventWithPreset>(
    ({ reminderPresetKey, ...payload }) =>
      eventService.createEvent(payload).then((res) => res.data!),
    {
      onSuccess: async (newEvent, variables) => {
        if (newEvent.reminder) {
          void scheduleChainForEvent(newEvent, variables.reminderPresetKey);
        } else {
          void cancelRemindersForEvent(newEvent._id);
          clearReminderState(newEvent._id);
        }
      },
    },
  );
};

export const useUpdateEvent = () => {
  const { scheduleChainForEvent, cancelRemindersForEvent, clearReminderState } =
    useReminderScheduler();
  type UpdateEventWithPreset = UpdateEventInput & {
    reminderPresetKey?: ReminderPresetKey;
  };

  return useUpdateResource<Event, UpdateEventWithPreset>(
    ({ _id, data }) => {
      const { reminderPresetKey, ...payload } = data;
      return eventService.updateEvent(_id, payload).then((res) => res.data!);
    },
    {
      onSettled: (data, error, variables) => {
        if (data) {
          if (data.reminder) {
            void scheduleChainForEvent(data, variables.data.reminderPresetKey);
          } else {
            void cancelRemindersForEvent(data._id);
            clearReminderState(data._id);
          }
        }
      },
    },
  );
};

export const useDeleteEvent = () => {
  const { cancelRemindersForEvent, clearReminderState } =
    useReminderScheduler();

  return useDeleteResource<Event>(
    (id) => eventService.deleteEvent(id).then((res) => res.data),
    {
      onSuccess: (_data, id) => {
        void cancelRemindersForEvent(id);
        clearReminderState(id);
      },
    },
  );
};
