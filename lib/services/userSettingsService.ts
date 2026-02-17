import type { ApiResponse } from '@/lib/contracts/api';
import { userSettingsRepository } from '@/lib/repositories/userSettingsRepository';
import type { SupportedCurrency, UserSettings, UserSettingsUpdate } from '@/lib/types';

export class UserSettingsService {
  async getSettings(): Promise<ApiResponse<UserSettings>> {
    try {
      const settings = userSettingsRepository.getSettings();

      return {
        success: true,
        data: settings,
        message: 'serviceResponse.settings.fetchSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'serviceResponse.settings.fetchError',
        },
      };
    }
  }

  async updateSettings(updates: UserSettingsUpdate): Promise<ApiResponse<UserSettings>> {
    try {
      const settings = userSettingsRepository.updateSettings(updates);

      return {
        success: true,
        data: settings,
        message: 'serviceResponse.settings.updateSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'serviceResponse.settings.updateError',
        },
      };
    }
  }

  async updateBaseCurrency(currency: SupportedCurrency): Promise<ApiResponse<UserSettings>> {
    try {
      const settings = userSettingsRepository.updateBaseCurrency(currency);

      return {
        success: true,
        data: settings,
        message: 'serviceResponse.settings.updateBaseCurrencySuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'UPDATE_CURRENCY_ERROR',
          message: 'serviceResponse.settings.updateBaseCurrencyError',
        },
      };
    }
  }
}

export const userSettingsService = new UserSettingsService();
