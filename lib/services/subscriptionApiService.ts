import { api, ApiError, ApiResponse } from '@/lib/api/client';
import { ENV } from '@/lib/config/env';
import { getDeviceId } from '@/lib/utils/deviceId';

/**
 * Unified subscription status from backend - single source of truth
 */
export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscriptionType: 'trial' | 'paid' | null;
  tier: string | null;
  expiresAt: string | null;
  daysRemaining: number;
  isExpired: boolean;
  isCancelled: boolean;
  canStartTrial: boolean;
  provider: 'internal' | 'revenuecat' | null;
}

/**
 * Start trial response
 */
export interface StartTrialResponse {
  success: boolean;
  subscription: {
    id: string;
    provider: string;
    tier: string;
    status: string;
    expiresAt: string;
  };
}

/**
 * Subscription API Service - Handles all subscription related API calls
 * Note: Request deduplication is handled by React Query automatically
 */
export class SubscriptionApiService {
  /**
   * Get unified subscription status from backend
   * This is the main method - use this for all status checks
   * React Query handles caching and deduplication automatically
   *
   * @param options.bypassCache - if true, appends timestamp to bypass HTTP/browser cache
   */
  async getSubscriptionStatus(
    options?: { bypassCache?: boolean }
  ): Promise<ApiResponse<SubscriptionStatus>> {
    try {
      const deviceId = await getDeviceId();
      const params: Record<string, unknown> = { deviceId };

      if (options?.bypassCache) {
        params._t = Date.now();
      }

      const response = await api.get<SubscriptionStatus>(
        ENV.ENDPOINTS.SUBSCRIPTION_STATUS,
        params
      );

      if (!response.data) {
        return {
          success: false,
          error: {
            code: 'INVALID_RESPONSE',
            message: 'Invalid response from server',
          },
        };
      }

      console.log('✅ Subscription status loaded successfully');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('❌ Get subscription status error:', error);
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code ?? 'UNKNOWN_ERROR',
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'LOAD_ERROR',
          message: 'subscription.loadError',
        },
      };
    }
  }

  /**
   * Start a new trial for the user
   * React Query will automatically invalidate cache after this mutation
   */
  async startTrial(): Promise<ApiResponse<StartTrialResponse>> {
    try {
      const deviceId = await getDeviceId();

      const response = await api.post<StartTrialResponse>(
        ENV.ENDPOINTS.SUBSCRIPTION_START_TRIAL,
        { deviceId }
      );

      if (!response.data) {
        return {
          success: false,
          error: 'Invalid response from server',
        };
      }

      console.log('✅ Trial started successfully');
      return {
        success: true,
        data: response.data,
        message: 'subscription.trialStarted',
      };
    } catch (error) {
      console.error('❌ Start trial error:', error);
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code ?? 'UNKNOWN_ERROR',
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: 'subscription.startTrialError',
      };
    }
  }
}

export const subscriptionApiService = new SubscriptionApiService();
