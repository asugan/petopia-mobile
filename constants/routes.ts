// Onboarding routes
export const ONBOARDING_ROUTES = {
  step1: '/(onboarding)/index',
  step2: '/(onboarding)/step2',
  completed: '/(onboarding)/completed',
} as const;

// Auth routes
export const AUTH_ROUTES = {
  login: '/(auth)/login',
  register: '/(auth)/register',
} as const;

// Tab routes
export const TAB_ROUTES = {
  home: '/(tabs)',
  pets: '/(tabs)/pets',
  calendar: '/(tabs)/calendar',
  care: '/(tabs)/care',
  finance: '/(tabs)/finance',
  settings: '/(tabs)/settings',
} as const;

// Feature detail routes (dynamic)
export const FEATURE_ROUTES = {
  petDetail: (id: string) => `/pet/${id}`,
  petHealth: (id: string) => `/health/${id}`,
  petEvent: (id: string) => `/event/${id}`,
} as const;

// Subscription routes
export const SUBSCRIPTION_ROUTES = {
  main: '/subscription',
  downgrade: '/downgrade',
} as const;

// Settings sub-routes
export const SETTINGS_ROUTES = {
  recurrence: '/settings/recurrence',
} as const;

// Root/Entry routes
export const ROOT_ROUTES = {
  index: '/',
  _layout: '/_layout',
} as const;

// Helper: All routes export
export const ROUTES = {
  onboarding: ONBOARDING_ROUTES,
  auth: AUTH_ROUTES,
  tabs: TAB_ROUTES,
  feature: FEATURE_ROUTES,
  subscription: SUBSCRIPTION_ROUTES,
  settings: SETTINGS_ROUTES,
  root: ROOT_ROUTES,
} as const;
