import { eventService } from "@/lib/services/eventService";
import { CreateEventInput, Event, UpdateEventInput } from "@/lib/types";
import { CACHE_TIMES } from "@/lib/config/queryConfig";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateResource,
  useDeleteResource,
  useUpdateResource,
} from "./useCrud";
import { useResource } from "./core/useResource";
import { useResources } from "./core/useResources";
import { useConditionalQuery } from "./core/useConditionalQuery";
import { useAuthQueryEnabled } from "./useAuthQueryEnabled";
import { eventKeys } from "./queryKeys";
import { useEffect, useMemo } from "react";
import { filterUpcomingEvents, groupEventsByTime } from "@/lib/utils/events";
import { extractISODatePart, toISODateString } from "@/lib/utils/dateConversion";
import { formatInTimeZone } from "@/lib/utils/date";
import { useReminderScheduler } from "@/hooks/useReminderScheduler";
import { ReminderPresetKey } from "@/constants/reminders";
import { useUserTimezone } from "@/lib/hooks/useUserTimezone";
import { normalizeTimezone } from "@/lib/utils/timezone";

export { eventKeys } from "./queryKeys";

// Hooks
export const useEvents = (petId: string) => {
  const { enabled } = useAuthQueryEnabled();

  return useResources<Event>({
    queryKey: eventKeys.list({ petId }),
    queryFn: () => eventService.getEventsByPetId(petId),
    staleTime: CACHE_TIMES.MEDIUM,
    enabled: enabled && !!petId,
  });
};

const MISSING_ID_PLACEHOLDER = "__missing__";

const getEventDateForTimezone = (startTime: string, timezone?: string) => {
  const safeTimezone = normalizeTimezone(timezone);

  if (safeTimezone) {
    try {
      return formatInTimeZone(startTime, safeTimezone, "yyyy-MM-dd");
    } catch {
      // Fall through to local date fallback when timezone formatting fails
    }
  }

  return toISODateString(new Date(startTime)) ?? extractISODatePart(startTime) ?? "";
};

const isCalendarQueryForDate = (queryKey: readonly unknown[], date: string) =>
  Array.isArray(queryKey) &&
  queryKey[0] === eventKeys.all[0] &&
  queryKey[1] === "calendar" &&
  queryKey[2] === date;

const isCalendarQuery = (queryKey: readonly unknown[]) =>
  Array.isArray(queryKey) &&
  queryKey[0] === eventKeys.all[0] &&
  queryKey[1] === "calendar";

const isTodayQuery = (queryKey: readonly unknown[]) =>
  Array.isArray(queryKey) &&
  queryKey[0] === eventKeys.all[0] &&
  queryKey[1] === "today";

const isUpcomingQuery = (queryKey: readonly unknown[]) =>
  Array.isArray(queryKey) &&
  queryKey[0] === eventKeys.all[0] &&
  queryKey[1] === "upcoming";

const buildCalendarQueryKey = (date: string, timezone?: string) => {
  const safeTimezone = normalizeTimezone(timezone);
  return eventKeys.calendarScoped(date, safeTimezone);
};

export const useEvent = (id?: string, options?: { enabled?: boolean }) => {
  const { enabled } = useAuthQueryEnabled();
  const safeId = id ?? MISSING_ID_PLACEHOLDER;
  const isEnabled =
    options?.enabled !== undefined ? options.enabled && !!id : !!id;

  return useResource<Event>({
    queryKey: eventKeys.detail(safeId),
    queryFn: () => eventService.getEventById(safeId),
    staleTime: CACHE_TIMES.LONG,
    enabled: enabled && isEnabled,
  });
};

export const useCalendarEvents = (
  date: string,
  options?: { enabled?: boolean; timezone?: string },
) => {
  const { enabled } = useAuthQueryEnabled();
  const timezone = normalizeTimezone(options?.timezone);
  const isEnabled =
    options?.enabled !== undefined ? options.enabled && !!date : !!date;

  return useConditionalQuery<Event[]>({
    queryKey: buildCalendarQueryKey(date, timezone),
    queryFn: () => eventService.getEventsByDate(date, timezone),
    staleTime: CACHE_TIMES.MEDIUM,
    enabled: enabled && isEnabled,
    defaultValue: [],
  });
};

export const useUpcomingEvents = () => {
  const { enabled } = useAuthQueryEnabled();
  const timezone = useUserTimezone();
  const queryClient = useQueryClient();

  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: eventKeys.upcoming() });
  }, [queryClient, timezone]);

  return useResources<Event>({
    queryKey: eventKeys.upcomingScoped(timezone),
    queryFn: () => eventService.getUpcomingEvents(timezone),
    enabled,
    staleTime: CACHE_TIMES.SHORT,
    refetchInterval: CACHE_TIMES.MEDIUM,
  });
};

