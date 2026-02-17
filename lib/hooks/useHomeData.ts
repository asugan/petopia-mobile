import { useUserBudgetStatus } from "@/lib/hooks/useUserBudget";
import { useTodayEvents, useUpcomingEvents } from "@/lib/hooks/useEvents";
import { useExpenseStats } from "@/lib/hooks/useExpenses";
import { useAllPetsHealthRecords } from "@/lib/hooks/useHealthRecords";
import { usePets } from "@/lib/hooks/usePets";
import { useRecentExpenses } from "@/lib/hooks/useRecentExpenses";
import { useResponsiveSize } from "@/lib/hooks/useResponsiveSize";
import { Event } from "@/lib/types";

export const useHomeData = () => {
  const { isMobile, scrollPadding } = useResponsiveSize();

  // Data fetching
  const {
    data: pets,
    isLoading: petsLoading,
    error: petsError,
    refetch: refetchPets,
  } = usePets();
  const { data: todayEvents, isLoading: eventsLoading } = useTodayEvents();
  const { data: upcomingEvents, isLoading: upcomingEventsLoading } =
    useUpcomingEvents();
  const { data: expenseStats } = useExpenseStats();
  const { data: budgetStatus } = useUserBudgetStatus();
  const { data: recentExpenses, isLoading: recentExpensesLoading } =
    useRecentExpenses();

  // Derived Data
  const petIds = (pets || []).map((p) => p._id);
  const { data: allHealthRecords } = useAllPetsHealthRecords(petIds);

  // Financial Calculations
  const monthlyExpense = expenseStats?.total || 0;
  const monthlyBudget = budgetStatus?.budget?.amount || 800;
  const expensePercentage =
    monthlyBudget > 0 ? (monthlyExpense / monthlyBudget) * 100 : 0;

  const upcomingVaccinations = (upcomingEvents || []).filter(
    (event) => event.type === "vaccination"
  );

  const isLoading =
    petsLoading ||
    eventsLoading ||
    upcomingEventsLoading ||
    recentExpensesLoading;

  return {
    layout: { isMobile, scrollPadding },
    data: {
      pets,
      todayEvents,
      upcomingEvents,
      upcomingVaccinations,
      allHealthRecords,
      recentExpenses,
    },
    financial: {
      monthlyExpense,
      monthlyBudget,
      expensePercentage,
      budgetStatus,
    },
    status: {
      isLoading,
      error: petsError,
      refetch: refetchPets,
    },
  };
};

// Helper Functions (Logic)
export const getPetUpcomingEvents = (petId: string, events?: Event[]) => {
  if (!events) return 0;
  return events.filter((event) => event.petId === petId).length;
};

export const getPetUpcomingVaccinations = (
  petId: string,
  events?: Event[]
) => {
  if (!events) return 0;
  return events.filter((event) => event.petId === petId && event.type === "vaccination")
    .length;
};
