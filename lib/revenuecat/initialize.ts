import Purchases, { LOG_LEVEL, CustomerInfo } from 'react-native-purchases';
import { Platform } from 'react-native';
import { getRevenueCatApiKey, REVENUECAT_CONFIG } from './config';

/**
 * Initialize the RevenueCat SDK
 * Should be called once when the app starts, after authentication is determined
 *
 * @param userId - The authenticated user ID from better-auth, or null for anonymous
 */
export async function initializeRevenueCat(userId: string | null): Promise<void> {
  // Set a default log handler to prevent "customLogHandler is not a function" error
  // This must be called before configure() to handle log events properly
  Purchases.setLogHandler((logLevel: LOG_LEVEL, message: string) => {
    if (__DEV__) {
      console.log(`[RevenueCat][${LOG_LEVEL[logLevel]}] ${message}`);
    }
  });

  // Enable debug logs in development
  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  // Check if already configured
  const isConfigured = await Purchases.isConfigured();
  if (!isConfigured) {
    // Configure the SDK
    const apiKey = getRevenueCatApiKey(Platform.OS === 'ios' ? 'ios' : 'android');
    if (!apiKey) {
      throw new Error('[RevenueCat] Missing API key. Set EXPO_PUBLIC_REVENUECAT_IOS_API_KEY and EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY.');
    }

    await Purchases.configure({
      apiKey,
      appUserID: userId ?? undefined, // null creates anonymous user
    });

    console.log('[RevenueCat] SDK initialized', {
      userId: userId ?? 'anonymous',
      platform: Platform.OS,
    });
  } else {
    // If already configured, sync identity to the provided userId
    // This ensures proper identity switching when users change during same app session
    console.log('[RevenueCat] SDK already configured, syncing identity...');

    if (userId) {
      try {
        await syncUserIdentity(userId);
        console.log('[RevenueCat] Identity synced to user:', userId);
      } catch (error) {
        console.error('[RevenueCat] Error syncing identity:', error);
        throw error;
      }
    } else {
      // No userId provided, ensure we're anonymous
      try {
        const currentUserId = await Purchases.getAppUserID();
        if (currentUserId && !currentUserId.startsWith('$RCAnonymousID')) {
          await resetUserIdentity();
          console.log('[RevenueCat] Reset to anonymous user');
        }
      } catch (error) {
        console.error('[RevenueCat] Error resetting to anonymous:', error);
      }
    }
  }
}

/**
 * Sync user identity when user logs in
 * Links the RevenueCat customer to the authenticated user ID
 *
 * @param userId - The authenticated user ID from better-auth
 * @returns The updated CustomerInfo
 */
export async function syncUserIdentity(userId: string): Promise<CustomerInfo> {
  const isConfigured = await Purchases.isConfigured();
  if (!isConfigured) {
    throw new Error('[RevenueCat] SDK not configured. Call initializeRevenueCat first.');
  }

  // Log in with the user ID - this will:
  // 1. Create a new customer if the ID doesn't exist
  // 2. Transfer any anonymous purchases to the logged-in user
  // 3. Merge purchase history if the user exists
  const { customerInfo } = await Purchases.logIn(userId);

  console.log('[RevenueCat] User identity synced', {
    userId,
    activeEntitlements: Object.keys(customerInfo.entitlements.active),
  });

  return customerInfo;
}

/**
 * Reset to anonymous user when user logs out
 * Clears the user association but preserves the device's purchase history
 *
 * @returns The new anonymous CustomerInfo
 */
export async function resetUserIdentity(): Promise<CustomerInfo> {
  const isConfigured = await Purchases.isConfigured();
  if (!isConfigured) {
    throw new Error('[RevenueCat] SDK not configured. Call initializeRevenueCat first.');
  }

  const currentUserId = await Purchases.getAppUserID();
  if (currentUserId && currentUserId.startsWith('$RCAnonymousID')) {
    console.log('[RevenueCat] Already anonymous user, skipping logout');
    return Purchases.getCustomerInfo();
  }

  const customerInfo = await Purchases.logOut();

  console.log('[RevenueCat] User logged out, reset to anonymous');

  return customerInfo;
}

/**
 * Get the current customer info
 * Use this to check entitlements and subscription status
 *
 * @returns The current CustomerInfo
 */
export async function getCustomerInfo(): Promise<CustomerInfo> {
  const isConfigured = await Purchases.isConfigured();
  if (!isConfigured) {
    throw new Error('[RevenueCat] SDK not configured. Call initializeRevenueCat first.');
  }

  return Purchases.getCustomerInfo();
}

/**
 * Restore purchases for the current user
 * Useful for users who reinstall the app or switch devices
 *
 * @returns The updated CustomerInfo after restoration
 */
export async function restorePurchases(): Promise<CustomerInfo> {
  const isConfigured = await Purchases.isConfigured();
  if (!isConfigured) {
    throw new Error('[RevenueCat] SDK not configured. Call initializeRevenueCat first.');
  }

  const customerInfo = await Purchases.restorePurchases();

  console.log('[RevenueCat] Purchases restored', {
    activeEntitlements: Object.keys(customerInfo.entitlements.active),
  });

  return customerInfo;
}

/**
 * Check if user has a specific entitlement
 *
 * @param customerInfo - The CustomerInfo object
 * @param entitlementId - The entitlement ID to check (defaults to Pro entitlement)
 * @returns true if the entitlement is active
 */
export function hasEntitlement(
  customerInfo: CustomerInfo,
  entitlementId: string = REVENUECAT_CONFIG.ENTITLEMENT_ID
): boolean {
  return typeof customerInfo.entitlements.active[entitlementId] !== 'undefined';
}

/**
 * Get the Pro entitlement details
 *
 * @param customerInfo - The CustomerInfo object
 * @returns The entitlement info or null if not active
 */
export function getProEntitlement(customerInfo: CustomerInfo) {
  return customerInfo.entitlements.active[REVENUECAT_CONFIG.ENTITLEMENT_ID] ?? null;
}
