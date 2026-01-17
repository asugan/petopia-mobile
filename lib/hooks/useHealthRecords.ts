import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { healthRecordService } from '../services/healthRecordService';
import { petService } from '../services/petService';
import type { CreateHealthRecordInput, HealthRecord, Pet, UpdateHealthRecordInput } from '../types';
import { CACHE_TIMES } from '../config/queryConfig';
import { useCreateResource, useDeleteResource, useUpdateResource } from './useCrud';
import { createQueryKeys } from './core/createQueryKeys';
import { useResource } from './core/useResource';
import { useConditionalQuery } from './core/useConditionalQuery';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';
import { expenseKeys } from './useExpenses';

// Type-safe filters for health records
interface HealthRecordFilters {
  type?: string;
  veterinarian?: string;
  sortBy?: 'date' | 'type' | 'veterinarian' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// Query keys factory
const baseHealthRecordKeys = createQueryKeys('health-records');

// Extended query keys with custom keys
export const healthRecordKeys = {
  ...baseHealthRecordKeys,
  list: (petId: string, filters?: HealthRecordFilters) =>
    [...baseHealthRecordKeys.lists(), petId, filters] as const,
  byType: (petId: string, type: string) => [...baseHealthRecordKeys.all, 'type', petId, type] as const,
  byDateRange: (petId: string, dateFrom: string, dateTo: string) =>
    [...baseHealthRecordKeys.all, 'date-range', petId, dateFrom, dateTo] as const,
};

// Get all health records for a pet with type-safe filters
// Note: This hook has complex client-side sorting logic,
// so it uses useQuery directly instead of generic hooks
export function useHealthRecords(petId?: string, filters: HealthRecordFilters = {}) {
  const { enabled } = useAuthQueryEnabled();

  return useQuery({
    queryKey: healthRecordKeys.list(petId || 'all', filters),
    queryFn: async () => {
      if (!petId) {
        // If no petId, fetch all pets and combine their records
        const petsResult = await petService.getPets();
        if (!petsResult.success) {
          throw new Error('Pets could not be loaded');
        }

        const pets = petsResult.data || [];
        const allRecords = await Promise.all(
          pets.map(async (pet: Pet) => {
            const result = await healthRecordService.getHealthRecordsByPetId(pet._id);
            return result.success ? (result.data || []) : [];
          })
        );

        return allRecords.flat();
      } else {
        const result = await healthRecordService.getHealthRecordsByPetId(petId);
        if (!result.success) {
          const errorMessage = typeof result.error === 'string'
            ? result.error
            : result.error?.message || 'Sağlık kayıtları yüklenemedi';
          throw new Error(errorMessage);
        }
        return result.data || [];
      }
    },
    staleTime: CACHE_TIMES.MEDIUM,
    enabled,
    select: (data) => {
      // Apply client-side sorting if specified
      if (filters.sortBy) {
        return [...data].sort((a, b) => {
          const aValue = a[filters.sortBy!];
          const bValue = b[filters.sortBy!];

          if (aValue === undefined || bValue === undefined) return 0;

          if (filters.sortOrder === 'desc') {
            return String(bValue) > String(aValue) ? 1 : String(bValue) < String(aValue) ? -1 : 0;
          }
          return String(aValue) > String(bValue) ? 1 : String(aValue) < String(bValue) ? -1 : 0;
        });
      }
      return data;
    },
  });
}


// Get a single health record by ID
export function useHealthRecord(id: string) {
  const { enabled } = useAuthQueryEnabled();

  return useResource<HealthRecord>({
    queryKey: healthRecordKeys.detail(id),
    queryFn: () => healthRecordService.getHealthRecordById(id),
    staleTime: CACHE_TIMES.LONG,
    enabled: enabled && !!id,
    errorMessage: 'Sağlık kaydı yüklenemedi',
  });
}

// Get all health records for all pets (for homepage overview)
export function useAllPetsHealthRecords(petIds: string[]) {
  const { enabled } = useAuthQueryEnabled();

  const queries = useQueries({
    queries: petIds.map(petId => ({
      queryKey: healthRecordKeys.list(petId),
      queryFn: async () => {
        const result = await healthRecordService.getHealthRecordsByPetId(petId);
        if (!result.success) {
          return [];
        }
        return result.data || [];
      },
      staleTime: CACHE_TIMES.MEDIUM,
      enabled: enabled && !!petId,
    })),
  });

  // Combine all results from all pets
  const allRecords = queries
    .filter(q => q.data && Array.isArray(q.data))
    .flatMap(q => q.data as HealthRecord[])
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return {
    data: allRecords,
    isLoading: queries.some(q => q.isLoading),
    isError: queries.some(q => q.isError),
  };
}

// Get health records by type
export function useHealthRecordsByType(petId: string, type: string) {
  const { enabled } = useAuthQueryEnabled();

  return useConditionalQuery<HealthRecord[]>({
    queryKey: healthRecordKeys.byType(petId, type),
    queryFn: () => healthRecordService.getHealthRecordsByType(petId, type),
    staleTime: CACHE_TIMES.MEDIUM,
    enabled: enabled && !!petId && !!type,
    defaultValue: [],
    errorMessage: 'Sağlık kayıtları yüklenemedi',
  });
}

// Get health records by date range (using existing service method)
export function useHealthRecordsByDateRange(petId: string, dateFrom: string, dateTo: string) {
  const { enabled } = useAuthQueryEnabled();

  return useConditionalQuery<HealthRecord[]>({
    queryKey: healthRecordKeys.byDateRange(petId, dateFrom, dateTo),
    queryFn: () => healthRecordService.getHealthRecordsByPetId(petId),
    staleTime: CACHE_TIMES.MEDIUM,
    enabled: enabled && !!petId && !!dateFrom && !!dateTo,
    defaultValue: [],
    errorMessage: 'Sağlık kayıtları yüklenemedi',
    select: (allRecords) => {
      // Filter by date range on client side
      return allRecords.filter((record: HealthRecord) => {
        const recordDate = new Date(record.date);
        const fromDate = new Date(dateFrom);
        const toDate = new Date(dateTo);
        return recordDate >= fromDate && recordDate <= toDate;
      });
    },
  });
}

// Create health record mutation with optimistic updates
export function useCreateHealthRecord() {
  const queryClient = useQueryClient();

  return useCreateResource<HealthRecord, CreateHealthRecordInput>(
    (data) => healthRecordService.createHealthRecord(data).then(res => res.data!),
    {
      listQueryKey: healthRecordKeys.lists(),
      onSettled: (newRecord) => {
        if (newRecord) {
          queryClient.invalidateQueries({ queryKey: healthRecordKeys.list(newRecord.petId) });
          queryClient.invalidateQueries({ queryKey: healthRecordKeys.lists() });
        }
        queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      },
    }
  );
}

// Update health record mutation with optimistic updates
export function useUpdateHealthRecord() {
  const queryClient = useQueryClient();

  return useUpdateResource<HealthRecord, UpdateHealthRecordInput>(
    ({ _id, data }) => healthRecordService.updateHealthRecord(_id, data).then(res => res.data!),
    {
      listQueryKey: healthRecordKeys.lists(),
      detailQueryKey: healthRecordKeys.detail,
      onSettled: (data) => {
        queryClient.invalidateQueries({ queryKey: healthRecordKeys.lists() });
        if (data) {
            queryClient.invalidateQueries({ queryKey: healthRecordKeys.detail(data._id) });
        }
        queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      },
    }
  );
}

// Delete health record mutation with optimistic updates
export function useDeleteHealthRecord() {
  const queryClient = useQueryClient();

  return useDeleteResource<HealthRecord>(
    (id) => healthRecordService.deleteHealthRecord(id).then(res => res.data),
    {
      listQueryKey: healthRecordKeys.lists(),
      detailQueryKey: healthRecordKeys.detail,
      onSuccess: (data, id) => {
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: healthRecordKeys.lists() });
        queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      },
    }
  );
}

// Export type for external use
export type { HealthRecordFilters };
