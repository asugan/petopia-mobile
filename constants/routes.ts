import type { Href } from 'expo-router';

// Onboarding routes
export const ONBOARDING_ROUTES = {
  index: '/(onboarding)' as const,
  step1: '/(onboarding)' as const,
  welcome: '/(onboarding)/welcome' as const,
  step2: '/(onboarding)/step2' as const,
  completed: '/(onboarding)/completed' as const,
};

// Auth routes
export const AUTH_ROUTES = {
  login: '/(auth)/login' as const,
  register: '/(auth)/register' as const,
};

// Tab routes
export const TAB_ROUTES = {
  home: '/(tabs)' as const,
  pets: '/(tabs)/pets' as const,
  calendar: '/(tabs)/calendar' as const,
  care: '/(tabs)/care' as const,
  finance: '/(tabs)/finance' as const,
  settings: '/(tabs)/settings' as const,
};

// Feature detail routes (dynamic)
export const FEATURE_ROUTES = {
  petDetail: (id: string) => `/pet/${id}` as Href,
  petHealth: (id: string) => `/health/${id}` as Href,
  petEvent: (id: string) => `/event/${id}` as Href,
};

// Subscription routes
export const SUBSCRIPTION_ROUTES = {
  main: '/subscription' as const,
  downgrade: '/downgrade' as const,
};

// Settings sub-routes
export const SETTINGS_ROUTES = {
  recurrence: '/settings/recurrence' as const,
};

// Root/Entry routes
export const ROOT_ROUTES = {
  index: '/' as const,
  _layout: '/_layout' as const,
};

// Helper: All routes export
export const ROUTES = {
  onboarding: ONBOARDING_ROUTES,
  auth: AUTH_ROUTES,
  tabs: TAB_ROUTES,
  feature: FEATURE_ROUTES,
  subscription: SUBSCRIPTION_ROUTES,
  settings: SETTINGS_ROUTES,
  root: ROOT_ROUTES,
};
