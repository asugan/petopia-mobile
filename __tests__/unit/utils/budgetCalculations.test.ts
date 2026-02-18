import { describe, expect, it } from 'vitest';
import { calculateBudgetStatus } from '@/lib/utils/budgetCalculations';
import type { Expense, UserBudget } from '@/lib/types';

const budget: UserBudget = {
  id: 'budget-1',
  userId: 'local-user',
  amount: 100,
  currency: 'TRY',
  alertThreshold: 0.8,
  isActive: true,
  createdAt: '2026-02-01T00:00:00.000Z',
  updatedAt: '2026-02-01T00:00:00.000Z',
};

const expenses: Expense[] = [
  {
    _id: 'exp-1',
    petId: 'pet-1',
    category: 'food',
    amount: 60,
    currency: 'TRY',
    date: '2026-02-10T10:00:00.000Z',
    createdAt: '2026-02-10T10:00:00.000Z',
  },
  {
    _id: 'exp-2',
    petId: 'pet-2',
    category: 'veterinary',
    amount: 30,
    currency: 'TRY',
    date: '2026-02-12T10:00:00.000Z',
    createdAt: '2026-02-12T10:00:00.000Z',
  },
  {
    _id: 'exp-3',
    petId: 'pet-1',
    category: 'food',
    amount: 40,
    currency: 'TRY',
    date: '2026-01-15T10:00:00.000Z',
    createdAt: '2026-01-15T10:00:00.000Z',
  },
];

describe('calculateBudgetStatus', () => {
  it('computes monthly spending, alert state and breakdowns', () => {
    const status = calculateBudgetStatus(
      budget,
      expenses,
      (petId) => (petId === 'pet-1' ? 'Luna' : 'Milo'),
      new Date('2026-02-20T00:00:00.000Z')
    );

    expect(status.currentSpending).toBe(90);
    expect(status.percentage).toBe(90);
    expect(status.remainingAmount).toBe(10);
    expect(status.isAlert).toBe(true);
    expect(status.monthOverMonth?.previous).toBe(40);
    expect(status.monthOverMonth?.changePct).toBe(125);
    expect(status.petBreakdown[0]).toMatchObject({ petId: 'pet-1', petName: 'Luna', spending: 60 });
    expect(status.categoryBreakdown?.[0]).toMatchObject({ category: 'food', total: 60 });
  });

  it('handles zero budget amount without divide-by-zero', () => {
    const status = calculateBudgetStatus(
      { ...budget, amount: 0, alertThreshold: 0.9 },
      expenses,
      () => 'Pet',
      new Date('2026-02-20T00:00:00.000Z')
    );

    expect(status.percentage).toBe(0);
    expect(status.remainingAmount).toBe(-90);
    expect(status.isAlert).toBe(true);
  });
});
