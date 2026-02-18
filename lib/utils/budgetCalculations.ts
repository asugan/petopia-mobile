import type { Expense, PetBreakdown, UserBudget, UserBudgetStatus } from '@/lib/types';

const toTimestamp = (value: string | undefined | null): number => {
  if (!value) {
    return 0;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const getUtcMonthBounds = (year: number, month: number) => {
  const start = Date.UTC(year, month - 1, 1, 0, 0, 0, 0);
  const end = Date.UTC(year, month, 1, 0, 0, 0, 0) - 1;
  return { start, end };
};

export const calculateBudgetStatus = (
  budget: UserBudget,
  allExpenses: Expense[],
  getPetNameById: (petId: string) => string,
  now: Date = new Date()
): UserBudgetStatus => {
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;
  const previousMonthDate = new Date(Date.UTC(currentYear, currentMonth - 2, 1));
  const previousYear = previousMonthDate.getUTCFullYear();
  const previousMonth = previousMonthDate.getUTCMonth() + 1;

  const currentBounds = getUtcMonthBounds(currentYear, currentMonth);
  const previousBounds = getUtcMonthBounds(previousYear, previousMonth);

  const currentExpenses = allExpenses.filter((expense) => {
    const ts = toTimestamp(expense.date as string);
    return ts >= currentBounds.start && ts <= currentBounds.end;
  });

  const previousExpenses = allExpenses.filter((expense) => {
    const ts = toTimestamp(expense.date as string);
    return ts >= previousBounds.start && ts <= previousBounds.end;
  });

  const currentSpending = currentExpenses.reduce((sum, item) => sum + item.amount, 0);
  const previousSpending = previousExpenses.reduce((sum, item) => sum + item.amount, 0);
  const percentage = budget.amount > 0 ? (currentSpending / budget.amount) * 100 : 0;
  const remainingAmount = budget.amount - currentSpending;
  const isAlert = currentSpending >= budget.amount * budget.alertThreshold;

  const petTotals = new Map<string, number>();
  const categoryTotals = new Map<string, number>();

  for (const expense of currentExpenses) {
    petTotals.set(expense.petId, (petTotals.get(expense.petId) ?? 0) + expense.amount);
    categoryTotals.set(expense.category, (categoryTotals.get(expense.category) ?? 0) + expense.amount);
  }

  const petBreakdown: PetBreakdown[] = [...petTotals.entries()]
    .map(([petId, spending]) => ({
      petId,
      petName: getPetNameById(petId),
      spending,
      percentage: currentSpending > 0 ? (spending / currentSpending) * 100 : 0,
    }))
    .sort((a, b) => b.spending - a.spending);

  const categoryBreakdown = [...categoryTotals.entries()]
    .map(([category, total]) => ({
      category,
      total,
      percentage: currentSpending > 0 ? (total / currentSpending) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const changePct =
    previousSpending > 0
      ? ((currentSpending - previousSpending) / previousSpending) * 100
      : currentSpending > 0
        ? 100
        : 0;

  return {
    budget,
    currentSpending,
    percentage,
    remainingAmount,
    isAlert,
    petBreakdown,
    monthOverMonth: {
      current: currentSpending,
      previous: previousSpending,
      changePct,
    },
    categoryBreakdown,
  };
};
