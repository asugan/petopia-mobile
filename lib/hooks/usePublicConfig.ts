import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { CACHE_TIMES } from '@/lib/config/queryConfig';

export type PublicConfig = {
  revenuecat: {
    iosApiKey: string;
    androidApiKey: string;
    entitlementId: string;
  };
  legal: {
    privacyUrl: string | null;
    termsUrl: string | null;
  };
  posthog: {
    apiKey: string;
    host: string;
  };
};

const PUBLIC_CONFIG_QUERY_KEY = ['public-config'] as const;

const fetchPublicConfig = async (): Promise<PublicConfig> => {
  const response = await api.get<PublicConfig>('/api/public-config');

  if (!response.success || !response.data) {
    const message =
      typeof response.error === 'object' && response.error?.message
        ? response.error.message
        : response.message ?? 'Failed to load public config';
    throw new Error(message);
  }

  return response.data;
};

export const usePublicConfig = () => {
  return useQuery({
    queryKey: PUBLIC_CONFIG_QUERY_KEY,
    queryFn: fetchPublicConfig,
    staleTime: CACHE_TIMES.ONE_HOUR,
    gcTime: CACHE_TIMES.ONE_HOUR,
  });
};
