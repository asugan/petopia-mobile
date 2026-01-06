import Constants from 'expo-constants';

type RevenueCatExtra = {
  revenuecat?: {
    iosApiKey?: string;
    androidApiKey?: string;
    entitlementId?: string;
    weeklyProductId?: string;
    monthlyProductId?: string;
    yearlyProductId?: string;
  };
};

const extraConfig = Constants.expoConfig?.extra as RevenueCatExtra | undefined;
const iosApiKey =
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ??
  extraConfig?.revenuecat?.iosApiKey ??
  '';
const androidApiKey =
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ??
  extraConfig?.revenuecat?.androidApiKey ??
  '';
const entitlementId =
  process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID ??
  extraConfig?.revenuecat?.entitlementId ??
  'Petopia Pro';
// Product IDs are resolved via RevenueCat offerings by default.
// Uncomment these if you switch to a custom paywall flow that needs manual product IDs.
// const weeklyProductId =
//   process.env.EXPO_PUBLIC_REVENUECAT_WEEKLY_PRODUCT_ID ??
//   extraConfig?.revenuecat?.weeklyProductId ??
//   '';
// const monthlyProductId =
//   process.env.EXPO_PUBLIC_REVENUECAT_MONTHLY_PRODUCT_ID ??
//   extraConfig?.revenuecat?.monthlyProductId ??
//   '';
// const yearlyProductId =
//   process.env.EXPO_PUBLIC_REVENUECAT_YEARLY_PRODUCT_ID ??
//   extraConfig?.revenuecat?.yearlyProductId ??
//   '';

/**
 * RevenueCat configuration constants
 */
export const REVENUECAT_CONFIG = {
  /**
   * RevenueCat API Keys
   * Public SDK keys can be safely included in the app
   */
  API_KEYS: {
    IOS: iosApiKey,
    ANDROID: androidApiKey,
  },

  /**
   * Entitlement identifier for Pro access
   * Must match the entitlement ID configured in RevenueCat dashboard
   */
  ENTITLEMENT_ID: entitlementId,

  // Product identifiers are optional unless you build a custom paywall flow.
  // PRODUCTS: {
  //   WEEKLY: weeklyProductId,
  //   MONTHLY: monthlyProductId,
  //   YEARLY: yearlyProductId,
  // },

  /**
   * Free trial duration in days (custom trial without credit card)
   * Note: This is now managed by the backend, this value is kept for reference
   */
  TRIAL_DURATION_DAYS: 14,
} as const;

export type RevenueCatPlatform = 'ios' | 'android';

export function getRevenueCatApiKey(platform: RevenueCatPlatform): string {
  return platform === 'ios'
    ? REVENUECAT_CONFIG.API_KEYS.IOS
    : REVENUECAT_CONFIG.API_KEYS.ANDROID;
}

/**
 * Type for product identifiers
 */
// export type ProductId = (typeof REVENUECAT_CONFIG.PRODUCTS)[keyof typeof REVENUECAT_CONFIG.PRODUCTS];
