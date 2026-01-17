import { eventService } from '@/lib/services/eventService';
import { CreateEventInput, Event, UpdateEventInput } from '@/lib/types';
import { CACHE_TIMES } from '@/lib/config/queryConfig';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateResource, useDeleteResource, useUpdateResource } from './useCrud';
import { useResource } from './core/useResource';
import { useResources } from './core/useResources';
import { useConditionalQuery } from './core/useConditionalQuery';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';
import { eventKeys } from './queryKeys';
import { useMemo } from 'react';
import { filterUpcomingEvents, groupEventsByTime } from '@/lib/utils/events';
import { toISODateString } from '@/lib/utils/dateConversion';
import { useReminderScheduler } from '@/hooks/useReminderScheduler';
import { ReminderPresetKey } from '@/constants/reminders';

export { eventKeys } from './queryKeys';


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

const MISSING_ID_PLACEHOLDER = '__missing__';

export const useEvent = (id?: string, options?: { enabled?: boolean }) => {
  const { enabled } = useAuthQueryEnabled();
  const safeId = id ?? MISSING_ID_PLACEHOLDER;
  const isEnabled = options?.enabled !== undefined ? (options.enabled && !!id) : !!id;

  return useResource<Event>({
    queryKey: eventKeys.detail(safeId),
    queryFn: () => eventService.getEventById(safeId),
    staleTime: CACHE_TIMES.LONG,
    enabled: enabled && isEnabled,
  });
};

export const useCalendarEvents = (date: string, options?: { enabled?: boolean }) => {
  const { enabled } = useAuthQueryEnabled();
  const isEnabled = options?.enabled !== undefined ? (options.enabled && !!date) : !!date;

  return useConditionalQuery<Event[]>({
    queryKey: eventKeys.calendar(date),
    queryFn: () => eventService.getEventsByDate(date),
    staleTime: CACHE_TIMES.MEDIUM,
    enabled: enabled && isEnabled,
    defaultValue: [],
  });
};

export const useUpcomingEvents = () => {
  const { enabled } = useAuthQueryEnabled();

  return useResources<Event>({
    queryKey: eventKeys.upcoming(),
    queryFn: () => eventService.getUpcomingEvents(),
    enabled,
    staleTime: CACHE_TIMES.SHORT,
    refetchInterval: CACHE_TIMES.MEDIUM,
  });
};

export const useTodayEvents = () => {
  const { enabled } = useAuthQueryEnabled();

  return useResources<Event>({
    queryKey: eventKeys.today(),
    queryFn: () => eventService.getTodayEvents(),
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
export const useGroupedUpcomingEvents = (daysToShow: number = 7, maxEvents: number = 5) => {
  const { data: allEvents = [], isLoading, refetch } = useUpcomingEvents();

  const upcomingEvents = useMemo(() => {
    return filterUpcomingEvents(allEvents, daysToShow, maxEvents);
  }, [allEvents, daysToShow, maxEvents]);

  const eventGroups = useMemo(() => {
    return groupEventsByTime(upcomingEvents);
  }, [upcomingEvents]);

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
    queryKey: eventKeys.list({ petId: 'all' }),
    queryFn: () => eventService.getEvents(),
    staleTime: CACHE_TIMES.MEDIUM,
    enabled,
  });
};

// Mutations
export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  const { scheduleChainForEvent, cancelRemindersForEvent, clearReminderState } = useReminderScheduler();

  type CreateEventWithPreset = CreateEventInput & { reminderPresetKey?: ReminderPresetKey };

  return useCreateResource<Event, CreateEventWithPreset>(
    ({ reminderPresetKey, ...payload }) => eventService.createEvent(payload).then(res => res.data!),
    {
      listQueryKey: eventKeys.lists(),
      onSuccess: async (newEvent, variables) => {
        // Also update calendar and today events if applicable
        const eventDate =
          toISODateString(new Date(newEvent.startTime)) ??
          newEvent.startTime.split('T')[0];
        const today = toISODateString(new Date()) ?? new Date().toISOString().split('T')[0];

        if (eventDate === today) {
          queryClient.setQueryData(eventKeys.today(), (old: Event[] | undefined) =>
            old ? [...old, newEvent] : [newEvent]
          );
        }

        queryClient.setQueryData(eventKeys.calendar(eventDate), (old: Event[] | undefined) =>
          old ? [...old, newEvent] : [newEvent]
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
          queryClient.invalidateQueries({ queryKey: eventKeys.list({ petId: newEvent.petId }) });
          queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
          queryClient.invalidateQueries({ queryKey: eventKeys.upcoming() });
          queryClient.invalidateQueries({ queryKey: eventKeys.today() });

          // Invalidate calendar for the event date
          const eventDate =
            toISODateString(new Date(newEvent.startTime)) ??
            newEvent.startTime.split('T')[0];
          queryClient.invalidateQueries({ queryKey: eventKeys.calendar(eventDate) });
        }
      },
    }
  );
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  const { scheduleChainForEvent, cancelRemindersForEvent, clearReminderState } = useReminderScheduler();
  type UpdateEventWithPreset = UpdateEventInput & { reminderPresetKey?: ReminderPresetKey };

  return useUpdateResource<Event, UpdateEventWithPreset>(
    ({ _id, data }) => {
      const { reminderPresetKey, ...payload } = data;
      return eventService.updateEvent(_id, payload).then(res => res.data!);
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

        queryClient.invalidateQueries({ queryKey: eventKeys.detail(variables._id) });
        queryClient.invalidateQueries({ queryKey: eventKeys.lists() });

        // Invalidate calendar queries if date changed
        if (variables.data.startTime) {
          const eventDate =
            toISODateString(new Date(variables.data.startTime)) ??
            variables.data.startTime.split('T')[0];
          queryClient.invalidateQueries({ queryKey: eventKeys.calendar(eventDate) });
        }
      },
    }
  );
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  const { cancelRemindersForEvent, clearReminderState } = useReminderScheduler();

  return useDeleteResource<Event>(
    (id) => eventService.deleteEvent(id).then(res => res.data),
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
        queryClient.invalidateQueries({ queryKey: eventKeys.upcoming() });
        queryClient.invalidateQueries({ queryKey: eventKeys.today() });
        queryClient.invalidateQueries({
          predicate: (query) =>
            Array.isArray(query.queryKey) &&
            query.queryKey[0] === eventKeys.all[0] &&
            query.queryKey[1] === 'calendar',
        });
      },
    }
  );
};
