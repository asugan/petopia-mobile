# Multi-Currency User Settings Implementation Plan

## 📋 Overview

- **Proje:** Petopia Petcare App
- **Durum:** Multi-currency backend completed, now adding user-specific base currency
- **Hedef:** UserSettings modeli ile user preferences yönetimi (currency, theme, language, etc.)
- **Base Currency:** UserSettings'den dinamik olarak alınacak
- **Note:** DB reset yapılacak, migration gerekmiyor

---

## ✅ Completed Work

### Backend
- ✅ Database Schema (IExpenseDocument with baseCurrency, amountBase, fxRate, fxAsOf)
- ✅ ExchangeRate Model (MongoDB caching with 24h TTL)
- ✅ ExchangeRateService (Frankfurter API integration)
- ✅ ExpenseService (currency conversion logic in create/update)
- ✅ UserBudgetService (aggregation with baseCurrency/amountBase)
- ✅ Logger utility
- ✅ TypeScript typecheck passed
- ✅ Build successful
- ✅ **Phase 1 - Database & Models**: UserSettings model completed (IUserSettingsDocument, UserSettingsModel)
- ✅ **Phase 2 - Services**: UserSettingsService created, ExpenseService updated to use UserSettings
- ✅ **Phase 3 - Controllers**: UserSettingsController with 3 endpoints (GET /, PUT /, PATCH /currency)
- ✅ **Phase 4 - Routes**: UserSettings routes created and integrated at `/api/user/settings`
- ✅ **Phase 5 - Model Exports**: UserSettingsModel exported correctly
- ✅ **ReportService**: Updated to use user's baseCurrency for PDF generation

### Mobile
- ✅ Currency utility (formatCurrency, getCurrencyIcon, etc.)
- ✅ CurrencyInput component
- ✅ Expense/Finance components updated

---

## 🚀 Roadmap: User Settings Implementation

### Phase 1: Database & Models (Backend)

#### ✅ TODO 1.1: Create UserSettings Model
**File:** `src/models/mongoose/userSettings.ts`
- [x] Create IUserSettingsDocument interface in `types.ts`
- [x] Create UserSettingsModel with schema
- [x] Add fields: userId, baseCurrency (enum), timezone, language, theme
- [x] Add default values: baseCurrency='TRY', timezone='Europe/Istanbul', language='tr', theme='light'
- [x] Add updatedAt timestamp (pre-save hook)
- [x] Add unique index on userId
- [x] Export UserSettingsModel

**Expected Fields:**
```typescript
{
  userId: ObjectId unique,
  baseCurrency: 'TRY' | 'USD' | 'EUR' | 'GBP',
  timezone: string,
  language: string,
  theme: 'light' | 'dark',
  createdAt: Date,
  updatedAt: Date
}
```

---

### Phase 2: Services (Backend)

#### ✅ TODO 2.1: Update ExpenseService
**File:** `src/services/expenseService.ts`
- [x] Import UserSettingsModel
- [x] Update `createExpense()` method:
  - Fetch userSettings by userId
  - Use `userSettings.baseCurrency || 'TRY'` as baseCurrency
  - Keep existing conversion logic
- [x] Update `updateExpense()` method:
  - Fetch userSettings by userId
  - Use `userSettings.baseCurrency || 'TRY'` as baseCurrency
  - Keep existing conversion logic

---

#### ✅ TODO 2.2: Create UserSettingsService
**File:** `src/services/userSettingsService.ts`
- [x] Create UserSettingsService class
- [x] Implement `getSettings(userId)` method:
  - Find settings by userId
  - If not found, create with defaults (upsert)
  - Return settings
- [x] Implement `updateSettings(userId, updates)` method:
  - Validate updates
  - Update settings with new values
  - Return updated settings
- [x] Implement `updateBaseCurrency(userId, baseCurrency)` method:
  - Validate baseCurrency (TRY, USD, EUR, GBP)
  - Update baseCurrency field
  - Return updated settings

---

### Phase 3: Controllers (Backend)

#### ✅ TODO 3.1: Create UserSettingsController
**File:** `src/controllers/userSettingsController.ts`
- [x] Import required modules (UserSettingsModel, response utils)
- [x] Implement `getUserSettings()` endpoint:
  - Get userId from payload
  - Call userSettingsService.getSettings()
  - Return response
- [x] Implement `updateUserSettings()` endpoint:
  - Get userId from payload
  - Validate request body
  - Call userSettingsService.updateSettings()
  - Return response
- [x] Implement `updateBaseCurrency()` endpoint:
  - Get userId from payload
  - Validate baseCurrency
  - Call userSettingsService.updateBaseCurrency()
  - Return response

