import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { initDatabase } from '@/lib/db/init';
import { createObjectId, nowIsoString } from '@/lib/db/utils';
import { expensesTable, type ExpenseRow } from '@/lib/db/schema/expenses';
import { petsTable } from '@/lib/db/schema/pets';
import type {
  CreateExpenseInput,
  Expense,
  ExpenseCategory,
  ExpenseStats,
  MonthlyExpense,
  UpdateExpenseInput,
  YearlyExpense,
} from '@/lib/types';
import { normalizeToISOString } from '@/lib/utils/dateConversion';

type ExpenseFilters = {
  page?: number;
  limit?: number;
  category?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
  paymentMethod?: string;
};

const mapRowToExpense = (row: ExpenseRow): Expense => ({
  _id: row._id,
  petId: row.petId,
  category: row.category as ExpenseCategory,
  amount: row.amount,
  currency: row.currency as Expense['currency'],
  paymentMethod: row.paymentMethod as Expense['paymentMethod'],
  date: row.date,
  amountBase: typeof row.amountBase === 'number' ? row.amountBase : undefined,
  createdAt: row.createdAt,
});

const toTimestamp = (value: string | Date): number => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const sortExpensesByDateDesc = (expenses: Expense[]): Expense[] => {
  return [...expenses].sort((a, b) => toTimestamp(b.date) - toTimestamp(a.date));
};

const applyFilters = (expenses: Expense[], filters: Omit<ExpenseFilters, 'page' | 'limit'>): Expense[] => {
  const startMs = filters.startDate ? toTimestamp(filters.startDate) : null;
  const endMs = filters.endDate ? toTimestamp(filters.endDate) : null;

  return expenses.filter((expense) => {
    if (filters.category && expense.category !== filters.category) {
      return false;
    }
    if (filters.currency && expense.currency !== filters.currency) {
      return false;
    }
    if (filters.paymentMethod && expense.paymentMethod !== filters.paymentMethod) {
      return false;
    }
    if (typeof filters.minAmount === 'number' && expense.amount < filters.minAmount) {
      return false;
    }
    if (typeof filters.maxAmount === 'number' && expense.amount > filters.maxAmount) {
      return false;
    }

    const expenseMs = toTimestamp(expense.date);
    if (typeof startMs === 'number' && expenseMs < startMs) {
      return false;
    }
    if (typeof endMs === 'number' && expenseMs > endMs) {
      return false;
    }

    return true;
  });
};

const getMonthKey = (dateLike: string | Date): string => {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) {
    return '1970-01';
  }
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const getYear = (dateLike: string | Date): number => {
  const date = new Date(dateLike);
  return Number.isNaN(date.getTime()) ? 1970 : date.getUTCFullYear();
};

const getMonth = (dateLike: string | Date): number => {
  const date = new Date(dateLike);
  return Number.isNaN(date.getTime()) ? 1 : date.getUTCMonth() + 1;
};

const getMonthRange = (year: number, month: number): { start: number; end: number } => {
  const start = Date.UTC(year, month - 1, 1, 0, 0, 0, 0);
  const end = Date.UTC(year, month, 1, 0, 0, 0, 0) - 1;
  return { start, end };
};

export class ExpenseRepository {
  constructor() {
    initDatabase();
  }

  getAllExpenses(): Expense[] {
    const rows = db.select().from(expensesTable).all();
    return rows.map(mapRowToExpense);
  }

  getExpenseById(id: string): Expense | null {
    const row = db.select().from(expensesTable).where(eq(expensesTable._id, id)).get();
    return row ? mapRowToExpense(row) : null;
  }

