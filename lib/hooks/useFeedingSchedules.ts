import { feedingScheduleService } from '@/lib/services/feedingScheduleService';
import { cancelFeedingNotifications, syncFeedingReminderForSchedule } from '@/lib/services/notificationService';
import { CreateFeedingScheduleInput, FeedingSchedule, UpdateFeedingScheduleInput } from '@/lib/types';
import { ApiResponse } from '@/lib/api/client';
import { CACHE_TIMES } from '@/lib/config/queryConfig';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCreateResource, useDeleteResource, useUpdateResource } from './useCrud';
import { useResource } from './core/useResource';
import { useResources } from './core/useResources';
import { useConditionalQuery } from './core/useConditionalQuery';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';
import { feedingScheduleKeys } from './queryKeys';
import { useMemo } from 'react';
import { getNextFeedingTime } from '@/lib/schemas/feedingScheduleSchema';
import { usePets } from './usePets';
import { formatDistanceToNow } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { useUserTimezone } from './useUserTimezone';

export { feedingScheduleKeys } from './queryKeys';


// Hooks
export const useFeedingSchedules = (petId: string) => {
  const { enabled } = useAuthQueryEnabled();

  return useConditionalQuery<FeedingSchedule[]>({
    queryKey: feedingScheduleKeys.list({ petId }),
    queryFn: () => feedingScheduleService.getFeedingSchedulesByPetId(petId),
    staleTime: CACHE_TIMES.MEDIUM,
    enabled: enabled && !!petId,
    defaultValue: [],
  });
};

export const useFeedingSchedule = (id: string) => {
  const { enabled } = useAuthQueryEnabled();

  return useResource<FeedingSchedule>({
    queryKey: feedingScheduleKeys.detail(id),
    queryFn: () => feedingScheduleService.getFeedingScheduleById(id),
    staleTime: CACHE_TIMES.LONG,
    enabled: enabled && !!id,
  });
};

export const useActiveFeedingSchedules = () => {
  const { enabled } = useAuthQueryEnabled();

  return useResources<FeedingSchedule>({
    queryKey: feedingScheduleKeys.active(),
    queryFn: () => feedingScheduleService.getActiveFeedingSchedules(),
    staleTime: CACHE_TIMES.SHORT,
    refetchInterval: CACHE_TIMES.MEDIUM,
    enabled,
  });
};

export const useTodayFeedingSchedules = () => {
  const { enabled } = useAuthQueryEnabled();

  return useResources<FeedingSchedule>({
    queryKey: feedingScheduleKeys.today(),
    queryFn: () => feedingScheduleService.getTodayFeedingSchedules(),
    staleTime: CACHE_TIMES.VERY_SHORT,
    refetchInterval: CACHE_TIMES.VERY_SHORT,
    enabled,
  });
};

export const useAllFeedingSchedules = () => {
  const { enabled } = useAuthQueryEnabled();

  return useResources<FeedingSchedule>({
    queryKey: feedingScheduleKeys.lists(),
    queryFn: () => feedingScheduleService.getFeedingSchedules(),
    staleTime: CACHE_TIMES.SHORT,
    enabled,
  });
};

export const useNextFeeding = () => {
  const { enabled } = useAuthQueryEnabled();

  return useConditionalQuery<FeedingSchedule | null>({
    queryKey: feedingScheduleKeys.next(),
    queryFn: () => feedingScheduleService.getNextFeeding(),
    enabled,
    staleTime: CACHE_TIMES.VERY_SHORT,
    refetchInterval: CACHE_TIMES.VERY_SHORT * 2, // Refresh every minute
    defaultValue: null,
  });
};

export const useActiveFeedingSchedulesByPet = (petId: string) => {
  const { enabled } = useAuthQueryEnabled();

  return useConditionalQuery<FeedingSchedule[]>({
    queryKey: feedingScheduleKeys.activeByPet(petId),
    queryFn: () => feedingScheduleService.getActiveFeedingSchedulesByPet(petId),
    staleTime: CACHE_TIMES.SHORT,
    enabled: enabled && !!petId,
    defaultValue: [],
  });
};

