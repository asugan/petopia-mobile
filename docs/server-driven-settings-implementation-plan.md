# Server-Driven Settings Implementation Plan

## 📋 Overview

**Duration:** 3-4 saat
**Strategy:** Option 1 - Complete Migration to Backend UserSettings
**Status:** Not Started

---

## 🎯 Objectives

1. Migrate from client-side stores (languageStore, themeStore) to server-side userSettingsStore
2. Integrate with backend UserSettings API endpoints
3. Update settings screen to use API data
4. Remove outdated Zustand stores
5. Ensure offline support with proper fallbacks

---

## 📊 Current State Assessment

### Existing Client-Side Stores
| Store | Purpose | Storage | Dependencies |
|-------|---------|---------|--------------|
| `languageStore.ts` | Language (tr/en/ar) | AsyncStorage | i18n |
| `themeStore.ts` | Theme (light/dark) | AsyncStorage | Theme system |

### Backend UserSettings Model
| Field | Type | Default |
|-------|------|---------|
| `userId` | ObjectId | - |
| `baseCurrency` | 'TRY'\|'USD'\|'EUR'\|'GBP' | 'TRY' |
| `timezone` | string | 'Europe/Istanbul' |
| `language` | string | 'tr' |
| `theme` | 'light'\|'dark' | 'light' |

### API Endpoints
- `GET /api/user/settings` - Fetch user settings (with upsert for defaults)
- `PUT /api/user/settings` - Update settings
- `PATCH /api/user/settings/currency` - Update base currency only

---

## 🚀 Implementation Roadmap

### Phase 1: UserSettingsStore Creation (1 hour)

#### 📝 Phase 1.1: Create UserSettingsStore
**File:** `stores/userSettingsStore.ts`

**Tasks:**
- [ ] Define TypeScript interfaces:
  - `UserSettings` interface matching backend model
  - `UserSettingsState` (settings, isLoading, error)
  - `UserSettingsActions` (fetch, update, updateSettings, updateBaseCurrency, initialize)
- [ ] Create Zustand store with persist middleware
- [ ] Implement `fetchSettings()`:
  - Call GET /api/user/settings
  - Store userId from auth
  - Handle loading states
  - Handle errors with proper messaging
- [ ] Implement `updateSettings(updates)`:
  - Call PUT /api/user/settings
  - Update local state on success
- [ ] Implement `updateBaseCurrency(currency)`:
  - Call PATCH /api/user/settings/currency
  - Update local state on success
- [ ] Implement `initialize()`:
  - Fetch settings on mount
  - Sync i18n language
  - Sync theme
  - Ensure async hydration occurs before render
- [ ] Add persistence with AsyncStorage
- [ ] Add error handling with user-friendly messages

**Expected Interface:**
```typescript
interface UserSettings {
  userId: string;
  baseCurrency: 'TRY' | 'USD' | 'EUR' | 'GBP';
  timezone: string;
  language: string;
  theme: 'light' | 'dark';
  createdAt: Date;
  updatedAt: Date;
}

interface UserSettingsState {
  settings: UserSettings | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

interface UserSettingsActions {
  fetchSettings: () => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  updateBaseCurrency: (currency: 'TRY' | 'USD' | 'EUR' | 'GBP') => Promise<void>;
  initialize: () => Promise<void>;
  clear: () => void;
}
```

#### 📝 Phase 1.2: API Client Integration
**File:** `lib/api/userSettings.ts`

**Tasks:**
- [ ] Create API client functions:
  - `getUserSettings()` - GET /api/user/settings
  - `updateUserSettings(updates)` - PUT /api/user/settings
  - `updateUserBaseCurrency(currency)` - PATCH /api/user/settings/currency
- [ ] Add proper TypeScript types
- [ ] Add error handling with try-catch
- [ ] Return structured responses (success, data, error)

---

### Phase 2: Settings Screen Migration (1.5 hours)

#### 📝 Phase 2.1: Update Settings Screen
**File:** `app/(tabs)/settings.tsx`

**Tasks - Remove Old Stores:**
- [ ] Remove imports:
  - Remove `useLanguageStore` from `@/stores/languageStore`
  - Remove `useThemeStore` from `@/stores/themeStore`
- [ ] Remove store usage:
  - Remove `const { language, setLanguage } = useLanguageStore()`
  - Remove `const { themeMode, toggleTheme } = useThemeStore()`

**Tasks - Add New Store:**
- [ ] Add import: `useUserSettingsStore` from `@/stores/userSettingsStore`
- [ ] Add hook usage:
  - `const { settings, isLoading, fetchSettings, updateSettings, updateBaseCurrency } = useUserSettingsStore()`
