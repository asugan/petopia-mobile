import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ApiResponse } from "@/lib/contracts/api";
import { resetDatabase } from "@/lib/db/init";
import { notificationService } from "@/lib/services/notificationService";

/**
 * Account Service - Manages local account-style operations
 */
export class AccountService {
  /**
   * Delete local account data
   */
  async deleteAccount(confirmText: string = "DELETE"): Promise<ApiResponse<{ success: boolean }>> {
    try {
      if (confirmText !== "DELETE") {
        return {
          success: false,
          error: {
            code: "DELETE_FAILED",
            message: "Failed to delete account",
          },
        };
      }

      await notificationService.cancelAllNotifications();
      await notificationService.cancelEventAndFeedingNotifications();

      resetDatabase();

      await AsyncStorage.multiRemove([
        "subscription.local.trial.v1",
        "subscription-storage",
      ]);

      return {
        success: true,
        data: { success: true },
        message: "Account deleted successfully",
      };
    } catch {
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
