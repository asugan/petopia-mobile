import { Platform } from 'react-native';
import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';

const DEVICE_ID_KEY = 'petopia_device_id';

/**
 * Generate a UUID v4 for fallback device identification
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get a unique device identifier
 *
 * On iOS: Uses IDFV (Identifier for Vendor) - unique per app vendor
 * On Android: Uses Android ID - unique per device
 * Fallback: Generates and stores a UUID in SecureStore
 *
 * @returns Promise<string> - The device identifier
 */
export async function getDeviceId(): Promise<string> {
  try {
    // First check if we have a stored ID (ensures consistency)
    const storedId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (storedId) {
      return storedId;
    }

    let deviceId: string | null = null;

    if (Platform.OS === 'ios') {
      // IDFV is unique per vendor (all apps from same developer share this)
      // Returns null on simulator sometimes
      deviceId = await Application.getIosIdForVendorAsync();
    } else if (Platform.OS === 'android') {
      // Android ID is unique per device (resets on factory reset)
      deviceId = Application.getAndroidId();
    }

    // If we couldn't get a platform-specific ID, generate a UUID
    if (!deviceId) {
      deviceId = generateUUID();
    }

    // Store the device ID for consistency
    await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);

    return deviceId;
  } catch (error) {

    // Last resort: try to get stored ID or generate new one
    try {
      const storedId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
      if (storedId) {
        return storedId;
      }

      const newId = generateUUID();
      await SecureStore.setItemAsync(DEVICE_ID_KEY, newId);
      return newId;
    } catch (fallbackError) {
      // If all else fails, return a temporary ID (not ideal but prevents crashes)
      return `temp_${generateUUID()}`;
    }
  }
}

/**
 * Clear the stored device ID (useful for testing)
 */
export async function clearDeviceId(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
  } catch {
  }
}
