import { useQuery } from '@tanstack/react-query';
import { usePets } from './usePets';
import { expenseService } from '../services/expenseService';
import { Expense } from '../types';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';

export const useRecentExpenses = () => {
  const { enabled } = useAuthQueryEnabled();
  const { data: pets } = usePets();

  // Fetch expenses for all pets at once
  const { data, isLoading, isError } = useQuery({
    queryKey: ['expenses', 'all-pets', { limit: 3 }],
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
      return allExpenses
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);
    },
    enabled: enabled && !!pets && pets.length > 0,
  });

  return {
    data: data || [],
    isLoading,
    isError,
    error: null
  };
};
