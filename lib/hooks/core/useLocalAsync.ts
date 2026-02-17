import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

let localDataVersion = 0;
const localDataListeners = new Set<() => void>();

export const notifyLocalDataChanged = () => {
  localDataVersion += 1;
  localDataListeners.forEach((listener) => listener());
};

export const useLocalDataVersion = () => {
  const [version, setVersion] = useState(localDataVersion);

  useEffect(() => {
    const listener = () => setVersion(localDataVersion);
    localDataListeners.add(listener);
    return () => {
      localDataListeners.delete(listener);
    };
  }, []);

  return version;
};

export type LocalMutationCallbacks<TData, TVariables> = {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
};

export type LocalMutationResult<TData, TVariables> = {
  data: TData | undefined;
  error: Error | null;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  mutate: (variables: TVariables, callbacks?: LocalMutationCallbacks<TData, TVariables>) => void;
  mutateAsync: (variables: TVariables, callbacks?: LocalMutationCallbacks<TData, TVariables>) => Promise<TData>;
  reset: () => void;
};

type UseLocalMutationOptions<TData, TVariables> = {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
  notifyOnSuccess?: boolean;
};

export function useLocalMutation<TData, TVariables>(
  options: UseLocalMutationOptions<TData, TVariables>
): LocalMutationResult<TData, TVariables> {
  const [data, setData] = useState<TData | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const mutateAsync = useCallback(
    async (
      variables: TVariables,
      callbacks?: LocalMutationCallbacks<TData, TVariables>
    ) => {
      setIsPending(true);
      setError(null);
      setIsSuccess(false);

      try {
        const result = await options.mutationFn(variables);
        setData(result);
        setIsSuccess(true);

        options.onSuccess?.(result, variables);
        callbacks?.onSuccess?.(result, variables);
        if (options.notifyOnSuccess ?? true) {
          notifyLocalDataChanged();
        }
        options.onSettled?.(result, null, variables);
        callbacks?.onSettled?.(result, null, variables);

        return result;
      } catch (mutationError) {
        const normalizedError =
          mutationError instanceof Error
            ? mutationError
            : new Error('Islem basarisiz oldu');

        setError(normalizedError);

        options.onError?.(normalizedError, variables);
        callbacks?.onError?.(normalizedError, variables);
        options.onSettled?.(undefined, normalizedError, variables);
        callbacks?.onSettled?.(undefined, normalizedError, variables);

        throw normalizedError;
      } finally {
        setIsPending(false);
      }
    },
    [options]
  );

  const mutate = useCallback(
    (
      variables: TVariables,
      callbacks?: LocalMutationCallbacks<TData, TVariables>
    ) => {
      void mutateAsync(variables, callbacks);
    },
    [mutateAsync]
  );

  const reset = useCallback(() => {
    setData(undefined);
    setError(null);
    setIsPending(false);
    setIsSuccess(false);
  }, []);

  return {
    data,
    error,
    isPending,
    isSuccess,
    isError: !!error,
    mutate,
    mutateAsync,
    reset,
  };
}

type UseLocalQueryOptions<TData> = {
  enabled?: boolean;
  defaultValue: TData;
  queryFn: () => Promise<TData>;
  deps?: readonly unknown[];
  refetchInterval?: number | false;
};

export type LocalQueryResult<TData> = {
  data: TData;
  error: Error | null;
  isLoading: boolean;
  isFetching: boolean;
  isRefetching: boolean;
  isError: boolean;
  isSuccess: boolean;
  refetch: () => Promise<TData | undefined>;
};

export function useLocalQuery<TData>(
  options: UseLocalQueryOptions<TData>
): LocalQueryResult<TData> {
  const {
    enabled = true,
    defaultValue,
    queryFn,
    deps = [],
    refetchInterval = false,
  } = options;

  const [data, setData] = useState<TData>(defaultValue);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isFetching, setIsFetching] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);
  const hasLoadedRef = useRef(false);
  const requestIdRef = useRef(0);
  const dataVersion = useLocalDataVersion();
  const queryFnRef = useRef(queryFn);

  useEffect(() => {
    queryFnRef.current = queryFn;
  }, [queryFn]);

  const runQuery = useCallback(
    async (isManualRefetch: boolean) => {
      if (!enabled) {
        setIsLoading(false);
        setIsFetching(false);
        setIsRefetching(false);
        return undefined;
      }

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      if (!hasLoadedRef.current) {
        setIsLoading(true);
      }

      setIsFetching(true);
      setIsRefetching(isManualRefetch || hasLoadedRef.current);
      setError(null);

      try {
        const result = await queryFnRef.current();

        if (requestIdRef.current === requestId) {
          setData(result);
          hasLoadedRef.current = true;
        }

        return result;
      } catch (queryError) {
        const normalizedError =
          queryError instanceof Error
            ? queryError
            : new Error('Veri yuklenemedi');

        if (requestIdRef.current === requestId) {
          setError(normalizedError);
        }

        return undefined;
      } finally {
        if (requestIdRef.current === requestId) {
          setIsLoading(false);
          setIsFetching(false);
          setIsRefetching(false);
        }
      }
    },
    [enabled]
  );

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    void runQuery(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, dataVersion, runQuery, ...deps]);

  useEffect(() => {
    if (!enabled || !refetchInterval) {
      return;
    }

    const intervalId = setInterval(() => {
      void runQuery(true);
    }, refetchInterval);

    return () => clearInterval(intervalId);
  }, [enabled, refetchInterval, runQuery]);

  const refetch = useCallback(async () => {
    return runQuery(true);
  }, [runQuery]);

  return useMemo(
    () => ({
      data,
      error,
      isLoading,
      isFetching,
      isRefetching,
      isError: !!error,
      isSuccess: !isLoading && !error,
      refetch,
    }),
    [data, error, isLoading, isFetching, isRefetching, refetch]
  );
}

