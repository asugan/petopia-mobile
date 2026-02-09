// Environment configuration for Petopia Petcare app
export const ENV = {
  // API Base URL - required for all API calls
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL ?? '',
  API_BASE_PATH: process.env.EXPO_PUBLIC_API_BASEPATH ?? '/auth',

  // Auth configuration
  AUTH: {
    SCHEME: "petopia-petcare",
    STORAGE_PREFIX: "petopia-auth",
  },
  // API Endpoints
  ENDPOINTS: {
    // Pet endpoints
    PETS: "/api/pets",
    PET_BY_ID: (id: string) => `/api/pets/${id}`,
    PET_PHOTO: (id: string) => `/api/pets/${id}/photo`,

    // Health record endpoints
    HEALTH_RECORDS: "/api/health-records",
    HEALTH_RECORDS_BY_PET: (petId: string) =>
      `/api/pets/${petId}/health-records`,
    HEALTH_RECORD_BY_ID: (id: string) => `/api/health-records/${id}`,
    UPCOMING_VACCINATIONS: "/api/health-records/upcoming",

    // Event endpoints
    EVENTS: "/api/events",
    EVENTS_BY_PET: (petId: string) => `/api/pets/${petId}/events`,
    EVENT_BY_ID: (id: string) => `/api/events/${id}`,
    EVENTS_BY_DATE: (date: string) => `/api/events/calendar/${date}`,
    UPCOMING_EVENTS: "/api/events/upcoming",
    TODAY_EVENTS: "/api/events/today",

    // Feeding schedule endpoints
    FEEDING_SCHEDULES: "/api/feeding-schedules",
    FEEDING_SCHEDULES_BY_PET: (petId: string) =>
      `/api/pets/${petId}/feeding-schedules`,
    FEEDING_SCHEDULE_BY_ID: (id: string) => `/api/feeding-schedules/${id}`,
    ACTIVE_FEEDING_SCHEDULES: "/api/feeding-schedules/active",
    TODAY_FEEDING_SCHEDULES: "/api/feeding-schedules/today",
    NEXT_FEEDING: "/api/feeding-schedules/next",
    FEEDING_SCHEDULE_NOTIFICATIONS: (id: string) => `/api/feeding-schedules/${id}/notifications`,
    FEEDING_SCHEDULE_REMINDER: (id: string) => `/api/feeding-schedules/${id}/reminder`,
    FEEDING_SCHEDULE_COMPLETE: (id: string) => `/api/feeding-schedules/${id}/complete`,

    // User Budget endpoints (NEW SIMPLIFIED SYSTEM)
    BUDGET: "/api/budget",
    BUDGET_STATUS: "/api/budget/status",
    BUDGET_ALERTS: "/api/budget/alerts",
    BUDGET_ALERTS_ACK: "/api/budget/alerts/ack",
    BUDGET_ALERTS_CHECK: "/api/budget/alerts/check",
    BUDGET_ALERTS_NOTIFY: "/api/budget/alerts/notify",
    BUDGET_ALERTS_STATUS: "/api/budget/alerts/status",
    BUDGET_ALERTS_HISTORY: "/api/budget/alerts/history",

    // User settings endpoints
    USER_SETTINGS: "/api/settings",
    USER_SETTINGS_CURRENCY: "/api/settings/currency",

    // Account endpoints
    ACCOUNT_DELETE: "/api/account",

    // Expense export endpoints
    EXPENSES_EXPORT_CSV: "/api/expenses/export/csv",
    EXPENSES_EXPORT_PDF: "/api/expenses/export/pdf",
    VET_SUMMARY_PDF: (petId: string) => `/api/expenses/export/vet-summary?petId=${petId}`,

    // Subscription endpoints
    SUBSCRIPTION_STATUS: "/api/subscription/status", // Unified status endpoint
    SUBSCRIPTION_DOWNGRADE_STATUS: "/api/subscription/downgrade-status", // Check if downgrade required
    SUBSCRIPTION_TRIAL_STATUS: "/api/subscription/trial-status", // Deprecated
    SUBSCRIPTION_START_TRIAL: "/api/subscription/start-trial",
    SUBSCRIPTION_VERIFY: "/api/subscription/verify",
    SUBSCRIPTION_DEACTIVATE_TRIAL: "/api/subscription/deactivate-trial", // Deprecated

    // Pet downgrade endpoint
    PETS_DOWNGRADE: "/api/pets/downgrade",
  },

  // Request timeout
  TIMEOUT: 10000,

  // Retry configuration
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,

  // Pagination defaults
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
};
