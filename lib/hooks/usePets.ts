import { petService } from '../services/petService';
import type { CreatePetInput, Pet, QueryFilters, UpdatePetInput } from '../types';
import { CACHE_TIMES } from '../config/cacheTimes';
import { ENV } from '../config/env';
import { useCreateResource, useDeleteResource, useUpdateResource } from './useCrud';
import { useResource } from './core/useResource';
import { useConditionalQuery } from './core/useConditionalQuery';
import { useLocalInfiniteQuery } from './core/useLocalAsync';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';
import { petKeys } from './queryKeys';

export { petKeys } from './queryKeys';

interface PetFilters extends QueryFilters {
  search?: string;
  type?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'type';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export function usePets(filters: PetFilters = {}) {
  const { enabled } = useAuthQueryEnabled();

  return useConditionalQuery<Pet[]>({
    queryKey: petKeys.list(filters),
    queryFn: () => petService.getPets(filters),
    enabled,
    staleTime: CACHE_TIMES.MEDIUM,
    defaultValue: [],
    errorMessage: 'Evcil hayvanlar yüklenemedi',
    select: filters.sortBy ? (data) => {
      return [...data].sort((a, b) => {
        const aValue = a[filters.sortBy!];
        const bValue = b[filters.sortBy!];

        if (filters.sortOrder === 'desc') {
          return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
        }
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      });
    } : undefined,
  });
}

export function useSearchPets(query: string) {
  const { enabled } = useAuthQueryEnabled();

  return useConditionalQuery<Pet[]>({
    queryKey: petKeys.search(query),
    queryFn: () => petService.searchPets(query),
    staleTime: CACHE_TIMES.SHORT,
    enabled: enabled && !!query && query.trim().length > 0,
    defaultValue: [],
    errorMessage: 'Arama yapılamadı',
  });
}

export function usePetsByType(type: string) {
  const { enabled } = useAuthQueryEnabled();

  return useConditionalQuery<Pet[]>({
    queryKey: petKeys.byType(type),
    queryFn: () => petService.getPetsByType(type),
    staleTime: CACHE_TIMES.MEDIUM,
    enabled: enabled && !!type,
    defaultValue: [],
    errorMessage: 'Evcil hayvanlar yüklenemedi',
  });
}

export function usePet(id: string) {
  const { enabled } = useAuthQueryEnabled();

  return useResource<Pet>({
    queryKey: petKeys.detail(id),
    queryFn: () => petService.getPetById(id),
    staleTime: CACHE_TIMES.LONG,
    enabled: enabled && !!id,
    errorMessage: 'Pet yüklenemedi',
  });
}

export function usePetStats() {
  const { enabled } = useAuthQueryEnabled();

  return useConditionalQuery<{
    total: number;
    byType: Record<string, number>;
    byGender: Record<string, number>;
    averageAge: number;
  }>({
    queryKey: petKeys.stats(),
    queryFn: () => petService.getPetStats(),
    staleTime: CACHE_TIMES.MEDIUM,
    refetchInterval: CACHE_TIMES.MEDIUM,
    enabled,
    defaultValue: {
      total: 0,
      byType: {},
      byGender: {},
      averageAge: 0,
    },
  });
}

export function useCreatePet() {
  return useCreateResource<Pet, CreatePetInput>(
    (data) => petService.createPet(data).then(res => res.data!),
    {
      listQueryKey: petKeys.lists(),
    }
  );
}

export function useUpdatePet() {
  return useUpdateResource<Pet, UpdatePetInput>(
    ({ _id, data }) => petService.updatePet(_id, data).then(res => res.data!),
    {
      listQueryKey: petKeys.lists(),
      detailQueryKey: petKeys.detail,
    }
  );
}

export function useDeletePet() {
  return useDeleteResource<Pet>(
    (_id) => petService.deletePet(_id).then(res => res.data),
    {
      listQueryKey: petKeys.lists(),
      detailQueryKey: petKeys.detail,
    }
  );
}

export function useUploadPetPhoto() {
  return useUpdateResource<Pet, { profilePhoto: string }>(
    ({ _id, data }) => petService.uploadPetPhoto(_id, data.profilePhoto).then(res => res.data!),
    {
      listQueryKey: petKeys.lists(),
      detailQueryKey: petKeys.detail,
    }
  );
}

export function useInfinitePets(filters?: Omit<PetFilters, 'page'>) {
  const defaultLimit = ENV.DEFAULT_LIMIT || 20;
  const { enabled } = useAuthQueryEnabled();

  return useLocalInfiniteQuery<Pet[], number>({
    queryFn: async ({ pageParam = 1 }) => {
      const queryFilters: {
        page: number;
        limit: number;
        sortBy: string;
        sortOrder: 'asc' | 'desc';
        type?: string;
        search?: string;
      } = {
        page: pageParam,
        limit: defaultLimit,
        sortBy: (filters?.sortBy as 'name' | 'createdAt' | 'updatedAt' | 'type' | undefined) ?? 'createdAt',
        sortOrder: (filters?.sortOrder as 'asc' | 'desc' | undefined) ?? 'desc',
      };

      if (filters?.type) queryFilters.type = filters.type as string;
      if (filters?.search) queryFilters.search = filters.search as string;

      const result = await petService.getPets(queryFilters);

      if (!result.success) {
        const errorMessage = typeof result.error === 'string' ? result.error : result.error?.message || 'Pet yüklenemedi';
        throw new Error(errorMessage);
      }

      return result.data!;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.length < defaultLimit) {
        return undefined;
      }
      return (lastPageParam as number) + 1;
    },
    enabled,
    deps: [JSON.stringify(petKeys.infinite(filters))],
  });
}

export type { PetFilters };
