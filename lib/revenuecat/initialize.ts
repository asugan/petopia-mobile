import Purchases, { LOG_LEVEL, CustomerInfo } from 'react-native-purchases';
import { Platform } from 'react-native';
import { getRevenueCatApiKey, getRevenueCatEntitlementId } from './config';

/**
 * Initialize the RevenueCat SDK
 * Should be called once when the app starts
 *
 * @param userId - Optional app user ID, or null for anonymous
 */
export async function initializeRevenueCat(userId: string | null): Promise<void> {
  // Set a default log handler to prevent "customLogHandler is not a function" error
  // This must be called before configure() to handle log events properly
  Purchases.setLogHandler((_logLevel: LOG_LEVEL, _message: string) => {});

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
      throw new Error('[RevenueCat] Missing API key. Ensure EXPO_PUBLIC_REVENUECAT_* is configured.');
    }

    await Purchases.configure({
      apiKey,
      appUserID: userId ?? undefined, // null creates anonymous user
    });
  } else {
    // If already configured, sync identity to the provided userId
    // This ensures proper identity switching when users change during same app session

    if (userId) {
      try {
        await syncUserIdentity(userId);
      } catch (error) {
        throw error;
      }
    } else {
      // No userId provided, ensure we're anonymous
      try {
        const currentUserId = await Purchases.getAppUserID();
        if (currentUserId && !currentUserId.startsWith('$RCAnonymousID')) {
          await resetUserIdentity();
        }
      } catch {
      }
    }
  }
}

/**
 * Sync user identity when user logs in
 * Links the RevenueCat customer to the provided user ID
 *
 * @param userId - The app user ID
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
    return Purchases.getCustomerInfo();
  }

  const customerInfo = await Purchases.logOut();
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
  entitlementId: string = getRevenueCatEntitlementId()
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
  return customerInfo.entitlements.active[getRevenueCatEntitlementId()] ?? null;
}