export const useTodayEvents = () => {
  const { enabled } = useAuthQueryEnabled();
  const timezone = useUserTimezone();
  const queryClient = useQueryClient();

  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: eventKeys.today() });
  }, [queryClient, timezone]);

  return useResources<Event>({
    queryKey: eventKeys.todayScoped(timezone),
    queryFn: () => eventService.getTodayEvents(timezone),
    enabled,
    staleTime: CACHE_TIMES.VERY_SHORT,
    refetchInterval: CACHE_TIMES.VERY_SHORT,
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
  const { enabled } = useAuthQueryEnabled();

  return useResources<Event>({
    queryKey: eventKeys.type(petId, type),
    queryFn: () => eventService.getEventsByPetId(petId),
    staleTime: CACHE_TIMES.MEDIUM,
    enabled: enabled && !!petId && !!type,
    select: (events) => events.filter((event: Event) => event.type === type),
  });
};

export const useAllEvents = () => {
  const { enabled } = useAuthQueryEnabled();

  return useResources<Event>({
    queryKey: eventKeys.list({ petId: "all" }),
    queryFn: () => eventService.getEvents(),
    staleTime: CACHE_TIMES.MEDIUM,
    enabled,
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
  const queryClient = useQueryClient();
  const timezone = useUserTimezone();
  const { scheduleChainForEvent, cancelRemindersForEvent, clearReminderState } =
    useReminderScheduler();

  type CreateEventWithPreset = CreateEventInput & {
    reminderPresetKey?: ReminderPresetKey;
  };

  return useCreateResource<Event, CreateEventWithPreset>(
    ({ reminderPresetKey, ...payload }) =>
      eventService.createEvent(payload).then((res) => res.data!),
    {
      listQueryKey: eventKeys.lists(),
      onSuccess: async (newEvent, variables) => {
        // Also update calendar and today events if applicable
        const eventDate = getEventDateForTimezone(newEvent.startTime, timezone);
        const today = getEventDateForTimezone(new Date().toISOString(), timezone);

        if (eventDate === today) {
          queryClient.setQueriesData(
            {
              predicate: (query) => isTodayQuery(query.queryKey),
            },
            (old: Event[] | undefined) =>
              old ? [...old, newEvent] : [newEvent],
          );
        }

        queryClient.setQueriesData(
          {
            predicate: (query) => isCalendarQueryForDate(query.queryKey, eventDate),
          },
          (old: Event[] | undefined) => (old ? [...old, newEvent] : [newEvent]),
        );

        if (newEvent.reminder) {
          void scheduleChainForEvent(newEvent, variables.reminderPresetKey);
        } else {
          void cancelRemindersForEvent(newEvent._id);
          clearReminderState(newEvent._id);
        }
      },
      onSettled: (newEvent) => {
        if (newEvent) {
          queryClient.invalidateQueries({
            queryKey: eventKeys.list({ petId: newEvent.petId }),
          });
          queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
          queryClient.invalidateQueries({
            predicate: (query) => isUpcomingQuery(query.queryKey),
          });
          queryClient.invalidateQueries({
            predicate: (query) => isTodayQuery(query.queryKey),
          });

          // Invalidate all calendar query variants (timezone-aware keys included)
          queryClient.invalidateQueries({
            predicate: (query) => isCalendarQuery(query.queryKey),
          });
        }
      },
    },
  );
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  const timezone = useUserTimezone();
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
      listQueryKey: eventKeys.lists(),
      detailQueryKey: eventKeys.detail,
      onSettled: (data, error, variables) => {
        if (data) {
          if (data.reminder) {
            void scheduleChainForEvent(data, variables.data.reminderPresetKey);
          } else {
            void cancelRemindersForEvent(data._id);
            clearReminderState(data._id);
          }
        }

        queryClient.invalidateQueries({
          queryKey: eventKeys.detail(variables._id),
        });
        queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
        queryClient.invalidateQueries({
          predicate: (query) => isUpcomingQuery(query.queryKey),
        });
        queryClient.invalidateQueries({
          predicate: (query) => isTodayQuery(query.queryKey),
        });

        // Keep calendar query variants consistent after update
        queryClient.invalidateQueries({
          predicate: (query) => isCalendarQuery(query.queryKey),
        });

        const targetStartTime = variables.data.startTime ?? data?.startTime;
        if (targetStartTime && data) {
          const targetDate = getEventDateForTimezone(targetStartTime, timezone);
          queryClient.setQueriesData(
            {
              predicate: (query) => isCalendarQueryForDate(query.queryKey, targetDate),
            },
            (old: Event[] | undefined) => {
              if (!old) return old;
              const withoutOld = old.filter((item) => item._id !== data._id);
              return [...withoutOld, data];
            },
          );
        }
      },
    },
  );
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  const { cancelRemindersForEvent, clearReminderState } =
    useReminderScheduler();

  return useDeleteResource<Event>(
    (id) => eventService.deleteEvent(id).then((res) => res.data),
    {
      listQueryKey: eventKeys.lists(),
      detailQueryKey: eventKeys.detail,
      onSuccess: (_data, id) => {
        void cancelRemindersForEvent(id);
        clearReminderState(id);
        // Remove from calendar and today events
        // Note: This is a bit tricky since we don't have the event object here easily without fetching it first.
        // But useDeleteResource does optimistic updates on the list.
        // For specific lists like calendar/today, we might need to invalidate them.
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
        queryClient.invalidateQueries({
          predicate: (query) => isUpcomingQuery(query.queryKey),
        });
        queryClient.invalidateQueries({
          predicate: (query) => isTodayQuery(query.queryKey),
        });
        queryClient.invalidateQueries({
          predicate: (query) =>
            Array.isArray(query.queryKey) &&
            query.queryKey[0] === eventKeys.all[0] &&
            query.queryKey[1] === "calendar",
        });
      },
    },
  );
};
