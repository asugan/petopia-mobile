import { QueryKey, useMutation, useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: options.listQueryKey });

      // Snapshot the previous value
      const previousList = queryClient.getQueryData<T[]>(options.listQueryKey);

      // Optimistically update to the new value
      const tempId = `temp-${Date.now()}`;
      const tempItem = {
        ...newData,
        _id: tempId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as T;

      queryClient.setQueryData<T[]>(options.listQueryKey, (old) =>
        old ? [...old, tempItem] : [tempItem]
      );

      return { previousList };
    },
    onError: (_err, _newData, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(options.listQueryKey, context.previousList);
      }
    },
    onSuccess: options.onSuccess,
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({ queryKey: options.listQueryKey });
      if (options.onSettled) {
        options.onSettled(data, error, variables, context);
      }
    },
  });
}

export function useUpdateResource<T extends BaseResource, Input>(
  mutationFn: (params: { _id: string; data: Input }) => Promise<T>,
  options: CrudOptions<T, { _id: string; data: Input }, { previousList: T[] | undefined; previousDetail: T | undefined }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async ({ _id, data }) => {
      await queryClient.cancelQueries({ queryKey: options.listQueryKey });
      if (options.detailQueryKey) {
        await queryClient.cancelQueries({ queryKey: options.detailQueryKey(_id) });
      }

      const previousList = queryClient.getQueryData<T[]>(options.listQueryKey);
      const previousDetail = options.detailQueryKey
        ? queryClient.getQueryData<T>(options.detailQueryKey(_id))
        : undefined;

      // Optimistically update detail
      if (options.detailQueryKey) {
        queryClient.setQueryData<T>(options.detailQueryKey(_id), (old) =>
          old
            ? { ...old, ...data, updatedAt: new Date().toISOString() }
            : undefined
        );
      }

      // Optimistically update list
      queryClient.setQueryData<T[]>(options.listQueryKey, (old) => {
        if (!old) return old;
        return old.map((item) =>
          item._id === _id
            ? { ...item, ...data, updatedAt: new Date().toISOString() }
            : item
        );
      });

      return { previousList, previousDetail };
    },
    onError: (_err, { _id }, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(options.listQueryKey, context.previousList);
      }
      if (context?.previousDetail && options.detailQueryKey) {
        queryClient.setQueryData(options.detailQueryKey(_id), context.previousDetail);
      }
    },
    onSuccess: options.onSuccess,
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({ queryKey: options.listQueryKey });
      if (options.detailQueryKey) {
        queryClient.invalidateQueries({ queryKey: options.detailQueryKey(variables._id) });
      }
      if (options.onSettled) {
        options.onSettled(data, error, variables, context);
      }
    },
  });
}

export function useDeleteResource<T extends BaseResource>(
  mutationFn: (_id: string) => Promise<void | string>,
  options: DeleteCrudOptions<{ previousList: T[] | undefined }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (_id) => {
      await queryClient.cancelQueries({ queryKey: options.listQueryKey });

      const previousList = queryClient.getQueryData<T[]>(options.listQueryKey);

      queryClient.setQueryData<T[]>(options.listQueryKey, (old) =>
        old?.filter((item) => item._id !== _id)
      );

      return { previousList };
    },
    onError: (_err, _id, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(options.listQueryKey, context.previousList);
      }
    },
    onSuccess: (data, variables, context) => {
       // Remove detail query if it exists
       if (options.detailQueryKey) {
         queryClient.removeQueries({ queryKey: options.detailQueryKey(variables) });
       }
       if (options.onSuccess) {
         options.onSuccess(data, variables, context);
       }
    },
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({ queryKey: options.listQueryKey });
      if (options.onSettled) {
        options.onSettled(data, error, variables, context);
      }
    },
  });
}
