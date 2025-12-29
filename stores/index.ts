// ✅ Tüm store'ları tek yerden export etme
export { usePetUIStore } from './petStore';
export { useThemeStore } from './themeStore';
export { useLanguageStore } from './languageStore';
export { useSubscriptionStore } from './subscriptionStore';
export { useEventReminderStore } from './eventReminderStore';

// Store türleri için type exports
export type { PetUIState, PetUIActions } from './petStore';
export type { ThemeState, ThemeActions } from './themeStore';
export type { LanguageState, LanguageActions, Language } from './languageStore';
export type { SubscriptionState, SubscriptionActions } from './subscriptionStore';
export type { EventLocalStatus } from './eventReminderStore';

// Re-export for backward compatibility (deprecated)
// Use usePetUIStore instead
export { usePetUIStore as usePetStore } from './petStore';
