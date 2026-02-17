import type { ApiResponse } from '@/lib/contracts/api';

interface UnwrapOptions<TData> {
  defaultValue?: TData | null;
  errorMessage?: string;
}

export async function unwrapApiResponse<TData>(
  responsePromise: Promise<ApiResponse<TData>>,
  options: UnwrapOptions<TData> = {}
): Promise<TData | null> {
  const { defaultValue = null, errorMessage } = options;
  const result = await responsePromise;

  if (!result.success) {
    const extractedError =
      typeof result.error === 'string'
        ? result.error
        : result.error?.message || errorMessage || 'Veri yuklenemedi';
    throw new Error(extractedError);
  }

  return (result.data ?? defaultValue) as TData | null;
}
