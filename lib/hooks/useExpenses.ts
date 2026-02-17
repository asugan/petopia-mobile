import { expenseService } from '../services/expenseService';
import { petService } from '../services/petService';
import type { CreateExpenseInput, Expense, ExpenseStats, MonthlyExpense, Pet, YearlyExpense, UpdateExpenseInput } from '../types';
import { CACHE_TIMES } from '../config/cacheTimes';
import { ENV } from '../config/env';
import { useCreateResource, useDeleteResource, useUpdateResource } from './useCrud';
import { useResource } from './core/useResource';
import { useResources } from './core/useResources';
import { useConditionalQuery } from './core/useConditionalQuery';
import { useLocalInfiniteQuery, useLocalMutation, useLocalQuery } from './core/useLocalAsync';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';
import { expenseKeys } from './queryKeys';

export { expenseKeys } from './queryKeys';

// Type-safe filters for expenses
interface ExpenseFilters {
  petId?: string;
  page?: number;
  limit?: number;
  category?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
  paymentMethod?: string;
}

// Stats params interface
interface StatsParams {
  petId?: string;
  startDate?: string;
  endDate?: string;
  category?: string;
}

// Monthly/Yearly params interface
interface PeriodParams {
  petId?: string;
  year?: number;
  month?: number;
}


// Hook for fetching expenses by pet ID with filters
export function useExpenses(petId?: string, filters: Omit<ExpenseFilters, 'petId'> = {}) {
  const { enabled } = useAuthQueryEnabled();

  return useLocalQuery<{ expenses: Expense[]; total: number }>({
    deps: [JSON.stringify(expenseKeys.list({ petId, ...filters }))],
    defaultValue: { expenses: [], total: 0 },
    enabled,
    queryFn: async () => {
      if (!petId) {
        // If no petId, fetch all pets and combine their expenses
        const petsResult = await petService.getPets();
        if (!petsResult.success) {
          throw new Error('Pets could not be loaded');
        }

        const pets = petsResult.data || [];
        const allExpenses = await Promise.all(
          pets.map(async (pet: Pet) => {
            const result = await expenseService.getExpensesByPetId(pet._id, filters);
            return result.success ? (result.data?.expenses || []) : [];
          })
        );

        // Combine and sort by date (newest first)
        const combined = allExpenses.flat().sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA; // Newest first
        });
        const total = combined.length;

        // Apply pagination manually
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginated = combined.slice(startIndex, endIndex);

        return {
          expenses: paginated,
          total
        };
      } else {
        const result = await expenseService.getExpensesByPetId(petId, filters);
        if (!result.success) {
          throw new Error('Failed to load expenses');
        }
        return result.data || { expenses: [], total: 0 };
      }
    },
  });
}

// Hook for fetching a single expense
export function useExpense(id?: string) {
  const { enabled } = useAuthQueryEnabled();

  return useResource<Expense>({
    queryKey: expenseKeys.detail(id!),
    queryFn: () => expenseService.getExpenseById(id!),
    staleTime: CACHE_TIMES.MEDIUM,
    enabled: enabled && !!id,
    errorMessage: 'Failed to load expense',
  });
}

// Hook for infinite scrolling expenses (single pet only - requires petId)
export function useInfiniteExpenses(petId: string | undefined, filters?: Omit<ExpenseFilters, 'petId' | 'page'>) {
  const defaultLimit = ENV.DEFAULT_LIMIT || 20;
  const { enabled } = useAuthQueryEnabled();

  return useLocalInfiniteQuery<Expense[], number>({
    queryFn: async ({ pageParam = 1 }) => {
      if (!petId) {
        return [];
      }

      const queryFilters: ExpenseFilters = {
        page: pageParam,
        limit: defaultLimit,
        ...filters,
      };

      const result = await expenseService.getExpensesByPetId(petId, queryFilters);

      if (!result.success) {
        const errorMessage = typeof result.error === 'string'
          ? result.error
          : result.error?.message || 'Expense could not be loaded';
        throw new Error(errorMessage);
      }

      return result.data?.expenses || [];
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.length < defaultLimit) {
        return undefined;
      }
      return (lastPageParam as number) + 1;
    },
    enabled: enabled && !!petId,
    deps: [JSON.stringify(expenseKeys.infinite(petId, filters))],
  });
}

// Hook for expense statistics
export function useExpenseStats(params?: StatsParams) {
  const { enabled } = useAuthQueryEnabled();

  return useConditionalQuery<ExpenseStats | null>({
    queryKey: expenseKeys.stats(params),
    queryFn: () => expenseService.getExpenseStats(params),
    staleTime: CACHE_TIMES.MEDIUM,
    enabled,
    defaultValue: null,
    errorMessage: 'Failed to load expense statistics',
  });
}

