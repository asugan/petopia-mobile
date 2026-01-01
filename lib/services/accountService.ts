import { api, ApiError, ApiResponse } from "@/lib/api/client";
import { ENV } from "@/lib/config/env";

/**
 * Account Service - Manages account operations
 */
export class AccountService {
  /**
   * Delete the current user's account
   */
  async deleteAccount(): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const response = await api.delete<{ success: boolean }>(
        ENV.ENDPOINTS.ACCOUNT_DELETE
      );

      if (response.success) {
        console.log("Account deleted successfully");
        return {
          success: true,
          data: { success: true },
          message: "Account deleted successfully",
        };
      }

      console.warn("Delete account: unexpected response", {
        endpoint: ENV.ENDPOINTS.ACCOUNT_DELETE,
        success: response.success,
      });

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
      console.error("Delete account error:", error);
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