/**
 * Combined hook that provides next feeding schedule with all related details
 * Combines data from useNextFeeding and usePets, and calculates derived values
 *
 * @param language - Optional language code for date formatting (default: 'en')
 * @returns Object containing:
 *   - schedule: The next feeding schedule
 *   - pet: The pet associated with the schedule
 *   - nextFeedingTime: Calculated next feeding time
 *   - timeUntil: Human-readable time until next feeding
 *   - isLoading: Loading state
 */
export const useNextFeedingWithDetails = (language: string = 'en') => {
  const { data: nextFeedingSchedule = null, isLoading: isLoadingSchedule } = useNextFeeding();
  const { data: pets = [], isLoading: isLoadingPets } = usePets();
  const userTimezone = useUserTimezone();

  return useMemo(() => {
    const isLoading = isLoadingSchedule || isLoadingPets;

    if (!nextFeedingSchedule) {
      return {
        schedule: null,
        pet: null,
        nextFeedingTime: null,
        timeUntil: null,
        isLoading,
      };
    }

    const nextFeedingTime = getNextFeedingTime([nextFeedingSchedule], userTimezone);
    const pet = pets.find(p => p._id === nextFeedingSchedule.petId) || null;
    const locale = language === 'tr' ? tr : enUS;
    const timeUntil = nextFeedingTime
      ? formatDistanceToNow(nextFeedingTime, { addSuffix: true, locale })
      : null;

    return {
      schedule: nextFeedingSchedule,
      pet,
      nextFeedingTime,
      timeUntil,
      isLoading,
    };
  }, [nextFeedingSchedule, pets, isLoadingSchedule, isLoadingPets, language, userTimezone]);
};

// Mutations
export const useCreateFeedingSchedule = () => {
  const queryClient = useQueryClient();

  return useCreateResource<FeedingSchedule, CreateFeedingScheduleInput>(
    (data) => feedingScheduleService.createFeedingSchedule(data).then(res => res.data!),
    {
      listQueryKey: feedingScheduleKeys.lists(),
      onSuccess: (newSchedule) => {
        // Update active schedules if it's active
        if (newSchedule.isActive) {
          queryClient.setQueryData(feedingScheduleKeys.active(), (old: FeedingSchedule[] | undefined) =>
            old ? [...old, newSchedule] : [newSchedule]
          );

          queryClient.setQueryData(feedingScheduleKeys.activeByPet(newSchedule.petId), (old: FeedingSchedule[] | undefined) =>
            old ? [...old, newSchedule] : [newSchedule]
          );

          void syncFeedingReminderForSchedule(newSchedule);
        }
      },
      onSettled: (newSchedule) => {
        if (newSchedule) {
          queryClient.invalidateQueries({ queryKey: feedingScheduleKeys.list({ petId: newSchedule.petId }) });
          queryClient.invalidateQueries({ queryKey: feedingScheduleKeys.lists() });
          queryClient.invalidateQueries({ queryKey: feedingScheduleKeys.active() });
          queryClient.invalidateQueries({ queryKey: feedingScheduleKeys.today() });
          queryClient.invalidateQueries({ queryKey: feedingScheduleKeys.next() });
        }
      },
    }
  );
};

export const useUpdateFeedingSchedule = () => {
  const queryClient = useQueryClient();

  return useUpdateResource<FeedingSchedule, UpdateFeedingScheduleInput>(
    ({ _id, data }) => feedingScheduleService.updateFeedingSchedule(_id, data).then(res => res.data!),
    {
      listQueryKey: feedingScheduleKeys.lists(),
      detailQueryKey: feedingScheduleKeys.detail,
      onSettled: (data) => {
        if (data) {
          void syncFeedingReminderForSchedule(data);
        }

        queryClient.invalidateQueries({ queryKey: feedingScheduleKeys.lists() });
        queryClient.invalidateQueries({ queryKey: feedingScheduleKeys.active() });
        queryClient.invalidateQueries({ queryKey: feedingScheduleKeys.today() });
        queryClient.invalidateQueries({ queryKey: feedingScheduleKeys.next() });
      },
    }
  );
};