// Hook for monthly expenses
export function useMonthlyExpenses(params?: PeriodParams) {
  const { enabled } = useAuthQueryEnabled();

  return useResources<MonthlyExpense>({
    queryKey: expenseKeys.monthly(params),
    queryFn: () => expenseService.getMonthlyExpenses(params),
    staleTime: CACHE_TIMES.MEDIUM,
    enabled,
  });
}

// Hook for yearly expenses
export function useYearlyExpenses(params?: Omit<PeriodParams, 'month'>) {
  const { enabled } = useAuthQueryEnabled();

  return useResources<YearlyExpense>({
    queryKey: expenseKeys.yearly(params),
    queryFn: () => expenseService.getYearlyExpenses(params),
    staleTime: CACHE_TIMES.MEDIUM,
    enabled,
  });
}

// Hook for expenses by category
export function useExpensesByCategory(category: string, petId?: string) {
  const { enabled } = useAuthQueryEnabled();

  return useConditionalQuery<Expense[]>({
    queryKey: expenseKeys.byCategory(category, petId),
    queryFn: () => expenseService.getExpensesByCategory(category, petId),
    staleTime: CACHE_TIMES.MEDIUM,
    enabled: enabled && !!category,
    defaultValue: [],
    errorMessage: 'Failed to load expenses by category',
  });
}

// Hook for expenses by date range
export function useExpensesByDateRange(params: {
  petId?: string;
  startDate: string;
  endDate: string;
}) {
  const { enabled } = useAuthQueryEnabled();

  return useConditionalQuery<Expense[]>({
    queryKey: expenseKeys.dateRange(params),
    queryFn: () => expenseService.getExpensesByDateRange(params),
    staleTime: CACHE_TIMES.MEDIUM,
    enabled: enabled && !!params.startDate && !!params.endDate,
    defaultValue: [],
    errorMessage: 'Failed to load expenses by date range',
  });
}

// Mutation hook for creating an expense
export function useCreateExpense() {
  return useCreateResource<Expense, CreateExpenseInput>(
    (data) => expenseService.createExpense(data).then(res => res.data!),
    {
      listQueryKey: expenseKeys.all, // Ideally should be more specific but existing code invalidated 'all'
    }
  );
}

// Mutation hook for updating an expense
export function useUpdateExpense() {
  return useUpdateResource<Expense, UpdateExpenseInput>(
    ({ _id, data }) => expenseService.updateExpense(_id, data).then(res => res.data!),
    {
      listQueryKey: expenseKeys.all,
      detailQueryKey: expenseKeys.detail,
    }
  );
}

// Mutation hook for deleting an expense
export function useDeleteExpense() {
  return useDeleteResource<Expense>(
    (id) => expenseService.deleteExpense(id).then(res => res.data), // Assuming delete returns the ID or void
    {
      listQueryKey: expenseKeys.all,
      detailQueryKey: expenseKeys.detail,
    }
  );
}

// Mutation hook for exporting expenses as CSV
export function useExportExpensesCSV() {
  return useLocalMutation({
    mutationFn: async (params?: {
      petId?: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const result = await expenseService.exportExpensesCSV(params);
      if (!result.success) {
        const errorMessage = typeof result.error === 'string'
          ? result.error
          : result.error?.message || 'Failed to export expenses';
        throw new Error(errorMessage);
      }
      return result.data!;
    },
    notifyOnSuccess: false,
  });
}

// Mutation hook for exporting expenses as PDF
export function useExportExpensesPDF() {
  return useLocalMutation({
    mutationFn: async (params?: {
      petId?: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const result = await expenseService.exportExpensesPDF(params);
      if (!result.success || !result.data) {
        const errorMessage = typeof result.error === 'string'
          ? result.error
          : result.error?.message || 'Failed to export expenses PDF';
        throw new Error(errorMessage);
      }
      return result.data.uri;
    },
    notifyOnSuccess: false,
  });
}

// Mutation hook for exporting vet summary PDF for a pet
export function useExportVetSummaryPDF() {
  return useLocalMutation({
    mutationFn: async (petId: string) => {
      const result = await expenseService.exportVetSummaryPDF(petId);
      if (!result.success || !result.data) {
        const errorMessage = typeof result.error === 'string'
          ? result.error
          : result.error?.message || 'Failed to export vet summary PDF';
        throw new Error(errorMessage);
      }
      return result.data.uri;
    },
    notifyOnSuccess: false,
  });
}
