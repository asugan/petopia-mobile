// Core generic query hooks (DRY pattern)
export * from "./core/createQueryKeys";
export * from "./core/useResource";
export * from "./core/useResources";
export * from "./core/useConditionalQuery";
export type * from "./core/types";

export * from "./useAuthQueryEnabled";

// Resource-specific hooks
export * from "./usePets";
export * from "./useHealthRecords";
export * from "./useEvents";
export * from "./useFeedingSchedules";
export * from "./useExpenses";
export * from "./useUserBudget";
export * from "./usePendingPet";
export * from "./useOnboardingCompletion";

// CRUD mutation hooks
export * from "./useCrud";

// Performance optimization hooks
export * from "./useOnlineManager";
export * from "./usePrefetchData";
export * from "./useRequestCancellation";
export * from "./useSmartPrefetching";
export * from "./useRealtimeUpdates";

// Device integration hooks
export * from "./useDeviceLanguage";

// Responsive design hooks
export * from "./useResponsiveSize";

