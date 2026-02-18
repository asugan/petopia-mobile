# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Development
npm start              # Start Expo dev server
npm run android        # Run on Android device/emulator
npm run ios            # Run on iOS simulator/device
npm run web            # Run in browser

# Code Quality
npm run lint           # Run ESLint
npx tsc --noEmit       # TypeScript strict check

# Testing
npm run test           # Run Vitest unit tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
```

## Architecture Overview

### Navigation (Expo Router)
File-based routing in `app/` directory:
- `(tabs)/` - Main app tabs (calendar, care, finance, pets, settings)
- `(onboarding)/` - Onboarding flow
- `pet/` - Pet detail screens
- `event/` - Event screens
- `health/` - Health records screens
- Root layout in `app/_layout.tsx` wraps providers

### State Management

**Local-first Domain Hooks** - `lib/hooks/`:
- Local dependency key pattern: `petKeys.list(filters)`, `petKeys.detail(id)`
- Core hooks in `lib/hooks/core/`: `useLocalQuery`, `useResource`, `useConditionalQuery`, etc.
- Mutations publish local data refresh via `notifyLocalDataChanged()`

**Client State (Zustand)** - `stores/`:
- Persisted stores with AsyncStorage (user settings, theme, subscription)
- Pattern: `create() + persist()` with actions in same hook

### Data Layer

**Local DB** - `lib/db/` + `lib/repositories/`:
- Engine: `expo-sqlite`
- ORM: `drizzle-orm`
- Tables are created idempotently at app startup

**Services Pattern** - `lib/services/`:
```typescript
// Service class pattern
class PetService {
  async createPet(data): Promise<ApiResponse<Pet>> { ... }
  async getPets(params?): Promise<ApiResponse<Pet[]>> { ... }
}
export const petService = new PetService();
```

### Forms

**Pattern** - Schema → Hook → Component:
1. `lib/schemas/*.ts` - Zod schemas with i18n validation messages
2. `hooks/use*Form.ts` - React Hook Form + zodResolver
3. `components/forms/*.tsx` - Smart input components (SmartDatePicker, SmartDropdown, FormWeightInput, etc.)

### Providers Hierarchy

```
NetworkStatus
  → PostHogProviderWrapper
    → LanguageProvider (i18n)
      → ApiErrorBoundary
        → AnalyticsIdentityProvider (device identity)
          → SubscriptionProvider (RevenueCat)
            → App Content (Stack navigator)
```

## Key Conventions

- **Path alias**: Use `@/` prefix for absolute imports from root
- **Import order**: React → React Native → Libraries → @/ → Relative
- **IDs**: MongoDB ObjectId format (24-character hex)
- **Naming**: PascalCase for components/types, camelCase for hooks/utils
- **i18n**: All user-facing strings in `locales/en.json` and `locales/tr.json`

## Important Files

- `lib/db/init.ts` - Local database initialization
- `lib/config/env.ts` - App runtime constants
- `lib/theme/` - Theme colors, fonts, and types
- `providers/` - Subscription, analytics identity, and language providers
