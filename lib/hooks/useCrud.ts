import { QueryKey } from './core/types';
import { useLocalMutation } from './core/useLocalAsync';

interface BaseResource {
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CrudOptions<T, Variables = unknown, Context = unknown> {
  listQueryKey: QueryKey;
  detailQueryKey?: (id: string) => QueryKey;
  onSuccess?: (data: T, variables: Variables, context: Context) => void;
  onSettled?: (data: T | undefined, error: Error | null, variables: Variables, context: Context | undefined) => void;
}

interface DeleteCrudOptions<Context = unknown> {
  listQueryKey: QueryKey;
  detailQueryKey?: (id: string) => QueryKey;
  onSuccess?: (data: void | string, variables: string, context: Context) => void;
  onSettled?: (data: void | string | undefined, error: Error | null, variables: string, context: Context | undefined) => void;
}

export function useCreateResource<T extends BaseResource, Input>(
  mutationFn: (data: Input) => Promise<T>,
  options: CrudOptions<T, Input, { previousList: T[] | undefined }>
) {
  return useLocalMutation<T, Input>({
    mutationFn,
    onSuccess: (data, variables) => {
      options.onSuccess?.(data, variables, { previousList: undefined });
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables, { previousList: undefined });
    },
  });
}

export function useUpdateResource<T extends BaseResource, Input>(
  mutationFn: (params: { _id: string; data: Input }) => Promise<T>,
  options: CrudOptions<T, { _id: string; data: Input }, { previousList: T[] | undefined; previousDetail: T | undefined }>
) {
  return useLocalMutation<T, { _id: string; data: Input }>({
    mutationFn,
    onSuccess: (data, variables) => {
      options.onSuccess?.(data, variables, {
        previousList: undefined,
        previousDetail: undefined,
      });
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables, {
        previousList: undefined,
        previousDetail: undefined,
      });
    },
  });
}

export function useDeleteResource<T extends BaseResource>(
  mutationFn: (_id: string) => Promise<void | string>,
  options: DeleteCrudOptions<{ previousList: T[] | undefined }>
) {
  return useLocalMutation<void | string, string>({
    mutationFn,
    onSuccess: (data, variables) => {
      options.onSuccess?.(data, variables, { previousList: undefined });
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables, { previousList: undefined });
    },
  });
}
