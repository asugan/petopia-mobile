/**
 * Barrel export for all schema modules.
 * Provides convenient imports from a single location.
 */

// Core utilities
export * from './core/validators';
export * from './core/constants';
export * from './core/dateSchemas';
export * from './core/errorHelpers';
// Note: t is exported from validators, not from i18n to avoid duplication

// Common base schemas
export * from './common/baseEntitySchema';
export * from './common/basePetSchema';

// Domain schemas (these re-export some types/constants for convenience)

export {
  EventSchema,
  eventFormSchema,
  eventSchema,
  updateEventSchema,
  type EventFormData,
  type Event,
} from './eventSchema';

export {
  FeedingScheduleSchema,
  feedingScheduleSchema,
  feedingScheduleFormSchema,
  updateFeedingScheduleSchema,
  DAYS_OF_WEEK,
  FOOD_TYPES,
  type FeedingSchedule,
  type FeedingScheduleData,
  type FeedingScheduleFormData,
  type UpdateFeedingScheduleFormData,
  type CreateFeedingScheduleInput,
  type UpdateFeedingScheduleInput,
  type DayOfWeek,
  type FoodType,
  transformFormDataToAPI,
  transformAPIDataToForm,
  getNextFeedingTime,
  getPreviousFeedingTime,
} from './feedingScheduleSchema';

export {
  SetUserBudgetSchema,
  type SetUserBudgetInput,
  formatUserBudgetValidationErrors,
  calculateBudgetPercentage,
  shouldTriggerBudgetAlert,
  formatBudgetAmount,
} from './userBudgetSchema';
