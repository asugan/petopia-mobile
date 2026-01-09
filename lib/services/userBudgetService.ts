import { api, ApiError, ApiResponse } from '@/lib/api/client';
import { ENV } from '@/lib/config/env';
import type {
  UserBudget,
  UserBudgetStatus,
  SetUserBudgetInput,
  PetBreakdown,
  BudgetAlert,
} from '@/lib/types';

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

      return {
        success: true,
        data: response.data!,
        message: "serviceResponse.budget.fetchSuccess",
      };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'serviceResponse.budget.notFound',
            },
          };
        }
        return {
          success: false,
          error: {
            code: error.code || 'FETCH_ERROR',
            message: 'serviceResponse.budget.fetchError',
            details: { rawMessage: error.message },
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'serviceResponse.budget.fetchError',
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

      return {
        success: true,
        data: response.data!,
        message: "serviceResponse.budget.updateSuccess",
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || 'SET_ERROR',
            message: 'serviceResponse.budget.setError',
            details: { rawMessage: error.message },
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'SET_ERROR',
          message: 'serviceResponse.budget.setError',
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

      return {
        success: true,
        message: "serviceResponse.budget.deleteSuccess",
      };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'serviceResponse.budget.notFoundDelete',
            },
          };
        }
        return {
          success: false,
          error: {
            code: error.code || 'DELETE_ERROR',
            message: 'serviceResponse.budget.deleteError',
            details: { rawMessage: error.message },
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: 'serviceResponse.budget.deleteError',
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

      return {
        success: true,
        data: response.data!,
        message: "serviceResponse.budget.fetchStatusSuccess",
      };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'serviceResponse.budget.notFoundStatus',
            },
          };
        }
        return {
          success: false,
          error: {
            code: error.code || 'FETCH_STATUS_ERROR',
            message: 'serviceResponse.budget.fetchStatusError',
            details: { rawMessage: error.message },
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'FETCH_STATUS_ERROR',
          message: 'serviceResponse.budget.fetchStatusError',
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

      return {
        success: true,
        data: response.data!,
        message: "serviceResponse.budget.checkAlertsSuccess",
      };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'serviceResponse.budget.notFoundAlerts',
            },
          };
        }
        return {
          success: false,
          error: {
            code: error.code || 'CHECK_ALERTS_ERROR',
            message: 'serviceResponse.budget.checkAlertsError',
            details: { rawMessage: error.message },
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'CHECK_ALERTS_ERROR',
          message: 'serviceResponse.budget.checkAlertsError',
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
            message: 'serviceResponse.budget.fetchBreakdownError',
          },
        };
      }

      return {
        success: true,
        data: statusResponse.data.petBreakdown,
        message: "serviceResponse.budget.fetchBreakdownSuccess",
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'FETCH_BREAKDOWN_ERROR',
          message: 'serviceResponse.budget.fetchBreakdownError',
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
          message: "serviceResponse.budget.hasActiveBudgetFalse",
        };
      }

      const hasBudget = !!(budgetResponse.data && budgetResponse.data.isActive);

      return {
        success: true,
        data: hasBudget,
        message: hasBudget
          ? "serviceResponse.budget.hasActiveBudgetTrue"
          : "serviceResponse.budget.hasActiveBudgetFalse",
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'CHECK_ACTIVE_ERROR',
          message: 'serviceResponse.budget.checkActiveError',
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

      return {
        success: true,
        data: {
          budget,
          status,
          hasActiveBudget,
          alerts,
        },
        message: "serviceResponse.budget.fetchSummarySuccess",
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'FETCH_SUMMARY_ERROR',
          message: 'serviceResponse.budget.fetchSummaryError',
        },
      };
    }
  }
}

// Export a singleton instance
export const userBudgetService = new UserBudgetService();