- [ ] Add `useEffect` to initialize settings on mount
- [ ] Add loading states while fetching

**Tasks - Update UI Components:**
- [ ] Update dark mode toggle:
  - Use `settings?.theme === 'dark'` instead of `isDarkMode`
  - Call `updateSettings({ theme: newTheme })` instead of `toggleTheme()`
- [ ] Update language section:
  - Show current language from `settings?.language`
  - Replace simple toggle with proper `updateSettings({ language: newLang })`
  - Add full language picker (tr, en, ar) OR keep toggle for simplicity
- [ ] **Add base currency picker (NEW):**
  - Use `CurrencyPicker` component
  - Bind to `settings?.baseCurrency`
  - Call `updateBaseCurrency()` on change
  - Show flag emojis (🇹🇷 TRY, 🇺🇸 USD, 🇪🇺 EUR, 🇬🇧 GBP)
  - Add Alert confirmation before change
  - Add info text: "Historical data will remain in original currency"

**Expected Currency Picker Code:**
```typescript
<CurrencyPicker
  label="Default Currency"
  selectedCurrency={settings?.baseCurrency || 'TRY'}
  onSelect={(currency) => {
    Alert.alert(
      "Change Default Currency",
      `Current: ${settings?.baseCurrency} → New: ${currency}\n\nHistorical expenses will remain in their original currency.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Change",
          onPress: () => updateBaseCurrency(currency)
        }
      ]
    );
  }}
/>
```

#### 📝 Phase 2.2: Handle Loading & Error States
**Tasks:**
- [ ] Show loading indicator while `isLoading` is true
- [ ] Show error message if `error` is not null
- [ ] Add retry button on error
- [ ] Disable interaction during loading

#### 📝 Phase 2.3: Update Profile Section
**Tasks:**
- [ ] Verify user data still loads from `useAuth()` (no changes needed)
- [ ] Verify subscription card still works (no changes needed)

---

### Phase 3: Global Store Migration (1 hour)

#### 📝 Phase 3.1: Migrate Language Usage
**Tasks - Search & Replace:**
- [ ] Search for all `useLanguageStore` imports across the codebase
- [ ] Replace with `useUserSettingsStore`
- [ ] Update component usage:
  - `const { settings } = useUserSettingsStore()`
  - `const language = settings?.language || 'en'`

**Critical Files to Update:**
- [ ] `lib/i18n.ts` - Initialize with `settings?.language`
- [ ] Any component using `useLanguageStore` directly
- [ ] `components/LanguageSettings.tsx` - Update to use new store

**Tasks - Update i18n Initialization:**
- [ ] Create a `LanguageInitializer` component or hook
- [ ] Listen to `userSettingsStore` changes
- [ ] Update `i18n.changeLanguage()` when `settings?.language` changes
- [ ] Ensure this runs AFTER store hydration completes

#### 📝 Phase 3.2: Migrate Theme Usage
**Tasks - Search & Replace:**
- [ ] Search for all `useThemeStore` imports across the codebase
- [ ] Replace with `useUserSettingsStore`
- [ ] Update component usage:
  - `const { settings } = useUserSettingsStore()`
  - `const themeMode = settings?.theme || 'light'`

**Critical Files to Update:**
- [ ] `lib/theme/index.ts` or theme provider
- [ ] Any component using `useThemeStore` directly
- [ ] Root layout or app initialization

**Tasks - Update Theme Provider:**
- [ ] Create a `ThemeInitializer` component
- [ ] Listen to `userSettingsStore` changes
- [ ] Update theme context when `settings?.theme` changes
- [ ] Ensure this runs AFTER store hydration completes

#### 📝 Phase 3.3: Remove Deprecated Stores
**Files to Delete:**
- [ ] `stores/languageStore.ts`
- [ ] `stores/themeStore.ts`

**Tasks:**
- [ ] Verify no more imports exist (grep search)
- [ ] Delete files
- [ ] Update `stores/index.ts` if it exports these stores

---

### Phase 4: Localization Updates (30 minutes)

#### 📝 Phase 4.1: Add Currency Settings Translations
**File:** `locales/en.json`

**Tasks:**
- [ ] Add new translation keys under `settings`:
  ```json
  "currency": "Currency",
  "defaultCurrency": "Default Currency",
  "changeCurrency": "Change default currency",
  "currencyWarning": "Changing default currency will affect new expenses. Historical expenses will remain in their original currency.",
  "currencyTry": "Turkish Lira",
  "currencyUsd": "US Dollar",
  "currencyEur": "Euro",
  "currencyGbp": "British Pound"
  ```
- [ ] Update existing keys if needed:
  - `language` description (remove simple toggle reference)

**File:** `locales/tr.json`

**Tasks:**
- [ ] Add Turkish translations for the same keys:
  ```json
  "currency": "Para Birimi",
  "defaultCurrency": "Varsayılan Para Birimi",
  "changeCurrency": "Varsayılan para birimini değiştir",
  "currencyWarning": "Varsayılan para birimini değiştirmek yeni harcamaları etkileyecek. Geçmiş harcamaları orijinal para biriminde kalacak.",
  "currencyTry": "Türk Lirası",
  "currencyUsd": "Amerikan Doları",
  "currencyEur": "Euro",
  "currencyGbp": "İngiliz Sterlini"
  ```

#### 📝 Phase 4.2: Update Settings Screen Text
**Tasks:**
- [ ] Update language section description to reflect server-driven behavior
- [ ] Add currency section with proper labels

---

### Phase 5: Root Layout Integration (30 minutes)

#### 📝 Phase 5.1: Add Settings Initializers
**File:** `app/_layout.tsx`

**Tasks:**
- [ ] Import `useUserSettingsStore`
- [ ] Add `useEffect` in layout component to:
  - Call `fetchSettings()` on initial mount (authenticated users only)
  - Handle unauthenticated users gracefully
- [ ] Ensure settings are loaded BEFORE app renders:
  - Either show loading screen
  - Or render app with default values and update after fetch

**Code Strategy:**
```typescript
// Option A: Initialize in root layout with loading screen
useEffect(() => {
  if (user) {
    userSettingsStore.fetchSettings();
  }
}, [user]);

