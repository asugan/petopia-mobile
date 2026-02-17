import { petService } from '../services/petService';
import type { CreatePetInput, Pet, QueryFilters, UpdatePetInput } from '../types';
import { ENV } from '../config/env';
import { useCreateResource, useDeleteResource, useUpdateResource } from './useCrud';
import { useResource } from './core/useResource';
import { useConditionalQuery } from './core/useConditionalQuery';
import { useLocalInfiniteQuery } from './core/useLocalAsync';
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
  return useConditionalQuery<Pet[]>({
    deps: [JSON.stringify(petKeys.list(filters))],
    queryFn: () => petService.getPets(filters),
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
    deps: [JSON.stringify(petKeys.search(query))],
    queryFn: () => petService.searchPets(query),
    enabled: !!query && query.trim().length > 0,
    defaultValue: [],
    errorMessage: 'Arama yapılamadı',
  });
}

export function usePetsByType(type: string) {
  return useConditionalQuery<Pet[]>({
    deps: [JSON.stringify(petKeys.byType(type))],
    queryFn: () => petService.getPetsByType(type),
    enabled: !!type,
    defaultValue: [],
    errorMessage: 'Evcil hayvanlar yüklenemedi',
  });
}

export function usePet(id: string) {
  return useResource<Pet>({
    deps: [JSON.stringify(petKeys.detail(id))],
    queryFn: () => petService.getPetById(id),
    enabled: !!id,
    errorMessage: 'Pet yüklenemedi',
  });
}

export function usePetStats() {
  return useConditionalQuery<{
    total: number;
    byType: Record<string, number>;
    byGender: Record<string, number>;
    averageAge: number;
  }>({
    deps: [JSON.stringify(petKeys.stats())],
    queryFn: () => petService.getPetStats(),
    refetchInterval: 5 * 60 * 1000,
    defaultValue: {
      total: 0,
      byType: {},
      byGender: {},
      averageAge: 0,
    },
  });
}

export function useCreatePet() {
  return useCreateResource<Pet, CreatePetInput>((data) =>
    petService.createPet(data).then((res) => res.data!)
  );
}

export function useUpdatePet() {
  return useUpdateResource<Pet, UpdatePetInput>(({ _id, data }) =>
    petService.updatePet(_id, data).then((res) => res.data!)
  );
}

export function useDeletePet() {
  return useDeleteResource<Pet>((_id) =>
    petService.deletePet(_id).then((res) => res.data)
  );
}

export function useUploadPetPhoto() {
  return useUpdateResource<Pet, { profilePhoto: string }>(({ _id, data }) =>
    petService.uploadPetPhoto(_id, data.profilePhoto).then((res) => res.data!)
  );
}

export function useInfinitePets(filters?: Omit<PetFilters, 'page'>) {
  const defaultLimit = ENV.DEFAULT_LIMIT || 20;

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
    deps: [JSON.stringify(petKeys.infinite(filters))],
  });
}

export type { PetFilters };