type UseLocalInfiniteQueryOptions<TPage, TPageParam> = {
  enabled?: boolean;
  initialPageParam: TPageParam;
  queryFn: (context: { pageParam: TPageParam }) => Promise<TPage>;
  getNextPageParam: (
    lastPage: TPage,
    allPages: TPage[],
    lastPageParam: TPageParam
  ) => TPageParam | undefined;
  deps?: readonly unknown[];
};

type LocalInfiniteData<TPage, TPageParam> = {
  pages: TPage[];
  pageParams: TPageParam[];
};

export type LocalInfiniteQueryResult<TPage, TPageParam> = {
  data: LocalInfiniteData<TPage, TPageParam> | undefined;
  error: Error | null;
  isLoading: boolean;
  isFetching: boolean;
  isRefetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => Promise<TPage | undefined>;
  refetch: () => Promise<TPage | undefined>;
};

export function useLocalInfiniteQuery<TPage, TPageParam>(
  options: UseLocalInfiniteQueryOptions<TPage, TPageParam>
): LocalInfiniteQueryResult<TPage, TPageParam> {
  const {
    enabled = true,
    initialPageParam,
    queryFn,
    getNextPageParam,
    deps = [],
  } = options;
  const dataVersion = useLocalDataVersion();

  const [data, setData] = useState<LocalInfiniteData<TPage, TPageParam> | undefined>(
    undefined
  );
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isFetching, setIsFetching] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const hasLoadedRef = useRef(false);
  const requestIdRef = useRef(0);
  const queryFnRef = useRef(queryFn);
  const getNextPageParamRef = useRef(getNextPageParam);

  useEffect(() => {
    queryFnRef.current = queryFn;
  }, [queryFn]);

  useEffect(() => {
    getNextPageParamRef.current = getNextPageParam;
  }, [getNextPageParam]);

  const loadPage = useCallback(async (pageParam: TPageParam) => {
      const nextRequestId = requestIdRef.current + 1;
      requestIdRef.current = nextRequestId;

      try {
        return await queryFnRef.current({ pageParam });
      } catch (queryError) {
        const normalizedError =
          queryError instanceof Error
            ? queryError
            : new Error('Veriler yuklenemedi');
        setError(normalizedError);
        return undefined;
      }
    }, []);

  const refetch = useCallback(async () => {
    if (!enabled) {
      return undefined;
    }

    if (hasLoadedRef.current) {
      setIsRefetching(true);
    } else {
      setIsLoading(true);
    }
    setIsFetching(true);
    setError(null);

    const firstPage = await loadPage(initialPageParam);
    if (firstPage === undefined) {
      setIsLoading(false);
      setIsFetching(false);
      setIsRefetching(false);
      return undefined;
    }

    setData({ pages: [firstPage], pageParams: [initialPageParam] });
    hasLoadedRef.current = true;
    setIsLoading(false);
    setIsFetching(false);
    setIsRefetching(false);
    return firstPage;
  }, [enabled, initialPageParam, loadPage]);

  const hasNextPage = useMemo(() => {
    if (!data || data.pages.length === 0) {
      return false;
    }
    const lastIndex = data.pages.length - 1;
    const nextPageParam = getNextPageParamRef.current(
      data.pages[lastIndex],
      data.pages,
      data.pageParams[lastIndex]
    );
    return nextPageParam !== undefined;
  }, [data]);

  const fetchNextPage = useCallback(async () => {
    if (!enabled || !data || data.pages.length === 0 || isFetchingNextPage) {
      return undefined;
    }

    const lastIndex = data.pages.length - 1;
    const nextPageParam = getNextPageParamRef.current(
      data.pages[lastIndex],
      data.pages,
      data.pageParams[lastIndex]
    );

    if (nextPageParam === undefined) {
      return undefined;
    }

    setIsFetching(true);
    setIsFetchingNextPage(true);
    setError(null);

    const nextPage = await loadPage(nextPageParam);
    if (nextPage === undefined) {
      setIsFetching(false);
      setIsFetchingNextPage(false);
      return undefined;
    }

    setData((previous) => {
      if (!previous) {
        return { pages: [nextPage], pageParams: [nextPageParam] };
      }

      return {
        pages: [...previous.pages, nextPage],
        pageParams: [...previous.pageParams, nextPageParam],
      };
    });

    setIsFetching(false);
    setIsFetchingNextPage(false);
    return nextPage;
  }, [data, enabled, isFetchingNextPage, loadPage]);

  useEffect(() => {
    if (!enabled) {
      setData(undefined);
      setIsLoading(false);
      setIsFetching(false);
      setIsRefetching(false);
      setIsFetchingNextPage(false);
      return;
    }

    void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, dataVersion, refetch, ...deps]);

  return {
    data,
    error,
    isLoading,
    isFetching,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  };
}
