import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases from 'react-native-purchases';
import type { ApiResponse } from '@/lib/contracts/api';
import { REVENUECAT_CONFIG, getRevenueCatEntitlementIdOptional } from '@/lib/revenuecat/config';

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
 * Downgrade status response
 */
export interface DowngradeStatus {
  requiresDowngrade: boolean;
  currentPetCount: number;
  freemiumLimit: number;
  pets: {
    _id: string;
    name: string;
    type: string;
    breed?: string;
    profilePhoto?: string;
  }[];
}

/**
 * Downgrade response
 */
export interface DowngradeResponse {
  success: boolean;
  deletedCount: number;
}

type TrialRecord = {
  startedAt: string;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const FREE_PET_LIMIT = 1;
const TRIAL_STORAGE_KEY = 'subscription.local.trial.v1';

const normalizeDaysRemaining = (expiresAt: string | null): number => {
  if (!expiresAt) {
    return 0;
  }

  const expiresMs = new Date(expiresAt).getTime();
  if (!Number.isFinite(expiresMs)) {
    return 0;
  }

  return Math.max(Math.ceil((expiresMs - Date.now()) / MS_PER_DAY), 0);
};

const getTrialExpiry = (startedAt: string): string => {
  const startedMs = new Date(startedAt).getTime();
  return new Date(startedMs + REVENUECAT_CONFIG.TRIAL_DURATION_DAYS * MS_PER_DAY).toISOString();
};

const mapFreeStatus = (overrides?: Partial<SubscriptionStatus>): SubscriptionStatus => ({
  hasActiveSubscription: false,
  subscriptionType: null,
  tier: null,
  expiresAt: null,
  daysRemaining: 0,
  isExpired: false,
  isCancelled: false,
  canStartTrial: true,
  provider: null,
  ...overrides,
});

/**
 * Local-first subscription service.
 * RevenueCat is used directly on device and trial state is persisted locally.
 */
export class SubscriptionService {
  private async readTrialRecord(): Promise<TrialRecord | null> {
    try {
      const raw = await AsyncStorage.getItem(TRIAL_STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as TrialRecord;
      if (!parsed?.startedAt) {
        return null;
      }

      const startedMs = new Date(parsed.startedAt).getTime();
      if (!Number.isFinite(startedMs)) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  private async writeTrialRecord(record: TrialRecord): Promise<void> {
    await AsyncStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify(record));
  }

  private async getCustomerInfoSafe() {
    try {
      const configured = await Purchases.isConfigured();
      if (!configured) {
        return null;
      }

      return await Purchases.getCustomerInfo();
    } catch {
      return null;
    }
  }

  async getSubscriptionStatus(
    options?: { bypassCache?: boolean }
  ): Promise<ApiResponse<SubscriptionStatus>> {
    try {
      if (options?.bypassCache) {
        // No-op in local-first mode; status is already read directly from device state.
      }

      const entitlementId = getRevenueCatEntitlementIdOptional();
      const customerInfo = await this.getCustomerInfoSafe();
      const activeEntitlement =
        customerInfo && entitlementId
          ? customerInfo.entitlements.active[entitlementId]
          : null;

      if (activeEntitlement) {
        const expiresAt = activeEntitlement.expirationDate ?? null;
        const daysRemaining = normalizeDaysRemaining(expiresAt);

        return {
          success: true,
          data: {
            hasActiveSubscription: true,
            subscriptionType: 'paid',
            tier: activeEntitlement.productIdentifier ?? entitlementId,
            expiresAt,
            daysRemaining,
            isExpired: false,
            isCancelled: !activeEntitlement.willRenew,
            canStartTrial: false,
            provider: 'revenuecat',
          },
        };
      }

      const trialRecord = await this.readTrialRecord();
      if (!trialRecord) {
        return {
          success: true,
          data: mapFreeStatus(),
        };
      }

      const expiresAt = getTrialExpiry(trialRecord.startedAt);
      const daysRemaining = normalizeDaysRemaining(expiresAt);

      if (daysRemaining > 0) {
        return {
          success: true,
          data: {
            hasActiveSubscription: true,
            subscriptionType: 'trial',
            tier: 'trial',
            expiresAt,
            daysRemaining,
            isExpired: false,
            isCancelled: false,
            canStartTrial: false,
            provider: 'internal',
          },
        };
      }

      return {
        success: true,
        data: mapFreeStatus({
          isExpired: true,
          canStartTrial: false,
        }),
      };
    } catch {
      return {
        success: true,
        data: mapFreeStatus(),
      };
    }
  }

  async startTrial(): Promise<ApiResponse<StartTrialResponse>> {
    try {
      const current = await this.getSubscriptionStatus();
      if (!current.success || !current.data) {
        return {
          success: false,
          error: {
            code: 'START_TRIAL_ERROR',
            message: 'subscription.startTrialError',
          },
        };
      }

      if (current.data.hasActiveSubscription || !current.data.canStartTrial) {
        return {
          success: false,
          error: {
            code: 'TRIAL_NOT_AVAILABLE',
            message: 'subscription.startTrialError',
          },
        };
      }

      const startedAt = new Date().toISOString();
      const expiresAt = getTrialExpiry(startedAt);
      await this.writeTrialRecord({ startedAt });

      return {
        success: true,
        data: {
          success: true,
          subscription: {
            id: 'local-trial',
            provider: 'internal',
            tier: 'trial',
            status: 'active',
            expiresAt,
          },
        },
        message: 'subscription.trialStarted',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'START_TRIAL_ERROR',
          message: 'subscription.startTrialError',
        },
      };
    }
  }

  async verifySubscription(): Promise<ApiResponse<SubscriptionStatus>> {
    return this.getSubscriptionStatus({ bypassCache: true });
  }

  async getDowngradeStatus(): Promise<ApiResponse<DowngradeStatus>> {
    try {
      const statusResponse = await this.getSubscriptionStatus();
      if (!statusResponse.success || !statusResponse.data) {
        return {
          success: false,
          error: {
            code: 'LOAD_ERROR',
            message: 'subscription.loadError',
          },
        };
      }

      const { petRepository } = await import('@/lib/repositories/petRepository');
      const pets = petRepository.getPets();
      const requiresDowngrade =
        !statusResponse.data.hasActiveSubscription && pets.length > FREE_PET_LIMIT;

      return {
        success: true,
        data: {
          requiresDowngrade,
          currentPetCount: pets.length,
          freemiumLimit: FREE_PET_LIMIT,
          pets: pets.map((pet) => ({
            _id: pet._id,
            name: pet.name,
            type: pet.type,
            breed: pet.breed,
            profilePhoto: pet.profilePhoto,
          })),
        },
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'LOAD_ERROR',
          message: 'subscription.loadError',
        },
      };
    }
  }

  async executeDowngrade(keepPetId: string): Promise<ApiResponse<DowngradeResponse>> {
    try {
      const { petRepository } = await import('@/lib/repositories/petRepository');
      const pets = petRepository.getPets();

      const keepPetExists = pets.some((pet) => pet._id === keepPetId);
      if (!keepPetExists) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'serviceResponse.pet.notFound',
          },
        };
      }

      let deletedCount = 0;
      pets.forEach((pet) => {
        if (pet._id !== keepPetId && petRepository.deletePet(pet._id)) {
          deletedCount += 1;
        }
      });

      return {
        success: true,
        data: {
          success: true,
          deletedCount,
        },
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'DOWNGRADE_ERROR',
          message: 'downgrade.error',
        },
      };
    }
  }
}

export const subscriptionService = new SubscriptionService();
