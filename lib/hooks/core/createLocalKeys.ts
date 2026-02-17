import type { QueryFilters } from '@/lib/types';

export const createLocalKeys = (entity: string) => ({
  all: [entity] as const,
  lists: () => [...createLocalKeys(entity).all, 'list'] as const,
  list: (filters?: QueryFilters) => [...createLocalKeys(entity).lists(), filters] as const,
  details: () => [...createLocalKeys(entity).all, 'detail'] as const,
  detail: (id: string) => [...createLocalKeys(entity).details(), id] as const,
  search: (query: string) => [...createLocalKeys(entity).all, 'search', query] as const,
});
