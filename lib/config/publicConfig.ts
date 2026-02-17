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

export const PUBLIC_CONFIG: PublicConfig = {
  revenuecat: {
    iosApiKey:
      process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ??
      process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ??
      '',
    androidApiKey:
      process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ??
      process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ??
      '',
    entitlementId: process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID ?? 'pro',
  },
  legal: {
    privacyUrl: process.env.EXPO_PUBLIC_PRIVACY_URL ?? null,
    termsUrl: process.env.EXPO_PUBLIC_TERMS_URL ?? null,
  },
  posthog: {
    apiKey: process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? '',
    host: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
  },
};
