import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { petService } from '../services/petService';
import type { CreatePetInput, Pet, QueryFilters, UpdatePetInput } from '../types';
import { CACHE_TIMES } from '../config/queryConfig';
import { ENV } from '../config/env';
import { useCreateResource, useDeleteResource, useUpdateResource } from './useCrud';
import { createQueryKeys } from './core/createQueryKeys';
import { useResource } from './core/useResource';
import { useConditionalQuery } from './core/useConditionalQuery';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';

interface PetFilters extends QueryFilters {
  search?: string;
  type?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'type';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

const basePetKeys = createQueryKeys('pets');

export const petKeys = {
  ...basePetKeys,
  stats: () => [...basePetKeys.all, 'stats'] as const,
  byType: (type: string) => [...basePetKeys.all, 'type', type] as const,
  infinite: (filters?: Omit<PetFilters, 'page'>) => [...basePetKeys.all, 'infinite', filters] as const,
};

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
  return useConditionalQuery<Pet[]>({
    queryKey: petKeys.search(query),
    queryFn: () => petService.searchPets(query),
    staleTime: CACHE_TIMES.SHORT,
    enabled: !!query && query.trim().length > 0,
    defaultValue: [],
    errorMessage: 'Arama yapılamadı',
  });
}

export function usePetsByType(type: string) {
  return useConditionalQuery<Pet[]>({
    queryKey: petKeys.byType(type),
    queryFn: () => petService.getPetsByType(type),
    staleTime: CACHE_TIMES.MEDIUM,
    enabled: !!type,
    defaultValue: [],
    errorMessage: 'Evcil hayvanlar yüklenemedi',
  });
}

export function usePet(id: string) {
  return useResource<Pet>({
    queryKey: petKeys.detail(id),
    queryFn: () => petService.getPetById(id),
    staleTime: CACHE_TIMES.LONG,
    enabled: !!id,
    errorMessage: 'Pet yüklenemedi',
  });
}

export function usePetStats() {
  return useQuery({
    queryKey: petKeys.stats(),
    queryFn: () => petService.getPetStats(),
    staleTime: CACHE_TIMES.LONG,
    refetchInterval: CACHE_TIMES.MEDIUM,
  });
}

export function useCreatePet() {
  const queryClient = useQueryClient();

  return useCreateResource<Pet, CreatePetInput>(
    (data) => petService.createPet(data).then(res => res.data!),
    {
      listQueryKey: petKeys.lists(),
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: petKeys.all });
      },
    }
  );
}

export function useUpdatePet() {
  const queryClient = useQueryClient();

  return useUpdateResource<Pet, UpdatePetInput>(
    ({ _id, data }) => petService.updatePet(_id, data).then(res => res.data!),
    {
      listQueryKey: petKeys.lists(),
      detailQueryKey: petKeys.detail,
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: petKeys.all });
      },
    }
  );
}

export function useDeletePet() {
  const queryClient = useQueryClient();

  return useDeleteResource<Pet>(
    (_id) => petService.deletePet(_id).then(res => res.data),
    {
      listQueryKey: petKeys.lists(),
      detailQueryKey: petKeys.detail,
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: petKeys.all });
      },
    }
  );
}

export function useUploadPetPhoto() {
  const queryClient = useQueryClient();

  return useUpdateResource<Pet, { profilePhoto: string }>(
    ({ _id, data }) => petService.uploadPetPhoto(_id, data.profilePhoto).then(res => res.data!),
    {
      listQueryKey: petKeys.lists(),
      detailQueryKey: petKeys.detail,
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: petKeys.all });
      },
    }
  );
}

export function useInfinitePets(filters?: Omit<PetFilters, 'page'>) {
  const defaultLimit = ENV.DEFAULT_LIMIT || 20;
  const { enabled } = useAuthQueryEnabled();

  return useInfiniteQuery({
    queryKey: petKeys.infinite(filters),
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
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      if (lastPage.length < defaultLimit) {
        return undefined;
      }
      return (lastPageParam as number) + 1;
    },
    staleTime: CACHE_TIMES.MEDIUM,
    gcTime: CACHE_TIMES.LONG,
    enabled,
  });
}

export type { PetFilters };
