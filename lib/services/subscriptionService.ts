import Purchases from 'react-native-purchases';
import type { ApiResponse } from '@/lib/contracts/api';
import { getRevenueCatEntitlementIdOptional } from '@/lib/revenuecat/config';

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscriptionType: 'paid' | null;
  tier: string | null;
  expiresAt: string | null;
  daysRemaining: number;
  isExpired: boolean;
  isCancelled: boolean;
  provider: 'revenuecat' | null;
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

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const FREE_PET_LIMIT = 1;

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

const mapFreeStatus = (overrides?: Partial<SubscriptionStatus>): SubscriptionStatus => ({
  hasActiveSubscription: false,
  subscriptionType: null,
  tier: null,
  expiresAt: null,
  daysRemaining: 0,
  isExpired: false,
  isCancelled: false,
  provider: null,
  ...overrides,
});

/**
 * Local-first subscription service.
 * RevenueCat is used directly on device.
 */
export class SubscriptionService {
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
            provider: 'revenuecat',
          },
        };
      }

      return {
        success: true,
        data: mapFreeStatus(),
      };
    } catch {
      return {
        success: true,
        data: mapFreeStatus(),
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
