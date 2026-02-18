import { useEffect, useState } from 'react';
import { recurrenceService } from '@/lib/services/recurrenceService';
import {
  useLocalMutation,
  useLocalQuery,
} from './core/useLocalAsync';
import type {
  RecurrenceRule,
  RecurrenceRuleData,
  UpdateRecurrenceRuleData,
} from '@/lib/schemas/recurrenceSchema';
import type { Event } from '@/lib/types';

export const recurrenceKeys = {
  all: ['recurrence-rules'] as const,
  lists: () => [...recurrenceKeys.all, 'list'] as const,
  list: (filters: { petId?: string; isActive?: boolean }) =>
    [...recurrenceKeys.lists(), filters] as const,
  details: () => [...recurrenceKeys.all, 'detail'] as const,
  detail: (id: string) => [...recurrenceKeys.details(), id] as const,
  events: (id: string) => [...recurrenceKeys.all, 'events', id] as const,
};

let recurrenceVersion = 0;
const recurrenceListeners = new Set<() => void>();

const notifyRecurrenceChange = () => {
  recurrenceVersion += 1;
  recurrenceListeners.forEach((listener) => listener());
};

const useRecurrenceVersion = () => {
  const [version, setVersion] = useState(recurrenceVersion);

  useEffect(() => {
    const listener = () => setVersion(recurrenceVersion);
    recurrenceListeners.add(listener);
    return () => {
      recurrenceListeners.delete(listener);
    };
  }, []);

  return version;
};

const getErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};

const ensureSuccess = <TData,>(
  response: { success: boolean; data?: TData; error?: string | { message?: string } },
  fallbackMessage: string
): TData => {
  if (!response.success || response.data === undefined) {
    const message =
      typeof response.error === 'string'
        ? response.error
        : response.error?.message ?? fallbackMessage;
    throw new Error(message);
  }

  return response.data;
};

export const useRecurrenceRules = (options?: {
  petId?: string;
  isActive?: boolean;
}) => {
  const recurrenceStateVersion = useRecurrenceVersion();

  return useLocalQuery<RecurrenceRule[]>({
    defaultValue: [],
    deps: [options?.petId, options?.isActive, recurrenceStateVersion],
    queryFn: async () => {
      const response = await recurrenceService.getRules(options);
      return ensureSuccess(response, 'Failed to load recurrence rules');
    },
  });
};

export const useRecurrenceRule = (id?: string) => {
  const recurrenceStateVersion = useRecurrenceVersion();

  return useLocalQuery<RecurrenceRule | null>({
    enabled: !!id,
    defaultValue: null,
    deps: [id, recurrenceStateVersion],
    queryFn: async () => {
      if (!id) {
        return null;
      }
      const response = await recurrenceService.getRuleById(id);
      return ensureSuccess(response, 'Failed to load recurrence rule');
    },
  });
};

export const useRecurrenceRuleEvents = (
  id?: string,
  options?: { includePast?: boolean; limit?: number }
) => {
  const recurrenceStateVersion = useRecurrenceVersion();

  return useLocalQuery<Event[]>({
    enabled: !!id,
    defaultValue: [],
    deps: [id, options?.includePast, options?.limit, recurrenceStateVersion],
    queryFn: async () => {
      if (!id) {
        return [];
      }
      const response = await recurrenceService.getEventsByRuleId(id, options);
      return ensureSuccess(response, 'Failed to load recurrence events');
    },
  });
};

export const useCreateRecurrenceRule = () => {
  return useLocalMutation({
    mutationFn: async (data: RecurrenceRuleData) => {
      const response = await recurrenceService.createRule(data);
      return ensureSuccess(response, 'Failed to create recurrence rule');
    },
    onSuccess: () => {
      notifyRecurrenceChange();
    },
  });
};

export const useUpdateRecurrenceRule = () => {
  return useLocalMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateRecurrenceRuleData;
    }) => {
      const response = await recurrenceService.updateRule(id, data);
      return ensureSuccess(response, 'Failed to update recurrence rule');
    },
    onSuccess: () => {
      notifyRecurrenceChange();
    },
  });
};

export const useDeleteRecurrenceRule = () => {
  return useLocalMutation({
    mutationFn: async (id: string) => {
      const response = await recurrenceService.deleteRule(id);
      return ensureSuccess(response, 'Failed to delete recurrence rule');
    },
    onSuccess: () => {
      notifyRecurrenceChange();
    },
  });
};

export const useRegenerateRecurrenceEvents = () => {
  return useLocalMutation({
    mutationFn: async (id: string) => {
      const response = await recurrenceService.regenerateEvents(id);
      return ensureSuccess(response, 'Failed to regenerate recurrence events');
    },
    onSuccess: () => {
      notifyRecurrenceChange();
    },
  });
};

export const useAddRecurrenceException = () => {
  return useLocalMutation({
    mutationFn: async ({ id, date }: { id: string; date: string }) => {
      const response = await recurrenceService.addException(id, date);
      return ensureSuccess(response, 'Failed to add recurrence exception');
    },
    onSuccess: () => {
      notifyRecurrenceChange();
    },
  });
};

export { getErrorMessage };