---

### Phase 4: Routes (Backend)

#### ✅ TODO 4.1: Create UserSettings Routes
**File:** `src/routes/userSettings.ts`
- [x] Import Router and userSettingsController
- [x] Create router instance
- [x] Add authMiddleware to all routes
- [x] Add route: `GET /` → getUserSettings
- [x] Add route: `PUT /` → updateUserSettings
- [x] Add route: `PATCH /currency` → updateBaseCurrency
- [x] Export router

---

#### ✅ TODO 4.2: Integrate Routes
**File:** `src/routes/index.ts`
- [x] Import userSettingsRouter
- [x] Mount router: `app.use('/api/user/settings', userSettingsRouter)`

---

### Phase 5: Model Index Updates (Backend)

#### ✅ TODO 5.1: Update Model Exports
**File:** `src/models/mongoose/index.ts`
- [x] Import UserSettingsModel
- [x] Add UserSettingsModel to exports object
- [x] Verify all models exported correctly

---

### Phase 6: Client Store (Mobile)

#### ✅ TODO 6.1: Create UserSettingsStore
**File:** `stores/userSettingsStore.ts`
- [ ] Define UserSettings interface
- [ ] Define UserSettingsStore interface:
  - settings, isLoading, error states
  - fetchSettings() method
  - updateSettings() method
  - updateBaseCurrency() method
- [ ] Create Zustand store with async actions
- [ ] Add error handling and loading states
- [ ] Export useUserSettingsStore hook

---

### Phase 7: UI Components (Mobile)

#### ✅ TODO 7.1: Create Settings Screen
**File:** `app/profile/settings/index.tsx`
- [ ] Import necessary modules (React, Zustand store)
- [ ] Import CURRENCIES array with labels and descriptions
- [ ] Create SettingsScreen component
- [ ] Implement useEffect to fetch settings on mount
- [ ] Add currency picker with Alert confirmation
- [ ] Display current currency and description
- [ ] Add info text about historical data
- [ ] Add loading state indicator
- [ ] Add error handling

**UX Requirements:**
- Show flag emojis for each currency (🇹🇷 TRY, 🇺🇸 USD, 🇪🇺 EUR, 🇬🇧 GBP)
- Display description for each currency
- Alert dialog on currency change:
  - "Change Default Currency"
  - Explanation: "Current: [description], New: [description]"
  - "Historical data will remain in original currency"
  - Confirm/Cancel buttons

---

#### ✅ TODO 7.2: Add Settings Navigation
**File:** `app/(tabs)/profile.tsx`
- [ ] Add Settings button/link
- [ ] Navigate to `/settings` screen
- [ ] Update navigation if needed

---

### Phase 8: Testing & Validation

#### ✅ TODO 8.1: Backend Testing
- [ ] Test UserSettingsModel creation
- [ ] Test duplicate userId prevention
- [ ] Test userSettingsService methods:
  - getSettings() - create defaults if missing
  - updateSettings() - partial updates
  - updateBaseCurrency() - validation
- [ ] Test API endpoints:
  - GET /api/user/settings
  - PUT /api/user/settings
  - PATCH /api/user/settings/currency
- [ ] Test ExpenseService with dynamic baseCurrency:
  - Create expense with user baseCurrency
  - Update expense with user baseCurrency
  - Verify conversion logic uses correct baseCurrency
- [ ] Test budget aggregation with user-specific baseCurrency

---

#### ✅ TODO 8.2: Frontend Testing
- [ ] Test store methods with mock data
- [ ] Test settings screen UI:
  - Currency picker display
  - Selection logic
  - Alert dialog
  - Loading states
  - Error states
- [ ] Test API integration:
  - Fetch settings on mount
  - Update settings
  - Update baseCurrency
- [ ] Test full workflow:
  - Open settings → Change currency → Confirm → Check expense creation

---

### Phase 9: Database Reset & Setup

#### ✅ TODO 9.1: Database Reset
- [ ] Stop backend server if running
- [ ] Clear MongoDB database: `npm run db:clean`
- [ ] Restart backend server: `npm run dev`
- [ ] Verify all collections are empty
- [ ] Test basic functionality (auth, create user, etc.)

---

#### ✅ TODO 9.2: Default UserSettings Setup
- [ ] Create test user (auth)
- [ ] Verify UserSettings document created automatically:
  - userId: test user ObjectId
  - baseCurrency: 'TRY'
  - timezone: 'Europe/Istanbul'
  - language: 'tr'
  - theme: 'light'
- [ ] Test GET /api/user/settings returns defaults
- [ ] Test update methods work correctly

---

### Phase 10: Final Validation