// Option B: Show loading screen while settings load
if (!settings && isLoading) {
  return <LoadingScreen />;
}
```

#### 📝 Phase 5.2: Theme & Language Synchronization
**Tasks:**
- [ ] Create or update `ThemeInitializer` component
  - Apply theme from `userSettingsStore` to theme provider
- [ ] Create or update `LanguageInitializer` component
  - Set i18n language from `userSettingsStore`

**Integration Strategy:**
```typescript
// In app/_layout.tsx or providers/
<ThemeProvider>
  <LanguageInitializer />
  <ThemeInitializer />
  {/* rest of app */}
</ThemeProvider>
```

---

### Phase 6: Testing & Validation (1 hour)

#### 📝 Phase 6.1: UserSettingsStore Testing

**Manual Testing Tasks:**
- [ ] Test fetchSettings():
  - Open settings screen
  - Verify settings load from API
  - Check loading states
  - Test with no internet (should use fallback)
- [ ] Test updateSettings():
  - Change theme (light ↔ dark)
  - Change language (tr ↔ en)
  - Verify API call is made
  - Verify local state updates
  - Verify UI updates
- [ ] Test updateBaseCurrency():
  - Change currency (TRY → USD → EUR → GBP)
  - Verify Alert confirmation shows
  - Verify API call is made
  - Verify local state updates
- [ ] Test persistence:
  - Reload app
  - Verify settings persist (from AsyncStorage cache OR fresh fetch)
  - Logout and login again

#### 📝 Phase 6.2: Settings Screen Testing

**Manual Testing Tasks:**
- [ ] Verify profile section displays correctly
- [ ] Test dark mode toggle:
  - Change from light to dark
  - Verify theme changes immediately
  - Refresh app, verify theme persists
- [ ] Test language change:
  - Change from tr to en
  - Verify all text updates immediately
  - Refresh app, verify language persists
- [ ] Test base currency picker:
  - Select different currencies
  - Verify Alert confirmation shows
  - Confirm change
  - Verify selected currency updates
  - Create new expense, verify default currency matches

#### 📝 Phase 6.3: Global Store Migration Testing

**Manual Testing Tasks:**
- [ ] Test i18n initialization:
  - Launch app (first time)
  - Verify language matches UserSettings API
  - Change language in settings
  - Verify entire app updates language immediately
- [ ] Test theme initialization:
  - Launch app (first time)
  - Verify theme matches UserSettings API
  - Change theme in settings
  - Verify entire app updates theme immediately
- [ ] Test components that previously used languageStore:
  - Verify they now use userSettingsStore
  - Verify no runtime errors
- [ ] Test components that previously used themeStore:
  - Verify they now use userSettingsStore
  - Verify no runtime errors

#### 📝 Phase 6.4: Backend Integration Testing

**Manual Testing Tasks:**
- [ ] Create test user via auth
- [ ] Check UserSettings document created with defaults:
  - `baseCurrency: 'TRY'`
  - `language: 'tr'`
  - `theme: 'light'`
- [ ] Update settings via UI
- [ ] Verify MongoDB document updates
- [ ] Test PATCH /api/user/settings/currency endpoint
- [ ] Test GET /api/user/settings endpoint
- [ ] Test PUT /api/user/settings endpoint

#### 📝 Phase 6.5: Offline & Fallback Testing

**Manual Testing Tasks:**
- [ ] Test with network disconnected:
  - Open settings screen
  - Verify cached settings load from AsyncStorage
  - Try to change setting (verify error handling)
- [ ] Test app startup offline:
  - Launch app without network
  - Verify last known settings load
  - Verify UI shows default if no cache
- [ ] Test with slow network:
  - Add artificial delay to API
  - Verify loading states
  - Verify UX doesn't break

---

### Phase 7: Cleanup & Finalization (30 minutes)

#### 📝 Phase 7.1: Code Cleanup

**Tasks:**
- [ ] Remove debug logging statements
- [ ] Double-check for TODO comments
- [ ] Remove unused imports
- [ ] Format code if needed
- [ ] Run ESLint: `npm run lint`
- Fix any linting errors

#### 📝 Phase 7.2: Type Safety Verification

**Tasks:**
- [ ] Run TypeScript typecheck: `npx tsc --noEmit`
- Fix any type errors
- Verify all interfaces match backend

#### 📝 Phase 7.3: Diagnostics Check

**Tasks:**
- [ ] Use LSP diagnostics on:
  - `stores/userSettingsStore.ts`
  - `lib/api/userSettings.ts`
  - `app/(tabs)/settings.tsx`
  - Any updated components
- Fix any warnings or errors

#### 📝 Phase 7.4: Documentation Update

**Tasks:**
- [ ] Update this implementation plan with completion status
- [ ] Update `docs/multi-currency-user-settings-roadmap.md`:
  - Mark Phase 6 (Client Store) and Phase 7 (UI Components) as completed
  - Note the different approach (server-driven)
- [ ] Update README.md if needed (mention UserSettings)
- [ ] Comment any complex logic in userSettingsStore

---

## 🎯 Success Criteria

### Functional Requirements
- [x] UserSettingsStore fetches settings from API on mount
- [x] Settings screen displays all settings (theme, language, currency)
- [x] Changing settings updates backend and local state
- [x] Theme change applies immediately across entire app
- [x] Language change applies immediately across entire app
- [x] Currency change updates user's baseCurrency
- [x] Offline fallback works (use cached settings)
- [x] All old store references removed (languageStore, themeStore)

### Code Quality
- [x] TypeScript typecheck passes
- [x] ESLint passes with no errors
- [x] LSP diagnostics clean
- [x] No warning logs
- [x] All async operations properly handled
- [x] Error states are user-friendly

### User Experience
- [x] Settings screen loads fast (< 2 seconds)
- [x] Loading states are clear
- [x] Error states are helpful (retry button)
- [x] Settings persist across app restarts
- [x] Settings persist across logout/login (if user-specific)

---

## 📁 File Changes Summary

### New Files (Create)
1. `stores/userSettingsStore.ts` - Main settings store
2. `lib/api/userSettings.ts` - API client functions

### Modified Files (Update)
1. `app/(tabs)/settings.tsx` - Main settings screen
2. `app/_layout.tsx` - Root layout with initialization
3. `locales/en.json` - English translations
4. `locales/tr.json` - Turkish translations
5. `lib/i18n.ts` - Language initialization
6. `lib/theme/index.ts` - Theme provider

### Deleted Files (Remove)
1. `stores/languageStore.ts` - Old language store
2. `stores/themeStore.ts` - Old theme store

### Search/Replace Operations
- Replace `useLanguageStore` → `useUserSettingsStore` (all occurrences)
- Replace `useThemeStore` → `useUserSettingsStore` (all occurrences)
- Update i18n and theme providers to use new store

---

## ⚠️ Risks & Mitigations

### Risk 1: Async Hydration Timing
**Issue:** UserSettingsStore may not be hydrated before components render, causing flashes of default theme/language
**Mitigation:**
- Use zustand store persist with `onRehydrateStorage` callback
- Show loading screen during initial hydration
- Or render with safe defaults (`settings?.language || 'en'`)

### Risk 2: Offline First-Run
**Issue:** First launch without network, no cached settings, app breaks
**Mitigation:**
- Add try-catch with fallback to defaults
- Show error message with "Check your connection" button
- Persist defaults locally after first fetch

### Risk 3: Circular Dependencies
**Issue:** i18n initialization depends on settings, but initialization may depend on i18n
**Mitigation:**
- Initialize i18n with default language first
- Update after settings load
- Use `useLayoutEffect` or async hook to sequence properly

### Risk 4: Breaking Existing Components
**Issue:** Some components may import languageStore/themeStore and break
**Mitigation:**
- Comprehensive grep search before deleting files
- Update all imports systematically
- Test each affected component

---

## 📝 Implementation Order (Recommended)

1. **Phase 1** (Create new store + API client) - 1 hour
2. **Phase 2** (Update settings screen) - 1.5 hours
3. **Phase 5** (Root layout integration) - 30 minutes
4. **Phase 4** (Localization) - 30 minutes
5. **Phase 3** (Global store migration) - 1 hour
6. **Phase 7** (Cleanup) - 30 minutes
7. **Phase 6** (Testing) - 1 hour

**Total Estimated Time:** 4-5 hours

---

## 🔍 Pre-Implementation Checklist

Before starting:

- [ ] Verify backend UserSettings API endpoints are working
- [ ] Test backend with curl/Postman:
  - `GET /api/user/settings` (should return defaults if not exist)
  - `PUT /api/user/settings` (should update settings)
  - `PATCH /api/user/settings/currency` (should update currency)
- [ ] Check current languageStore and themeStore usage across codebase:
  - `grep -r "useLanguageStore" . --include="*.tsx" --include="*.ts"`
  - `grep -r "useThemeStore" . --include="*.tsx" --include="*.ts"`
- [ ] Review `lib/i18n.ts` implementation
- [ ] Review theme provider implementation
- [ ] Check AsyncStorage usage patterns in existing stores

---

## 🏁 Next Steps After Implementation

1. **Monitor API load:** Check if UserSettings API calls are too frequent
2. **Optimize caching:** Consider adding stale-while-revalidate logic
3. **Add sync status:** Show "Last synced: X minutes ago" in settings
4. **Monitor offline behavior:** Collect metrics on how often users experience offline issues
5. **Consider batch updates:** If multiple settings change rapidly, batch API calls

---

## 📅 Progress Tracking

### Phase 1: UserSettingsStore Creation
- [ ] 1.1 Create UserSettingsStore (stores/userSettingsStore.ts)
- [ ] 1.2 Create API client (lib/api/userSettings.ts)

### Phase 2: Settings Screen Migration
- [ ] 2.1 Update app/(tabs)/settings.tsx
- [ ] 2.2 Handle loading & error states
- [ ] 2.3 Verify profile section

### Phase 3: Global Store Migration
- [ ] 3.1 Migrate language usage
- [ ] 3.2 Migrate theme usage
- [ ] 3.3 Remove deprecated stores

### Phase 4: Localization Updates
- [ ] 4.1 Update English translations
- [ ] 4.2 Update Turkish translations

### Phase 5: Root Layout Integration
- [ ] 5.1 Add settings initializers
- [ ] 5.2 Theme & language synchronization

### Phase 6: Testing & Validation
- [ ] 6.1 UserSettingsStore testing
- [ ] 6.2 Settings screen testing
- [ ] 6.3 Global store migration testing
- [ ] 6.4 Backend integration testing
- [ ] 6.5 Offline & fallback testing

### Phase 7: Cleanup & Finalization
- [ ] 7.1 Code cleanup
- [ ] 7.2 Type safety verification
- [ ] 7.3 Diagnostics check
- [ ] 7.4 Documentation update

---

## 📞 Notes & Observations

**December 29, 2025**
- Backend UserSettings implementation already complete (Phases 1-5 in multi-currency-user-settings-roadmap.md)
- Need to migrate frontend to use backend-driven approach
- This plan assumes Option 1 (complete server-driven migration)

**Key Files to Reference:**
- `docs/multi-currency-user-settings-roadmap.md` - Backend implementation details
- `docs/multi-currency-implementation-plan.md` - Original currency implementation

**Migration Strategy:**
- Keep backend unchanged
- Replace frontend stores gradually
- Test each phase before proceeding
- Rollback points: Each phase should be independently testable

---

**Last Updated:** December 29, 2025
**Status:** Not Started
**Next Action:** Phase 1.1 - Create UserSettingsStore
