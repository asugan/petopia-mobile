export type RevenueCatConfig = {
  iosApiKey: string;
  androidApiKey: string;
  entitlementId: string;
};

const buildEnvConfig = (): RevenueCatConfig | null => {
  const sharedApiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? '';
  const iosApiKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? sharedApiKey;
  const androidApiKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? sharedApiKey;
  const entitlementId = process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID ?? 'pro';

  if (!iosApiKey && !androidApiKey) {
    return null;
  }

  return {
    iosApiKey,
    androidApiKey,
    entitlementId,
  };
};

let runtimeConfig: RevenueCatConfig | null = buildEnvConfig();

export const setRevenueCatConfig = (config: RevenueCatConfig) => {
  runtimeConfig = { ...config };
};

export const getRevenueCatConfig = () => runtimeConfig;

const requireRevenueCatConfig = () => {
  if (!runtimeConfig) {
    throw new Error('[RevenueCat] Missing config. Set EXPO_PUBLIC_REVENUECAT_* env vars.');
  }
  return runtimeConfig;
};

export type RevenueCatPlatform = 'ios' | 'android';

export function getRevenueCatApiKey(platform: RevenueCatPlatform): string {
  const config = requireRevenueCatConfig();
  return platform === 'ios' ? config.iosApiKey : config.androidApiKey;
}

export function getRevenueCatEntitlementId(): string {
  return requireRevenueCatConfig().entitlementId;
}

export function getRevenueCatEntitlementIdOptional(): string | null {
  return runtimeConfig?.entitlementId ?? null;
}
