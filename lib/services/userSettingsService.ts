import { api, ApiError, ApiResponse } from "@/lib/api/client";
import { ENV } from "@/lib/config/env";
import type {
  SupportedCurrency,
  UserSettings,
  UserSettingsUpdate,
} from "@/lib/types";

/**
 * User Settings Service - Manages user settings API operations
 */
export class UserSettingsService {
  /**
   * Get current user's settings
   */
  async getSettings(): Promise<ApiResponse<UserSettings>> {
    try {
      const response = await api.get<UserSettings>(ENV.ENDPOINTS.USER_SETTINGS);

      console.log("✅ User settings loaded successfully");
      return {
        success: true,
        data: response.data!,
        message: "serviceResponse.settings.fetchSuccess",
      };
    } catch (error) {
      console.error("❌ Get user settings error:", error);
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || "FETCH_ERROR",
            message: "serviceResponse.settings.fetchError",
            details: { rawMessage: error.message },
          },
        };
      }
      return {
        success: false,
        error: {
          code: "FETCH_ERROR",
          message: "serviceResponse.settings.fetchError",
        },
      };
    }
  }

  /**
   * Update user settings (partial update)
   */
  async updateSettings(
    updates: UserSettingsUpdate
  ): Promise<ApiResponse<UserSettings>> {
    try {
      const response = await api.put<UserSettings>(
        ENV.ENDPOINTS.USER_SETTINGS,
        updates
      );

      console.log("✅ User settings updated successfully");
      return {
        success: true,
        data: response.data!,
        message: "serviceResponse.settings.updateSuccess",
      };
    } catch (error) {
      console.error("❌ Update user settings error:", error);
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || "UPDATE_ERROR",
            message: "serviceResponse.settings.updateError",
            details: { rawMessage: error.message },
          },
        };
      }
      return {
        success: false,
        error: {
          code: "UPDATE_ERROR",
          message: "serviceResponse.settings.updateError",
        },
      };
    }
  }

  /**
   * Update base currency only
   */
  async updateBaseCurrency(
    currency: SupportedCurrency
  ): Promise<ApiResponse<UserSettings>> {
    try {
      const response = await api.patch<UserSettings>(
        ENV.ENDPOINTS.USER_SETTINGS_CURRENCY,
        { baseCurrency: currency }
      );

      console.log("✅ Base currency updated successfully:", currency);
      return {
        success: true,
        data: response.data!,
        message: "serviceResponse.settings.updateBaseCurrencySuccess",
      };
    } catch (error) {
      console.error("❌ Update base currency error:", error);
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || "UPDATE_CURRENCY_ERROR",
            message: "serviceResponse.settings.updateBaseCurrencyError",
            details: { rawMessage: error.message },
          },
        };
      }
      return {
        success: false,
        error: {
          code: "UPDATE_CURRENCY_ERROR",
          message: "serviceResponse.settings.updateBaseCurrencyError",
        },
      };
    }
  }
}

export const userSettingsService = new UserSettingsService();
