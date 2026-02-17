import type { QueryFilters } from '@/lib/types';

export const createQueryKeys = (entity: string) => ({
  all: [entity] as const,
  lists: () => [...createQueryKeys(entity).all, 'list'] as const,
  list: (filters?: QueryFilters) => [...createQueryKeys(entity).lists(), filters] as const,
  details: () => [...createQueryKeys(entity).all, 'detail'] as const,
  detail: (id: string) => [...createQueryKeys(entity).details(), id] as const,
  search: (query: string) => [...createQueryKeys(entity).all, 'search', query] as const,
});
