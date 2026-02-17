import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { initDatabase } from '@/lib/db/init';
import { createObjectId, nowIsoString } from '@/lib/db/utils';
import {
  budgetAlertStateTable,
  type BudgetAlertStateRow,
  userBudgetTable,
  type UserBudgetRow,
} from '@/lib/db/schema/userBudget';
import type {
  BudgetAlert,
  SetUserBudgetInput,
  UserBudget,
} from '@/lib/types';
import { expenseRepository } from '@/lib/repositories/expenseRepository';
import { calculateBudgetStatus } from '@/lib/utils/budgetCalculations';

const LOCAL_USER_ID = 'local-user';

const toTimestamp = (value: string | undefined | null): number => {
  if (!value) {
    return 0;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const getCurrentPeriodKey = (budgetId: string): string => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `budget-alert:${budgetId}:${year}-${month}`;
};

const mapRowToBudget = (row: UserBudgetRow): UserBudget => ({
  id: row.id,
  userId: row.userId,
  amount: row.amount,
  currency: row.currency as UserBudget['currency'],
  alertThreshold: row.alertThreshold,
  isActive: row.isActive,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const mapRowToAlertState = (row: BudgetAlertStateRow) => ({
  id: row.id,
  budgetId: row.budgetId,
  lastAlertAt: row.lastAlertAt,
  lastAlertSeverity: row.lastAlertSeverity,
  lastAlertPercentage: row.lastAlertPercentage,
  cooldownUntil: row.cooldownUntil,
  updatedAt: row.updatedAt,
});

export class UserBudgetRepository {
  constructor() {
    initDatabase();
  }

  getBudget(): UserBudget | null {
    const row = db
      .select()
      .from(userBudgetTable)
      .where(eq(userBudgetTable.userId, LOCAL_USER_ID))
      .get();

    return row ? mapRowToBudget(row) : null;
  }

  setBudget(input: SetUserBudgetInput): UserBudget {
    const now = nowIsoString();
    const existing = this.getBudget();

    if (existing) {
      db.update(userBudgetTable)
        .set({
          amount: Math.max(0, input.amount),
          currency: input.currency,
          alertThreshold: input.alertThreshold ?? existing.alertThreshold ?? 0.8,
          isActive: input.isActive ?? existing.isActive ?? true,
          updatedAt: now,
        })
        .where(eq(userBudgetTable.id, existing.id))
        .run();

      return this.getBudget() as UserBudget;
    }

    const id = createObjectId();
    db.insert(userBudgetTable)
      .values({
        id,
        userId: LOCAL_USER_ID,
        amount: Math.max(0, input.amount),
        currency: input.currency,
        alertThreshold: input.alertThreshold ?? 0.8,
        isActive: input.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    return this.getBudget() as UserBudget;
  }

  deleteBudget(): boolean {
    const budget = this.getBudget();
    if (!budget) {
      return false;
    }

    db.delete(userBudgetTable).where(eq(userBudgetTable.id, budget.id)).run();
    return true;
  }

  getBudgetStatus() {
    const budget = this.getBudget();
    if (!budget || !budget.isActive) {
      return null;
    }

    const allExpenses = expenseRepository.getAllExpenses();

    return calculateBudgetStatus(
      budget,
      allExpenses,
      (petId: string) => expenseRepository.getPetNameById(petId),
      new Date()
    );
  }

  checkBudgetAlerts(): BudgetAlert | null {
    const status = this.getBudgetStatus();
    if (!status) {
      return null;
    }

    const budget = status.budget;
    const percentageRatio = budget.amount > 0 ? status.currentSpending / budget.amount : 0;
    const isAlert = percentageRatio >= budget.alertThreshold;
    const isExceeded = percentageRatio >= 1;

    const baseAlert: BudgetAlert = {
      budget,
      currentSpending: status.currentSpending,
      percentage: status.percentage,
      remainingAmount: status.remainingAmount,
      isExceeded,
      isAlert,
    };

    if (!isAlert) {
      return baseAlert;
    }

    const severity: 'warning' | 'critical' = isExceeded ? 'critical' : 'warning';
    const alertKey = getCurrentPeriodKey(budget.id);
    const stateRow = db
      .select()
      .from(budgetAlertStateTable)
      .where(eq(budgetAlertStateTable.id, alertKey))
      .get();

    const state = stateRow ? mapRowToAlertState(stateRow) : null;
    const cooldownUntil = toTimestamp(state?.cooldownUntil);
    const now = Date.now();

    if (cooldownUntil > now) {
      return baseAlert;
    }

    const title = severity === 'critical' ? 'Budget limit exceeded' : 'Budget limit warning';
    const body =
      severity === 'critical'
        ? `You exceeded your budget by ${(status.currentSpending - budget.amount).toFixed(2)} ${budget.currency}.`
        : `You reached ${status.percentage.toFixed(0)}% of your monthly budget.`;

    return {
      ...baseAlert,
      notificationPayload: {
        title,
        body,
        severity,
      },
    };
  }

  acknowledgeBudgetAlert(payload: {
    severity: 'warning' | 'critical';
    percentage: number;
  }): { acknowledged: boolean; periodKey?: string } {
    const budget = this.getBudget();
    if (!budget) {
      return { acknowledged: false };
    }

    const periodKey = getCurrentPeriodKey(budget.id);
    const now = nowIsoString();
    const cooldownMs = 60 * 60 * 1000;
    const cooldownUntil = new Date(Date.now() + cooldownMs).toISOString();

    const existing = db
      .select()
      .from(budgetAlertStateTable)
      .where(eq(budgetAlertStateTable.id, periodKey))
      .get();

    if (existing) {
      db.update(budgetAlertStateTable)
        .set({
          budgetId: budget.id,
          lastAlertAt: now,
          lastAlertSeverity: payload.severity,
          lastAlertPercentage: payload.percentage,
          cooldownUntil,
          updatedAt: now,
        })
        .where(eq(budgetAlertStateTable.id, periodKey))
        .run();
    } else {
      db.insert(budgetAlertStateTable)
        .values({
          id: periodKey,
          budgetId: budget.id,
          lastAlertAt: now,
          lastAlertSeverity: payload.severity,
          lastAlertPercentage: payload.percentage,
          cooldownUntil,
          updatedAt: now,
        })
        .run();
    }

    return {
      acknowledged: true,
      periodKey,
    };
  }

  hasActiveBudget(): boolean {
    const budget = this.getBudget();
    return !!budget?.isActive;
  }
}

export const userBudgetRepository = new UserBudgetRepository();
