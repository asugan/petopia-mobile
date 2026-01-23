import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { expenseService } from '../services/expenseService';
import { petService } from '../services/petService';
import type { CreateExpenseInput, Expense, ExpenseStats, MonthlyExpense, Pet, YearlyExpense, UpdateExpenseInput } from '../types';
import { CACHE_TIMES } from '../config/queryConfig';
import { ENV } from '../config/env';
import { useCreateResource, useDeleteResource, useUpdateResource } from './useCrud';
import { userBudgetKeys } from './useUserBudget';
import { useResource } from './core/useResource';
import { useResources } from './core/useResources';
import { useConditionalQuery } from './core/useConditionalQuery';
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

  return useQuery({
    queryKey: expenseKeys.list({ petId, ...filters }),
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
    staleTime: CACHE_TIMES.SHORT,
    placeholderData: (previousData) => previousData ?? { expenses: [], total: 0 }, // Keep previous page data for pagination
    enabled,
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

  return useInfiniteQuery({
    queryKey: expenseKeys.infinite(petId, filters),
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
    staleTime: CACHE_TIMES.MEDIUM,
    gcTime: CACHE_TIMES.LONG,
    enabled: enabled && !!petId,
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
  const queryClient = useQueryClient();

  return useCreateResource<Expense, CreateExpenseInput>(
    (data) => expenseService.createExpense(data).then(res => res.data!),
    {
      listQueryKey: expenseKeys.all, // Ideally should be more specific but existing code invalidated 'all'
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: expenseKeys.byPet(data.petId) });
        queryClient.invalidateQueries({ 
          predicate: (query) => 
            query.queryKey[0] === 'expenses' && 
            query.queryKey[1] === 'infinite' &&
            query.queryKey[2] === data.petId
        });
        queryClient.invalidateQueries({ queryKey: userBudgetKeys.status() });
        queryClient.invalidateQueries({ queryKey: userBudgetKeys.summary() });
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      }
    }
  );
}

// Mutation hook for updating an expense
export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useUpdateResource<Expense, UpdateExpenseInput>(
    ({ _id, data }) => expenseService.updateExpense(_id, data).then(res => res.data!),
    {
      listQueryKey: expenseKeys.all,
      detailQueryKey: expenseKeys.detail,
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: expenseKeys.byPet(data.petId) });
        queryClient.invalidateQueries({ 
          predicate: (query) => 
            query.queryKey[0] === 'expenses' && 
            query.queryKey[1] === 'infinite' &&
            query.queryKey[2] === data.petId
        });
        queryClient.invalidateQueries({ queryKey: userBudgetKeys.status() });
        queryClient.invalidateQueries({ queryKey: userBudgetKeys.summary() });
      },
      onSettled: (data) => {
        queryClient.invalidateQueries({ queryKey: expenseKeys.all });
        if (data) {
             queryClient.invalidateQueries({ queryKey: expenseKeys.detail(data._id) });
        }
      }
    }
  );
}

// Mutation hook for deleting an expense
export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useDeleteResource<Expense>(
    (id) => expenseService.deleteExpense(id).then(res => res.data), // Assuming delete returns the ID or void
    {
      listQueryKey: expenseKeys.all,
      detailQueryKey: expenseKeys.detail,
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: expenseKeys.all });
        queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'expenses' && query.queryKey[1] === 'infinite' });
        queryClient.invalidateQueries({ queryKey: userBudgetKeys.status() });
        queryClient.invalidateQueries({ queryKey: userBudgetKeys.summary() });
      }
    }
  );
}

// Mutation hook for exporting expenses as CSV
export function useExportExpensesCSV() {
  return useMutation({
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
  });
}

// Mutation hook for exporting expenses as PDF
export function useExportExpensesPDF() {
  return useMutation({
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
  });
}

// Mutation hook for exporting vet summary PDF for a pet
export function useExportVetSummaryPDF() {
  return useMutation({
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
  });
}