  getExpensesByPetId(
    petId: string,
    filters: ExpenseFilters = {},
  ): { expenses: Expense[]; total: number } {
    const rows = db
      .select()
      .from(expensesTable)
      .where(eq(expensesTable.petId, petId))
      .all();

    const base = rows.map(mapRowToExpense);
    const filtered = applyFilters(base, filters);
    const sorted = sortExpensesByDateDesc(filtered);
    const total = sorted.length;

    const page = Math.max(filters.page ?? 1, 1);
    const limit = Math.max(filters.limit ?? (total || 1), 1);
    const offset = (page - 1) * limit;

    return {
      expenses: sorted.slice(offset, offset + limit),
      total,
    };
  }

  getExpenses(filters: Omit<ExpenseFilters, 'page' | 'limit'> = {}): Expense[] {
    const filtered = applyFilters(this.getAllExpenses(), filters);
    return sortExpensesByDateDesc(filtered);
  }

  createExpense(data: CreateExpenseInput): Expense {
    const now = nowIsoString();
    const _id = createObjectId();

    db.insert(expensesTable)
      .values({
        _id,
        petId: data.petId,
        category: data.category,
        amount: data.amount,
        currency: data.currency ?? 'USD',
        paymentMethod: data.paymentMethod ?? null,
        date: normalizeToISOString(data.date) ?? now,
        amountBase: null,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const created = this.getExpenseById(_id);
    if (!created) {
      throw new Error('Failed to create expense');
    }

    return created;
  }

  updateExpense(id: string, data: UpdateExpenseInput): Expense | null {
    const updates: Partial<typeof expensesTable.$inferInsert> = {
      updatedAt: nowIsoString(),
    };

    if (typeof data.category !== 'undefined') {
      updates.category = data.category;
    }
    if (typeof data.amount !== 'undefined') {
      updates.amount = data.amount;
    }
    if (typeof data.currency !== 'undefined') {
      updates.currency = data.currency;
    }
    if (typeof data.paymentMethod !== 'undefined') {
      updates.paymentMethod = data.paymentMethod ?? null;
    }
    if (typeof data.date !== 'undefined') {
      updates.date = normalizeToISOString(data.date) ?? nowIsoString();
    }

    const result = db.update(expensesTable).set(updates).where(eq(expensesTable._id, id)).run();
    if (result.changes === 0) {
      return null;
    }

    return this.getExpenseById(id);
  }

  deleteExpense(id: string): boolean {
    const result = db.delete(expensesTable).where(eq(expensesTable._id, id)).run();
    return result.changes > 0;
  }

  getExpenseStats(params: {
    petId?: string;
    startDate?: string;
    endDate?: string;
    category?: string;
  } = {}): ExpenseStats {
    const expenses = params.petId
      ? this.getExpensesByPetId(params.petId, {
        category: params.category,
        startDate: params.startDate,
        endDate: params.endDate,
      }).expenses
      : this.getExpenses({
        category: params.category,
        startDate: params.startDate,
        endDate: params.endDate,
      });

    const total = expenses.reduce((acc, item) => acc + item.amount, 0);
    const count = expenses.length;
    const average = count > 0 ? total / count : 0;

    const byCategoryMap = new Map<string, { total: number; count: number }>();
    const byCurrencyMap = new Map<string, number>();

    for (const expense of expenses) {
      const categoryEntry = byCategoryMap.get(expense.category) ?? { total: 0, count: 0 };
      categoryEntry.total += expense.amount;
      categoryEntry.count += 1;
      byCategoryMap.set(expense.category, categoryEntry);

      const currencyTotal = byCurrencyMap.get(expense.currency) ?? 0;
      byCurrencyMap.set(expense.currency, currencyTotal + expense.amount);
    }

    return {
      total,
      count,
      average,
      byCategory: [...byCategoryMap.entries()].map(([category, value]) => ({
        category: category as ExpenseCategory,
        total: value.total,
        count: value.count,
      })),
      byCurrency: [...byCurrencyMap.entries()].map(([currency, value]) => ({
        currency: currency as Expense['currency'],
        total: value,
      })),
    };
  }

  getMonthlyExpenses(params: {
    petId?: string;
    year?: number;
    month?: number;
  } = {}): MonthlyExpense[] {
    const base = params.petId
      ? this.getExpensesByPetId(params.petId).expenses
      : this.getAllExpenses();

    const filtered = base.filter((expense) => {
      const year = getYear(expense.date);
      const month = getMonth(expense.date);
      if (typeof params.year === 'number' && year !== params.year) {
        return false;
      }
      if (typeof params.month === 'number' && month !== params.month) {
        return false;
      }
      return true;
    });

    const monthMap = new Map<string, Expense[]>();
    for (const expense of filtered) {
      const key = getMonthKey(expense.date);
      const list = monthMap.get(key) ?? [];
      list.push(expense);
      monthMap.set(key, list);
    }

    return [...monthMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, expenses]) => {
        const byCategoryMap = new Map<string, number>();
        for (const expense of expenses) {
          byCategoryMap.set(
            expense.category,
            (byCategoryMap.get(expense.category) ?? 0) + expense.amount,
          );
        }

        return {
          month,
          total: expenses.reduce((sum, item) => sum + item.amount, 0),
          count: expenses.length,
          byCategory: [...byCategoryMap.entries()].map(([category, total]) => ({
            category: category as ExpenseCategory,
            total,
          })),
        };
      });
  }

