import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';
import { ENV } from '../config/env';

/**
 * Better Auth client configured for Expo/React Native
 * Uses SecureStore for secure token storage (iOS Keychain, Android Keystore)
 */
export const authClient = createAuthClient({
  baseURL: ENV.API_BASE_URL,
  basePath: ENV.API_BASE_PATH,
  plugins: [
    expoClient({
      scheme: ENV.AUTH.SCHEME,
      storagePrefix: ENV.AUTH.STORAGE_PREFIX,
      storage: SecureStore,
    }),
  ],
});

// Type exports for session and user
export type Session = typeof authClient.$Infer.Session;
export type User = Session['user'];
