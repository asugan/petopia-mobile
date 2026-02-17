import { usePets } from './usePets';
import { expenseService } from '../services/expenseService';
import { Expense } from '../types';
import { useLocalQuery } from './core/useLocalAsync';
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import { exchangeRateService } from '@/lib/services/exchangeRateService';

export const useRecentExpenses = () => {
  const { data: pets } = usePets();
  const baseCurrency = useUserSettingsStore((state) => state.settings?.baseCurrency ?? 'TRY');

  // Fetch expenses for all pets at once
  const { data, isLoading, isError, error } = useLocalQuery<Expense[]>({
    defaultValue: [],
    deps: [pets?.map((pet) => pet._id).join('|') ?? '', baseCurrency],
    queryFn: async () => {
      if (!pets || pets.length === 0) return [];

      // Fetch expenses for each pet and merge
      const expensesPromises = pets.map((pet) =>
        expenseService.getExpensesByPetId(pet._id, { limit: 3 })
      );

      const responses = await Promise.all(expensesPromises);
      const allExpenses: Expense[] = [];

      responses.forEach((response) => {
        if (response.success && response.data?.expenses) {
          allExpenses.push(...response.data.expenses);
        }
      });

      // Sort by date (newest first) and take top 3
      const recentExpenses = allExpenses
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);

      return exchangeRateService.convertExpensesToCurrency(recentExpenses, baseCurrency);
    },
    enabled: !!pets && pets.length > 0,
  });

  return {
    data: data || [],
    isLoading,
    isError,
    error,
  };
};