#### ✅ TODO 10.1: Integration Testing
- [ ] Create user with default settings
- [ ] Create expense:
  - Currency: USD
  - Amount: 100
  - Expected: baseCurrency='TRY', amountBase=3300 (or current rate)
- [ ] Create expense:
  - Currency: TRY
  - Amount: 1000
  - Expected: baseCurrency='TRY', amountBase=1000, fxRate=1
- [ ] Update user baseCurrency to USD
- [ ] Create new expense:
  - Currency: EUR
  - Amount: 50
  - Expected: baseCurrency='USD', amountBase≈55 (EUR→USD rate)
- [ ] Verify historical expenses still in original baseCurrency

---

#### ✅ TODO 10.2: Budget Testing
- [ ] Set budget: 10000 TRY
- [ ] Create mixed currency expenses (USD, EUR, TRY)
- [ ] Verify budget aggregation uses user's baseCurrency
- [ ] Change user baseCurrency to USD
- [ ] Create new expenses
- [ ] Verify new expenses use USD baseCurrency
- [ ] Verify historical TRY expenses excluded from new budget calculations

---

#### ✅ TODO 10.3: Export Testing
- [ ] Create mixed currency expenses
- [ ] Test CSV export: Verify FX fields included
- [ ] Test PDF export: Verify base currency total + original currency breakdown

---

### Phase 11: Documentation

#### ✅ TODO 11.1: Update Documentation
- [ ] Update this plan with completion status
- [ ] Add notes about UserSettings model benefits
- [ ] Document API endpoints in README
- [ ] Add usage examples for UserSettingsService

---

## 📊 Checklist Summary

### Backend
- [x] Create UserSettings model and interface
- [x] Create UserSettingsService (getSettings, updateSettings, updateBaseCurrency)
- [x] Create UserSettingsController (3 endpoints)
- [x] Create and register userSettings routes
- [x] Update ExpenseService to use UserSettings
- [x] Update ReportService to use UserSettings
- [x] Update model exports
- [x] TypeScript typecheck
- [x] Build successful
- [ ] API testing complete

### Frontend
- [ ] Create UserSettingsStore (Zustand)
- [ ] Create Settings screen (UI component)
- [ ] Add Settings navigation
- [ ] UI testing complete
- [ ] API integration testing complete

### Database & Testing
- [ ] Database reset completed
- [ ] Default UserSettings verified
- [ ] Integration testing complete
- [ ] Budget aggregation verified
- [ ] Export functionality verified

### Documentation
- [ ] Implementation plan updated
- [ ] README updated with API endpoints
- [ ] Usage examples added

---

## ⏩ After Implementation: Future Features

### Potential Enhancements (NOT in scope)
- User timezone support for date/time display
- User language preference (UI localization)
- User theme preference (dark mode toggle)
- Default currency selector in onboarding flow
- Currency conversion dashboard (FX rate history)
- Historical currency conversion (when baseCurrency changes)

---

## 🎯 Success Criteria

✅ **MVP Success:**
- User can select baseCurrency from 4 options (TRY, USD, EUR, GBP)
- New expenses use user's baseCurrency for amountBase calculation
- Historical expenses remain in original baseCurrency
- Budget aggregation works with user-specific baseCurrency
- All CRUD operations work with UserSettings

✅ **Quality:**
- TypeScript typecheck passes
- Build successful
- All tests pass
- No breaking changes to existing code
- Clean separation: User = auth, UserSettings = preferences

---

## 📝 Implementation Notes

1. **UserSettings Autocreate:** UserSettings should be created automatically on first access (upsert)
2. **Historical Data:** Changing baseCurrency does NOT affect existing expenses
3. **Validation:** Always validate baseCurrency enum before updating
4. **Fallback:** Always default to 'TRY' if UserSettings not found
5. **Performance:** UserSettings should be cached (fetch once, store in memory)
6. **UX:** Clear messaging about historical data when changing currency

---

## 🔄 Implementation Phase

**Current Phase:** Phase 6 (Client Store - Mobile)
**Next Phase:** Phase 7 (UI Components - Mobile)

**Estimated Effort:** 4-6 hours
- Phase 1: 1 hour
- Phase 2: 1.5 hours
- Phase 3: 1 hour
- Phase 4: 0.5 hours
- Phase 5: 0.5 hours
- Phase 6: 1 hour
- Phase 7: 1.5 hours
- Phase 8: 1.5 hours
- Phase 9: 0.5 hours
- Phase 10: 2 hours
- Phase 11: 0.5 hours

---

**Last Updated:** December 28, 2025
**Status:** Backend Complete (Phases 1-5), Frontend In Progress (Phase 6)
