import { useMutation, useQueryClient } from '@tanstack/react-query';
import { recurrenceService } from '@/lib/services/recurrenceService';
import { CACHE_TIMES } from '@/lib/config/queryConfig';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';
import { useResources } from './core/useResources';
import { useResource } from './core/useResource';
import { eventKeys } from './queryKeys';
import type { RecurrenceRule, RecurrenceRuleData, UpdateRecurrenceRuleData } from '@/lib/schemas/recurrenceSchema';
import type { Event } from '@/lib/types';

const isUpcomingOrTodayEventQuery = (queryKey: readonly unknown[]) =>
  Array.isArray(queryKey) &&
  queryKey[0] === eventKeys.all[0] &&
  (queryKey[1] === 'upcoming' || queryKey[1] === 'today');

// Query keys for recurrence rules
export const recurrenceKeys = {
  all: ['recurrence-rules'] as const,
  lists: () => [...recurrenceKeys.all, 'list'] as const,
  list: (filters: { petId?: string; isActive?: boolean }) => [...recurrenceKeys.lists(), filters] as const,
  details: () => [...recurrenceKeys.all, 'detail'] as const,
  detail: (id: string) => [...recurrenceKeys.details(), id] as const,
  events: (id: string) => [...recurrenceKeys.all, 'events', id] as const,
};

/**
 * Hook to fetch all recurrence rules
 */
export const useRecurrenceRules = (options?: { petId?: string; isActive?: boolean }) => {
  const { enabled } = useAuthQueryEnabled();

  return useResources<RecurrenceRule>({
    queryKey: recurrenceKeys.list({ petId: options?.petId, isActive: options?.isActive }),
    queryFn: () => recurrenceService.getRules(options),
    staleTime: CACHE_TIMES.MEDIUM,
    enabled,
  });
};

/**
 * Hook to fetch a single recurrence rule
 */
export const useRecurrenceRule = (id?: string) => {
  const { enabled } = useAuthQueryEnabled();
  const safeId = id ?? '__missing__';

  return useResource<RecurrenceRule>({
    queryKey: recurrenceKeys.detail(safeId),
    queryFn: () => recurrenceService.getRuleById(safeId),
    staleTime: CACHE_TIMES.LONG,
    enabled: enabled && !!id,
  });
};

/**
 * Hook to fetch events for a recurrence rule
 */
export const useRecurrenceRuleEvents = (id?: string, options?: { includePast?: boolean; limit?: number }) => {
  const { enabled } = useAuthQueryEnabled();
  const safeId = id ?? '__missing__';

  return useResources<Event>({
    queryKey: recurrenceKeys.events(safeId),
    queryFn: () => recurrenceService.getEventsByRuleId(safeId, options),
    staleTime: CACHE_TIMES.MEDIUM,
    enabled: enabled && !!id,
  });
};

/**
 * Hook to create a new recurrence rule
 */
export const useCreateRecurrenceRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RecurrenceRuleData) => {
      const response = await recurrenceService.createRule(data);
      if (!response.success || !response.data) {
        const errorMsg = typeof response.error === 'string' ? response.error : response.error?.message;
        throw new Error(errorMsg || 'Failed to create recurrence rule');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate recurrence rules
      queryClient.invalidateQueries({ queryKey: recurrenceKeys.lists() });
      // Invalidate events since new ones were created
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({
        predicate: (query) => isUpcomingOrTodayEventQuery(query.queryKey),
      });
      // Invalidate all calendar queries
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === eventKeys.all[0] &&
          query.queryKey[1] === 'calendar',
      });
    },
  });
};

/**
 * Hook to update a recurrence rule
 */
export const useUpdateRecurrenceRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRecurrenceRuleData }) => {
      const response = await recurrenceService.updateRule(id, data);
      if (!response.success || !response.data) {
        const errorMsg = typeof response.error === 'string' ? response.error : response.error?.message;
        throw new Error(errorMsg || 'Failed to update recurrence rule');
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate specific rule
      queryClient.invalidateQueries({ queryKey: recurrenceKeys.detail(variables.id) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: recurrenceKeys.lists() });
      // Invalidate events since they were updated
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({
        predicate: (query) => isUpcomingOrTodayEventQuery(query.queryKey),
      });
      // Invalidate all calendar queries
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === eventKeys.all[0] &&
          query.queryKey[1] === 'calendar',
      });
    },
  });
};

/**
 * Hook to delete a recurrence rule
 */
export const useDeleteRecurrenceRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await recurrenceService.deleteRule(id);
      if (!response.success) {
        const errorMsg = typeof response.error === 'string' ? response.error : response.error?.message;
        throw new Error(errorMsg || 'Failed to delete recurrence rule');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all recurrence queries
      queryClient.invalidateQueries({ queryKey: recurrenceKeys.all });
      // Invalidate events since they were deleted
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({
        predicate: (query) => isUpcomingOrTodayEventQuery(query.queryKey),
      });
      // Invalidate all calendar queries
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === eventKeys.all[0] &&
          query.queryKey[1] === 'calendar',
      });
    },
  });
};

/**
 * Hook to regenerate events for a recurrence rule
 */
export const useRegenerateRecurrenceEvents = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await recurrenceService.regenerateEvents(id);
      if (!response.success || !response.data) {
        const errorMsg = typeof response.error === 'string' ? response.error : response.error?.message;
        throw new Error(errorMsg || 'Failed to regenerate events');
      }
      return response.data;
    },
    onSuccess: (data, id) => {
      // Invalidate specific rule events
      queryClient.invalidateQueries({ queryKey: recurrenceKeys.events(id) });
      // Invalidate all events
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({
        predicate: (query) => isUpcomingOrTodayEventQuery(query.queryKey),
      });
    },
  });
};

/**
 * Hook to add an exception to a recurrence rule
 */
export const useAddRecurrenceException = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, date }: { id: string; date: string }) => {
      const response = await recurrenceService.addException(id, date);
      if (!response.success || !response.data) {
        const errorMsg = typeof response.error === 'string' ? response.error : response.error?.message;
        throw new Error(errorMsg || 'Failed to add exception');
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate events
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({
        predicate: (query) => isUpcomingOrTodayEventQuery(query.queryKey),
      });
      // Invalidate specific rule events
      queryClient.invalidateQueries({ queryKey: recurrenceKeys.events(variables.id) });
    },
  });
};