  getYearlyExpenses(params: { petId?: string; year?: number } = {}): YearlyExpense[] {
    const base = params.petId
      ? this.getExpensesByPetId(params.petId).expenses
      : this.getAllExpenses();

    const filtered = base.filter((expense) => {
      if (typeof params.year !== 'number') {
        return true;
      }
      return getYear(expense.date) === params.year;
    });

    const yearMap = new Map<number, Expense[]>();
    for (const expense of filtered) {
      const year = getYear(expense.date);
      const list = yearMap.get(year) ?? [];
      list.push(expense);
      yearMap.set(year, list);
    }

    return [...yearMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([year, expenses]) => {
        const byMonthMap = new Map<number, number>();
        for (const expense of expenses) {
          const month = getMonth(expense.date);
          byMonthMap.set(month, (byMonthMap.get(month) ?? 0) + expense.amount);
        }

        return {
          year,
          total: expenses.reduce((sum, item) => sum + item.amount, 0),
          count: expenses.length,
          byMonth: [...byMonthMap.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([month, total]) => ({ month, total })),
        };
      });
  }

  getExpensesByCategory(category: string, petId?: string): Expense[] {
    return this.getExpenses({ category }).filter((expense) => {
      if (!petId) {
        return expense.category === category;
      }

      return expense.category === category && expense.petId === petId;
    });
  }

  getExpensesByDateRange(params: {
    petId?: string;
    startDate: string;
    endDate: string;
  }): Expense[] {
    if (params.petId) {
      return this.getExpensesByPetId(params.petId, {
        startDate: params.startDate,
        endDate: params.endDate,
      }).expenses;
    }

    return this.getExpenses({
      startDate: params.startDate,
      endDate: params.endDate,
    });
  }

  getPetNameById(petId: string): string {
    const pet = db.select().from(petsTable).where(eq(petsTable._id, petId)).get();
    return pet?.name ?? petId;
  }

  getCurrentMonthSpendingByPet(): { petId: string; petName: string; spending: number }[] {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;
    const { start, end } = getMonthRange(year, month);

    const currentMonthExpenses = this.getAllExpenses().filter((expense) => {
      const ts = toTimestamp(expense.date);
      return ts >= start && ts <= end;
    });

    const byPet = new Map<string, number>();
    for (const expense of currentMonthExpenses) {
      byPet.set(expense.petId, (byPet.get(expense.petId) ?? 0) + expense.amount);
    }

    return [...byPet.entries()].map(([petId, spending]) => ({
      petId,
      petName: this.getPetNameById(petId),
      spending,
    }));
  }
}

export const expenseRepository = new ExpenseRepository();
