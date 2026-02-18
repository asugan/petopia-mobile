import type { ApiResponse } from '@/lib/contracts/api';
import { expenseRepository } from '@/lib/repositories/expenseRepository';
import { userBudgetRepository } from '@/lib/repositories/userBudgetRepository';
import { exchangeRateService } from '@/lib/services/exchangeRateService';
import type {
  BudgetAlert,
  Currency,
  Expense,
  PetBreakdown,
  SetUserBudgetInput,
  UserBudget,
  UserBudgetStatus,
} from '@/lib/types';
import { calculateBudgetStatus } from '@/lib/utils/budgetCalculations';

const normalizeCurrency = (currency: string): Currency => currency.toUpperCase() as Currency;

export class UserBudgetService {
  private resolveTargetCurrency(budget: UserBudget, targetCurrency?: Currency): Currency {
    return normalizeCurrency(targetCurrency ?? budget.currency);
  }

  private async convertBudgetToCurrency(
    budget: UserBudget,
    targetCurrency?: Currency,
  ): Promise<UserBudget> {
    const target = this.resolveTargetCurrency(budget, targetCurrency);
    if (budget.currency === target) {
      return {
        ...budget,
        currency: target,
      };
    }

    const convertedAmount = await exchangeRateService.convertAmount(budget.amount, budget.currency, target);
    if (convertedAmount === null) {
      return budget;
    }

    return {
      ...budget,
      amount: convertedAmount,
      currency: target,
    };
  }

  private async calculateConvertedBudgetStatus(targetCurrency?: Currency): Promise<UserBudgetStatus | null> {
    const budget = userBudgetRepository.getBudget();
    if (!budget || !budget.isActive) {
      return null;
    }

    const convertedBudget = await this.convertBudgetToCurrency(budget, targetCurrency);
    const allExpenses = expenseRepository.getAllExpenses();
    const convertedExpenses = await exchangeRateService.convertExpensesToCurrency(
      allExpenses,
      convertedBudget.currency,
    );

    const normalizedExpenses: Expense[] = convertedExpenses.map((expense) => ({
      ...expense,
      amount:
        expense.currency === convertedBudget.currency
          ? expense.amount
          : (expense.amountBase ?? expense.amount),
      currency: convertedBudget.currency,
    }));

    return calculateBudgetStatus(
      convertedBudget,
      normalizedExpenses,
      (petId: string) => expenseRepository.getPetNameById(petId),
      new Date(),
    );
  }

  async getBudget(options?: { targetCurrency?: Currency }): Promise<ApiResponse<UserBudget>> {
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

      const convertedBudget = await this.convertBudgetToCurrency(budget, options?.targetCurrency);

      return {
        success: true,
        data: convertedBudget,
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

  async getBudgetStatus(options?: { targetCurrency?: Currency }): Promise<ApiResponse<UserBudgetStatus>> {
    try {
      const status = await this.calculateConvertedBudgetStatus(options?.targetCurrency);

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

  async checkBudgetAlerts(options?: { targetCurrency?: Currency }): Promise<ApiResponse<BudgetAlert>> {
    try {
      const status = await this.calculateConvertedBudgetStatus(options?.targetCurrency);
      const alert = status ? userBudgetRepository.checkBudgetAlerts(status) : null;

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

  async getPetSpendingBreakdown(options?: { targetCurrency?: Currency }): Promise<ApiResponse<PetBreakdown[]>> {
    try {
      const status = await this.calculateConvertedBudgetStatus(options?.targetCurrency);

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

  async getBudgetSummary(options?: { targetCurrency?: Currency }): Promise<
    ApiResponse<{
      budget: UserBudget | null;
      status: UserBudgetStatus | null;
      hasActiveBudget: boolean;
      alerts: BudgetAlert | null;
    }>
  > {
    try {
      const rawBudget = userBudgetRepository.getBudget();
      const budget = rawBudget
        ? await this.convertBudgetToCurrency(rawBudget, options?.targetCurrency)
        : null;
      const status = await this.calculateConvertedBudgetStatus(options?.targetCurrency);
      const alerts = status ? userBudgetRepository.checkBudgetAlerts(status) : null;
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
