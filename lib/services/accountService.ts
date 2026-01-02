import { api, ApiError, ApiResponse } from "@/lib/api/client";
import { ENV } from "@/lib/config/env";

/**
 * Account Service - Manages account operations
 */
export class AccountService {
  /**
   * Delete the current user's account
   */
  async deleteAccount(confirmText: string = "DELETE"): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const response = await api.delete<{ success: boolean }>(
        ENV.ENDPOINTS.ACCOUNT_DELETE,
        { confirmText }
      );

      if (response.success) {
        return {
          success: true,
          data: { success: true },
          message: "Account deleted successfully",
        };
      }

      return {
        success: false,
        error: {
          code: "DELETE_FAILED",
          message: "Failed to delete account",
          details: {
            reason: "Unexpected response",
          },
        },
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || "DELETE_ERROR",
            message: "Failed to delete account",
            details: { rawMessage: error.message },
          },
        };
      }
      return {
        success: false,
        error: {
          code: "DELETE_ERROR",
          message: "Failed to delete account",
        },
      };
    }
  }
}

export const accountService = new AccountService();
