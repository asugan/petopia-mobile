import { api, ApiError, ApiResponse } from "../api/client";
import { ENV } from "../config/env";
import type {
  UserBudget,
  UserBudgetStatus,
  SetUserBudgetInput,
  PetBreakdown,
  BudgetAlert,
} from "../types";

/**
 * User Budget Service - Manages simplified user budget API operations
 * Implements the new budget simplification roadmap with single budget per user
 */
export class UserBudgetService {
  /**
   * Get current user's budget
   */
  async getBudget(): Promise<ApiResponse<UserBudget>> {
    try {
      const response = await api.get<UserBudget>(ENV.ENDPOINTS.BUDGET);

      console.log("✅ User budget loaded successfully");
      return {
        success: true,
        data: response.data!,
        message: "budget.fetchSuccess",
      };
    } catch (error) {
      console.error("❌ Get user budget error:", error);
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'budget.notFound',
            },
          };
        }
        return {
          success: false,
          error: {
            code: error.code || 'FETCH_ERROR',
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'budget.fetchError',
        },
      };
    }
  }

  /**
   * Set or update user budget (UPSERT operation)
   */
  async setBudget(data: SetUserBudgetInput): Promise<ApiResponse<UserBudget>> {
    try {
      // Clean up the data before sending to API
      const cleanedData = {
        amount: Math.max(0, data.amount), // Ensure non-negative amount
        currency: data.currency,
        alertThreshold: data.alertThreshold ?? 0.8, // Default to 80%
        isActive: data.isActive ?? true, // Default to active
      };

      const response = await api.put<UserBudget>(
        ENV.ENDPOINTS.BUDGET,
        cleanedData
      );

      console.log("✅ User budget set successfully:", response.data?.id);
      return {
        success: true,
        data: response.data!,
        message: "budget.updateSuccess",
      };
    } catch (error) {
      console.error("❌ Set user budget error:", error);
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || 'SET_ERROR',
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'SET_ERROR',
          message: 'budget.setError',
        },
      };
    }
  }

  /**
   * Remove user's budget
   */
  async deleteBudget(): Promise<ApiResponse<void>> {
    try {
      await api.delete(ENV.ENDPOINTS.BUDGET);

      console.log("✅ User budget deleted successfully");
      return {
        success: true,
        message: "budget.deleteSuccess",
      };
    } catch (error) {
      console.error("❌ Delete user budget error:", error);
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'budget.notFoundDelete',
            },
          };
        }
        return {
          success: false,
          error: {
            code: error.code || 'DELETE_ERROR',
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: 'budget.deleteError',
        },
      };
    }
  }

  /**
   * Get budget status with current spending and pet breakdown
   */
  async getBudgetStatus(): Promise<ApiResponse<UserBudgetStatus>> {
    try {
      const response = await api.get<UserBudgetStatus>(
        ENV.ENDPOINTS.BUDGET_STATUS
      );

      console.log("✅ Budget status loaded successfully");
      return {
        success: true,
        data: response.data!,
        message: "budget.fetchStatusSuccess",
      };
    } catch (error) {
      console.error("❌ Get budget status error:", error);
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'budget.notFoundStatus',
            },
          };
        }
        return {
          success: false,
          error: {
            code: error.code || 'FETCH_STATUS_ERROR',
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'FETCH_STATUS_ERROR',
          message: 'budget.fetchStatusError',
        },
      };
    }
  }

  /**
   * Check if budget alerts should be triggered
   */
  async checkBudgetAlerts(): Promise<
    ApiResponse<BudgetAlert>
  > {
    try {
      const response = await api.get<BudgetAlert>(ENV.ENDPOINTS.BUDGET_ALERTS);

      console.log("✅ Budget alerts checked successfully");
      return {
        success: true,
        data: response.data!,
        message: "budget.checkAlertsSuccess",
      };
    } catch (error) {
      console.error("❌ Check budget alerts error:", error);
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'budget.notFoundAlerts',
            },
          };
        }
        return {
          success: false,
          error: {
            code: error.code || 'CHECK_ALERTS_ERROR',
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'CHECK_ALERTS_ERROR',
          message: 'budget.checkAlertsError',
        },
      };
    }
  }

  /**
   * Get pet spending breakdown for the current budget period
   * This is a helper method that extracts pet breakdown from budget status
   */
  async getPetSpendingBreakdown(): Promise<ApiResponse<PetBreakdown[]>> {
    try {
      const statusResponse = await this.getBudgetStatus();

      if (!statusResponse.success || !statusResponse.data) {
        return {
          success: false,
          error: statusResponse.error || {
            code: 'FETCH_BREAKDOWN_ERROR',
            message: 'budget.fetchBreakdownError',
          },
        };
      }

      console.log("✅ Pet spending breakdown loaded successfully");
      return {
        success: true,
        data: statusResponse.data.petBreakdown,
        message: "budget.fetchBreakdownSuccess",
      };
    } catch (error) {
      console.error("❌ Get pet spending breakdown error:", error);
      return {
        success: false,
        error: {
          code: 'FETCH_BREAKDOWN_ERROR',
          message: 'budget.fetchBreakdownError',
        },
      };
    }
  }

  /**
   * Check if user has an active budget
   * Helper method to quickly check budget existence and active status
   */
  async hasActiveBudget(): Promise<ApiResponse<boolean>> {
    try {
      const budgetResponse = await this.getBudget();

      if (!budgetResponse.success) {
        return {
          success: true,
          data: false,
          message: "budget.hasActiveBudgetFalse",
        };
      }

      const hasBudget = !!(budgetResponse.data && budgetResponse.data.isActive);

      console.log("✅ Active budget check completed:", hasBudget);
      return {
        success: true,
        data: hasBudget,
        message: hasBudget
          ? "budget.hasActiveBudgetTrue"
          : "budget.hasActiveBudgetFalse",
      };
    } catch (error) {
      console.error("❌ Check active budget error:", error);
      return {
        success: false,
        error: {
          code: 'CHECK_ACTIVE_ERROR',
          message: 'budget.checkActiveError',
        },
      };
    }
  }

  /**
   * Get budget summary with key metrics
   * Combines budget info and status for a comprehensive overview
   */
  async getBudgetSummary(): Promise<
    ApiResponse<{
      budget: UserBudget | null;
      status: UserBudgetStatus | null;
      hasActiveBudget: boolean;
      alerts: BudgetAlert | null;
    }>
  > {
    try {
      // Get budget info
      const budgetResponse = await this.getBudget();
      const budget = budgetResponse.success
        ? budgetResponse.data || null
        : null;

      // Get status if budget exists
      let status: UserBudgetStatus | null = null;
      if (budget) {
        const statusResponse = await this.getBudgetStatus();
        status = statusResponse.success ? statusResponse.data || null : null;
      }

      // Get alerts if budget exists
      let alerts: BudgetAlert | null = null;
      if (budget) {
        const alertsResponse = await this.checkBudgetAlerts();
        alerts = alertsResponse.success ? alertsResponse.data || null : null;
      }

      const hasActiveBudget = !!(budget && budget.isActive);

      console.log("✅ Budget summary loaded successfully");
      return {
        success: true,
        data: {
          budget,
          status,
          hasActiveBudget,
          alerts,
        },
        message: "budget.fetchSummarySuccess",
      };
    } catch (error) {
      console.error("❌ Get budget summary error:", error);
      return {
        success: false,
        error: {
          code: 'FETCH_SUMMARY_ERROR',
          message: 'budget.fetchSummaryError',
        },
      };
    }
  }
}

// Export a singleton instance
export const userBudgetService = new UserBudgetService();
