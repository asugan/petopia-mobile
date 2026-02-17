import type { ApiResponse } from '@/lib/contracts/api';
import { userBudgetRepository } from '@/lib/repositories/userBudgetRepository';
import type {
  BudgetAlert,
  PetBreakdown,
  SetUserBudgetInput,
  UserBudget,
  UserBudgetStatus,
} from '@/lib/types';

export class UserBudgetService {
  async getBudget(): Promise<ApiResponse<UserBudget>> {
    try {
      const budget = userBudgetRepository.getBudget();

      if (!budget) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'serviceResponse.budget.notFound',
          },
        };
      }

      return {
        success: true,
        data: budget,
        message: 'serviceResponse.budget.fetchSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'serviceResponse.budget.fetchError',
        },
      };
    }
  }

  async setBudget(data: SetUserBudgetInput): Promise<ApiResponse<UserBudget>> {
    try {
      const budget = userBudgetRepository.setBudget(data);

      return {
        success: true,
        data: budget,
        message: 'serviceResponse.budget.updateSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'SET_ERROR',
          message: 'serviceResponse.budget.setError',
        },
      };
    }
  }

  async deleteBudget(): Promise<ApiResponse<void>> {
    try {
      const deleted = userBudgetRepository.deleteBudget();

      if (!deleted) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'serviceResponse.budget.notFoundDelete',
          },
        };
      }

      return {
        success: true,
        message: 'serviceResponse.budget.deleteSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: 'serviceResponse.budget.deleteError',
        },
      };
    }
  }

  async getBudgetStatus(): Promise<ApiResponse<UserBudgetStatus>> {
    try {
      const status = userBudgetRepository.getBudgetStatus();

      if (!status) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'serviceResponse.budget.notFoundStatus',
          },
        };
      }

      return {
        success: true,
        data: status,
        message: 'serviceResponse.budget.fetchStatusSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'FETCH_STATUS_ERROR',
          message: 'serviceResponse.budget.fetchStatusError',
        },
      };
    }
  }

  async checkBudgetAlerts(): Promise<ApiResponse<BudgetAlert>> {
    try {
      const alert = userBudgetRepository.checkBudgetAlerts();

      if (!alert) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'serviceResponse.budget.notFoundAlerts',
          },
        };
      }

      return {
        success: true,
        data: alert,
        message: 'serviceResponse.budget.checkAlertsSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'CHECK_ALERTS_ERROR',
          message: 'serviceResponse.budget.checkAlertsError',
        },
      };
    }
  }

  async acknowledgeBudgetAlert(payload: {
    severity: 'warning' | 'critical';
    percentage: number;
  }): Promise<ApiResponse<{ acknowledged: boolean; periodKey?: string }>> {
    try {
      const result = userBudgetRepository.acknowledgeBudgetAlert(payload);

      return {
        success: true,
        data: result,
        message: 'serviceResponse.budget.ackAlertsSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'ACK_ALERTS_ERROR',
          message: 'serviceResponse.budget.ackAlertsError',
        },
      };
    }
  }

  async getPetSpendingBreakdown(): Promise<ApiResponse<PetBreakdown[]>> {
    try {
      const status = userBudgetRepository.getBudgetStatus();

      if (!status) {
        return {
          success: false,
          error: {
            code: 'FETCH_BREAKDOWN_ERROR',
            message: 'serviceResponse.budget.fetchBreakdownError',
          },
        };
      }

      return {
        success: true,
        data: status.petBreakdown,
        message: 'serviceResponse.budget.fetchBreakdownSuccess',
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

  async hasActiveBudget(): Promise<ApiResponse<boolean>> {
    try {
      return {
        success: true,
        data: userBudgetRepository.hasActiveBudget(),
        message: userBudgetRepository.hasActiveBudget()
          ? 'serviceResponse.budget.hasActiveBudgetTrue'
          : 'serviceResponse.budget.hasActiveBudgetFalse',
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

  async getBudgetSummary(): Promise<
    ApiResponse<{
      budget: UserBudget | null;
      status: UserBudgetStatus | null;
      hasActiveBudget: boolean;
      alerts: BudgetAlert | null;
    }>
  > {
    try {
      const budget = userBudgetRepository.getBudget();
      const status = userBudgetRepository.getBudgetStatus();
      const alerts = userBudgetRepository.checkBudgetAlerts();
      const hasActiveBudget = userBudgetRepository.hasActiveBudget();

      return {
        success: true,
        data: {
          budget,
          status,
          hasActiveBudget,
          alerts,
        },
        message: 'serviceResponse.budget.fetchSummarySuccess',
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

export const userBudgetService = new UserBudgetService();