export const useDeleteFeedingSchedule = () => {
  const queryClient = useQueryClient();

  return useDeleteResource<FeedingSchedule>(
    (id) => feedingScheduleService.deleteFeedingSchedule(id).then(res => res.data),
    {
      listQueryKey: feedingScheduleKeys.lists(),
      detailQueryKey: feedingScheduleKeys.detail,
      onSuccess: (_data, id) => {
        void cancelFeedingNotifications(id);

        // Remove from active schedules
        queryClient.setQueryData(feedingScheduleKeys.active(), (old: FeedingSchedule[] | undefined) =>
          old?.filter(schedule => schedule._id !== id)
        );

        queryClient.setQueryData(feedingScheduleKeys.today(), (old: FeedingSchedule[] | undefined) =>
          old?.filter(schedule => schedule._id !== id)
        );

        queryClient.setQueryData(feedingScheduleKeys.next(), (old: FeedingSchedule[] | undefined) =>
          old?.filter(schedule => schedule._id !== id)
        );
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: feedingScheduleKeys.lists() });
        queryClient.invalidateQueries({ queryKey: feedingScheduleKeys.active() });
        queryClient.invalidateQueries({ queryKey: feedingScheduleKeys.today() });
        queryClient.invalidateQueries({ queryKey: feedingScheduleKeys.next() });
      },
    }
  );
};

export const useToggleFeedingSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      feedingScheduleService.toggleFeedingSchedule(id, isActive).then((res: ApiResponse<FeedingSchedule>) => res.data),
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey: feedingScheduleKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: feedingScheduleKeys.lists() });

      const previousSchedule = queryClient.getQueryData(feedingScheduleKeys.detail(id));

      // Update the schedule in cache
      queryClient.setQueryData(feedingScheduleKeys.detail(id), (old: FeedingSchedule | undefined) =>
        old
          ? {
              ...old,
              isActive,
              remindersEnabled: isActive,
              nextNotificationTime: isActive ? old.nextNotificationTime : undefined,
              updatedAt: new Date().toISOString(),
            }
          : undefined
      );

      // Update the schedule in all lists
      queryClient.setQueriesData({ queryKey: feedingScheduleKeys.lists() }, (old: FeedingSchedule[] | undefined) => {
        if (!old) return old;
        return old.map(schedule =>
          schedule._id === id
            ? {
                ...schedule,
                isActive,
                remindersEnabled: isActive,
                nextNotificationTime: isActive ? schedule.nextNotificationTime : undefined,
                updatedAt: new Date().toISOString(),
              }
            : schedule
        );
      });

      // Add or remove from active schedules based on the new state
      if (isActive) {
        const schedule = queryClient.getQueryData(feedingScheduleKeys.detail(id)) as FeedingSchedule;
        if (schedule) {
          queryClient.setQueryData(feedingScheduleKeys.active(), (old: FeedingSchedule[] | undefined) =>
            old ? [...old.filter(s => s._id !== id), schedule] : [schedule]
          );
        }
      } else {
        queryClient.setQueryData(feedingScheduleKeys.active(), (old: FeedingSchedule[] | undefined) =>
          old?.filter(schedule => schedule._id !== id)
        );
      }

      return { previousSchedule };
    },
    onError: (err, variables, context) => {
      if (context?.previousSchedule) {
        queryClient.setQueryData(feedingScheduleKeys.detail(variables.id), context.previousSchedule);
      }
    },
    onSettled: (data) => {
      if (data) {
        void syncFeedingReminderForSchedule(data);
      }

      queryClient.invalidateQueries({ queryKey: feedingScheduleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: feedingScheduleKeys.active() });
      queryClient.invalidateQueries({ queryKey: feedingScheduleKeys.today() });
      queryClient.invalidateQueries({ queryKey: feedingScheduleKeys.next() });
    },
  });
};
