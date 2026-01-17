import { createQueryKeys } from './core/createQueryKeys';

// Pets
const basePetKeys = createQueryKeys('pets');
export const petKeys = {
  ...basePetKeys,
  stats: () => [...basePetKeys.all, 'stats'] as const,
  byType: (type: string) => [...basePetKeys.all, 'type', type] as const,
  infinite: <T extends object | undefined>(filters?: T) =>
    [...basePetKeys.all, 'infinite', filters] as const,
};

// Events
const baseEventKeys = createQueryKeys('events');
export const eventKeys = {
  ...baseEventKeys,
  calendar: (date: string) => [...baseEventKeys.all, 'calendar', date] as const,
  upcoming: () => [...baseEventKeys.all, 'upcoming'] as const,
  today: () => [...baseEventKeys.all, 'today'] as const,
  type: (petId: string, type: string) => [...baseEventKeys.all, 'type', petId, type] as const,
};

// Feeding schedules
const baseFeedingScheduleKeys = createQueryKeys('feeding-schedules');
export const feedingScheduleKeys = {
  ...baseFeedingScheduleKeys,
  active: () => [...baseFeedingScheduleKeys.all, 'active'] as const,
  today: () => [...baseFeedingScheduleKeys.all, 'today'] as const,
  next: () => [...baseFeedingScheduleKeys.all, 'next'] as const,
  activeByPet: (petId: string) => [...baseFeedingScheduleKeys.all, 'active', petId] as const,
};

// Health records
const baseHealthRecordKeys = createQueryKeys('health-records');
export const healthRecordKeys = {
  ...baseHealthRecordKeys,
  list: <T extends object | undefined>(petId: string, filters?: T) =>
    [...baseHealthRecordKeys.lists(), petId, filters] as const,
  byType: (petId: string, type: string) => [...baseHealthRecordKeys.all, 'type', petId, type] as const,
  byDateRange: (petId: string, dateFrom: string, dateTo: string) =>
    [...baseHealthRecordKeys.all, 'date-range', petId, dateFrom, dateTo] as const,
};

// Expenses
const baseExpenseKeys = createQueryKeys('expenses');
export const expenseKeys = {
  ...baseExpenseKeys,
  list: <T extends object | undefined>(filters: T) => [...baseExpenseKeys.lists(), filters] as const,
  stats: <T extends object | undefined>(params?: T) => [...baseExpenseKeys.all, 'stats', params] as const,
  byPet: (petId: string) => [...baseExpenseKeys.all, 'by-pet', petId] as const,
  byCategory: (category: string, petId?: string) => [...baseExpenseKeys.all, 'by-category', category, petId] as const,
  monthly: <T extends object | undefined>(params?: T) => [...baseExpenseKeys.all, 'monthly', params] as const,
  yearly: <T extends object | undefined>(params?: T) => [...baseExpenseKeys.all, 'yearly', params] as const,
  dateRange: <T extends object>(params: T) => [...baseExpenseKeys.all, 'date-range', params] as const,
  infinite: <T extends object | undefined>(petId: string | undefined, filters?: T) =>
    [...baseExpenseKeys.all, 'infinite', petId, filters] as const,
};
