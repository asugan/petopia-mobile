import { useEffect, useMemo, useState } from 'react';
import { feedingScheduleService } from '@/lib/services/feedingScheduleService';
import {
  cancelFeedingNotifications,
  syncFeedingReminderForSchedule,
} from '@/lib/services/notificationService';
import {
  CreateFeedingScheduleInput,
  FeedingSchedule,
  UpdateFeedingScheduleInput,
} from '@/lib/types';
import { getNextFeedingTime } from '@/lib/schemas/feedingScheduleSchema';
import { usePets } from './usePets';
import { formatDistanceToNow } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { useUserTimezone } from './useUserTimezone';
import { useLocalMutation, useLocalQuery } from './core/useLocalAsync';

export { feedingScheduleKeys } from './queryKeys';

let feedingSchedulesVersion = 0;
const feedingScheduleListeners = new Set<() => void>();

const notifyFeedingScheduleChange = () => {
  feedingSchedulesVersion += 1;
  feedingScheduleListeners.forEach((listener) => listener());
};

const useFeedingScheduleVersion = () => {
  const [version, setVersion] = useState(feedingSchedulesVersion);

  useEffect(() => {
    const listener = () => setVersion(feedingSchedulesVersion);
    feedingScheduleListeners.add(listener);
    return () => {
      feedingScheduleListeners.delete(listener);
    };
  }, []);

  return version;
};

const ensureSuccess = <TData,>(
  response: { success: boolean; data?: TData; error?: string | { message?: string } },
  fallbackMessage: string,
  defaultValue?: TData
) => {
  if (response.success) {
    return (response.data ?? defaultValue) as TData;
  }

  const message =
    typeof response.error === 'string'
      ? response.error
      : response.error?.message ?? fallbackMessage;
  throw new Error(message);
};

export const useFeedingSchedules = (petId: string) => {
  const version = useFeedingScheduleVersion();

  return useLocalQuery<FeedingSchedule[]>({
    enabled: !!petId,
    defaultValue: [],
    deps: [petId, version],
    queryFn: async () => {
      const response = await feedingScheduleService.getFeedingSchedulesByPetId(petId);
      return ensureSuccess(response, 'Failed to load feeding schedules', []);
    },
  });
};

export const useFeedingSchedule = (id: string) => {
  const version = useFeedingScheduleVersion();

  return useLocalQuery<FeedingSchedule | null>({
    enabled: !!id,
    defaultValue: null,
    deps: [id, version],
    queryFn: async () => {
      const response = await feedingScheduleService.getFeedingScheduleById(id);
      return ensureSuccess(response, 'Failed to load feeding schedule', null);
    },
  });
};

export const useActiveFeedingSchedules = () => {
  const version = useFeedingScheduleVersion();

  return useLocalQuery<FeedingSchedule[]>({
    enabled: true,
    defaultValue: [],
    deps: [version],
    refetchInterval: 60_000,
    queryFn: async () => {
      const response = await feedingScheduleService.getActiveFeedingSchedules();
      return ensureSuccess(response, 'Failed to load active feeding schedules', []);
    },
  });
};

export const useTodayFeedingSchedules = () => {
  const version = useFeedingScheduleVersion();

  return useLocalQuery<FeedingSchedule[]>({
    enabled: true,
    defaultValue: [],
    deps: [version],
    refetchInterval: 30_000,
    queryFn: async () => {
      const response = await feedingScheduleService.getTodayFeedingSchedules();
      return ensureSuccess(response, 'Failed to load today feeding schedules', []);
    },
  });
};

export const useAllFeedingSchedules = () => {
  const version = useFeedingScheduleVersion();

  return useLocalQuery<FeedingSchedule[]>({
    enabled: true,
    defaultValue: [],
    deps: [version],
    queryFn: async () => {
      const response = await feedingScheduleService.getFeedingSchedules();
      return ensureSuccess(response, 'Failed to load feeding schedules', []);
    },
  });
};

export const useNextFeeding = () => {
  const version = useFeedingScheduleVersion();

  return useLocalQuery<FeedingSchedule | null>({
    enabled: true,
    defaultValue: null,
    deps: [version],
    refetchInterval: 60_000,
    queryFn: async () => {
      const response = await feedingScheduleService.getNextFeeding();
      return ensureSuccess(response, 'Failed to load next feeding', null);
    },
  });
};

export const useActiveFeedingSchedulesByPet = (petId: string) => {
  const version = useFeedingScheduleVersion();

  return useLocalQuery<FeedingSchedule[]>({
    enabled: !!petId,
    defaultValue: [],
    deps: [petId, version],
    queryFn: async () => {
      const response = await feedingScheduleService.getActiveFeedingSchedulesByPet(
        petId
      );
      return ensureSuccess(
        response,
        'Failed to load active feeding schedules by pet',
        []
      );
    },
  });
};

export const useNextFeedingWithDetails = (language: string = 'en') => {
  const { data: nextFeedingSchedule = null, isLoading: isLoadingSchedule } =
    useNextFeeding();
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
    const pet = pets.find((p) => p._id === nextFeedingSchedule.petId) || null;
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
  }, [
    nextFeedingSchedule,
    pets,
    isLoadingSchedule,
    isLoadingPets,
    language,
    userTimezone,
  ]);
};

export const useCreateFeedingSchedule = () => {
  return useLocalMutation<FeedingSchedule, CreateFeedingScheduleInput>({
    mutationFn: async (data) => {
      const response = await feedingScheduleService.createFeedingSchedule(data);
      return ensureSuccess(response, 'Failed to create feeding schedule');
    },
    onSuccess: (newSchedule) => {
      if (newSchedule.isActive) {
        void syncFeedingReminderForSchedule(newSchedule);
      }
      notifyFeedingScheduleChange();
    },
  });
};

export const useUpdateFeedingSchedule = () => {
  return useLocalMutation<
    FeedingSchedule,
    { _id: string; data: UpdateFeedingScheduleInput }
  >({
    mutationFn: async ({ _id, data }) => {
      const response = await feedingScheduleService.updateFeedingSchedule(_id, data);
      return ensureSuccess(response, 'Failed to update feeding schedule');
    },
    onSuccess: (updatedSchedule) => {
      void syncFeedingReminderForSchedule(updatedSchedule);
      notifyFeedingScheduleChange();
    },
  });
};

export const useDeleteFeedingSchedule = () => {
  return useLocalMutation<void | string, string>({
    mutationFn: async (id) => {
      const response = await feedingScheduleService.deleteFeedingSchedule(id);
      return ensureSuccess(response, 'Failed to delete feeding schedule');
    },
    onSuccess: (_result, id) => {
      void cancelFeedingNotifications(id);
      notifyFeedingScheduleChange();
    },
  });
};

export const useToggleFeedingSchedule = () => {
  return useLocalMutation<FeedingSchedule | undefined, { id: string; isActive: boolean }>(
    {
      mutationFn: async ({ id, isActive }) => {
        const response = await feedingScheduleService.toggleFeedingSchedule(id, isActive);
        return ensureSuccess(response, 'Failed to toggle feeding schedule', undefined);
      },
      onSuccess: (data) => {
        if (data) {
          void syncFeedingReminderForSchedule(data);
        }
        notifyFeedingScheduleChange();
      },
    }
  );
};
