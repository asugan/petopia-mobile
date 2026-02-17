import { healthRecordService } from '../services/healthRecordService';
import { petService } from '../services/petService';
import type { CreateHealthRecordInput, HealthRecord, Pet, UpdateHealthRecordInput } from '../types';
import { CACHE_TIMES } from '../config/cacheTimes';
import { useCreateResource, useDeleteResource, useUpdateResource } from './useCrud';
import { useResource } from './core/useResource';
import { useConditionalQuery } from './core/useConditionalQuery';
import { useLocalQuery } from './core/useLocalAsync';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';
import { healthRecordKeys } from './queryKeys';

export { healthRecordKeys } from './queryKeys';

// Type-safe filters for health records
interface HealthRecordFilters {
  type?: string;
  sortBy?: 'date' | 'type' | 'title';
  sortOrder?: 'asc' | 'desc';
}


// Get all health records for a pet with type-safe filters
// Note: This hook has complex client-side sorting logic,
// so it uses useQuery directly instead of generic hooks
export function useHealthRecords(petId?: string, filters: HealthRecordFilters = {}) {
  const { enabled } = useAuthQueryEnabled();

  return useLocalQuery<HealthRecord[]>({
    enabled,
    defaultValue: [],
    deps: [JSON.stringify(healthRecordKeys.list(petId || 'all', filters))],
    queryFn: async () => {
      let records: HealthRecord[];

      if (!petId) {
        // If no petId, fetch all pets and combine their records
        const petsResult = await petService.getPets();
        if (!petsResult.success) {
          throw new Error('Pets could not be loaded');
        }

        const pets = petsResult.data || [];
        const allRecordsByPet = await Promise.all(
          pets.map(async (pet: Pet) => {
            const result = await healthRecordService.getHealthRecordsByPetId(pet._id);
            return result.success ? (result.data || []) : [];
          })
        );

        records = allRecordsByPet.flat();
      } else {
        const result = await healthRecordService.getHealthRecordsByPetId(petId);
        if (!result.success) {
          const errorMessage = typeof result.error === 'string'
            ? result.error
            : result.error?.message || 'Sağlık kayıtları yüklenemedi';
          throw new Error(errorMessage);
        }
        records = result.data || [];
      }

      // Apply client-side sorting if specified
      if (filters.sortBy) {
        return [...records].sort((a, b) => {
          const aValue = a[filters.sortBy!];
          const bValue = b[filters.sortBy!];

          if (aValue === undefined || bValue === undefined) return 0;

          if (filters.sortOrder === 'desc') {
            return String(bValue) > String(aValue) ? 1 : String(bValue) < String(aValue) ? -1 : 0;
          }
          return String(aValue) > String(bValue) ? 1 : String(aValue) < String(bValue) ? -1 : 0;
        });
      }
      return records;
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

  const query = useLocalQuery<HealthRecord[]>({
    enabled: enabled && petIds.length > 0,
    defaultValue: [],
    deps: [petIds.join('|')],
    queryFn: async () => {
      const recordsByPet = await Promise.all(
        petIds.map(async (petId) => {
          const result = await healthRecordService.getHealthRecordsByPetId(petId);
          if (!result.success) {
            return [];
          }
          return result.data || [];
        })
      );

      return recordsByPet
        .flat()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
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
  return useCreateResource<HealthRecord, CreateHealthRecordInput>(
    (data) => healthRecordService.createHealthRecord(data).then(res => res.data!),
    {
      listQueryKey: healthRecordKeys.lists(),
    }
  );
}

// Update health record mutation with optimistic updates
export function useUpdateHealthRecord() {
  return useUpdateResource<HealthRecord, UpdateHealthRecordInput>(
    ({ _id, data }) => healthRecordService.updateHealthRecord(_id, data).then(res => res.data!),
    {
      listQueryKey: healthRecordKeys.lists(),
      detailQueryKey: healthRecordKeys.detail,
    }
  );
}

// Delete health record mutation with optimistic updates
export function useDeleteHealthRecord() {
  return useDeleteResource<HealthRecord>(
    (id) => healthRecordService.deleteHealthRecord(id).then(res => res.data),
    {
      listQueryKey: healthRecordKeys.lists(),
      detailQueryKey: healthRecordKeys.detail,
    }
  );
}

// Export type for external use
export type { HealthRecordFilters };
