export type RevenueCatConfig = {
  iosApiKey: string;
  androidApiKey: string;
  entitlementId: string;
};

let runtimeConfig: RevenueCatConfig | null = null;

export const setRevenueCatConfig = (config: RevenueCatConfig) => {
  runtimeConfig = { ...config };
};

export const getRevenueCatConfig = () => runtimeConfig;

const requireRevenueCatConfig = () => {
  if (!runtimeConfig) {
    throw new Error('[RevenueCat] Public config not loaded.');
  }
  return runtimeConfig;
};

/**
 * RevenueCat configuration constants
 */
export const REVENUECAT_CONFIG = {
  /**
   * Free trial duration in days (custom trial without credit card)
   * Note: This is now managed by the backend, this value is kept for reference
   */
  TRIAL_DURATION_DAYS: 14,
} as const;

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
