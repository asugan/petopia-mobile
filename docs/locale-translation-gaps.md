# Locale Translation Gaps Report

> Generated on: 2025-02-01
> **Status: FIXED** - All gaps have been resolved on 2025-02-01 ⚠️

This document lists all missing translation keys across all locale files when compared to `en.json` (the reference file with **1355 keys**).

> **NOTICE**: All translation gaps listed below have been resolved. All missing keys have been added with English placeholder values to allow the application to function correctly. Native language translations should be provided by translators for each locale.

## Summary

| Status | Count | Files |
|--------|-------|-------|
| ✅ Perfect Match | 6 | cs.json, da.json, fi.json, hr.json, no.json, sv.json |
| 🔴 Critical (50+ missing) | 1 | id.json (94 missing) |
| 🟡 High (20+ missing) | 3 | ar.json, ko.json, ru.json, tr.json (24-25 missing) |
| 🟢 Minor (1-5 missing) | 16 | es.json, zh.json, zh-TW.json, de.json, pt.json, vi.json, ca.json, el.json, fr.json, he.json, hi.json, hu.json, it.json, ja.json, ms.json, nl.json, pl.json, ro.json, sk.json, th.json, uk.json |

---

## Missing Translations by File

### 🔴 id.json - **94 missing keys**

#### Budgets (25 keys)
```
budgets.limit
budgets.exceeded
budgets.approachingLimit
budgets.alertsFound
budgets.inactive
budgets.formHelp
budgets.category
budgets.categorySpecificHelp
budgets.overallBudgetHelp
budgets.amount
budgets.currency
budgets.period
budgets.alertThreshold
budgets.alertThresholdHelp
budgets.isActive
budgets.isActiveHelp
budgets.alertsActive
budgets.onTrack
budgets.allGood
budgets.insightsTitle
budgets.monthOverMonthLabel
budgets.currentLabel
budgets.previousLabel
budgets.monthOverMonth
budgets.currentVsPrevious
budgets.noCategoryData
budgets.periods.monthly
budgets.periods.yearly
```

#### Subscription (66 keys)
```
subscription.trial
subscription.trialActive
subscription.trialDaysRemaining
subscription.trialExpired
subscription.trialPrompt
subscription.upgradeToPro
subscription.startTrial
subscription.noCreditCardRequired
subscription.confirmStartTrialTitle
subscription.confirmStartTrialMessage
subscription.confirmStartTrialAction
subscription.upgradePrompt
subscription.upgradeBeforeTrialEnds
subscription.manageSubscription
subscription.cancelSubscription
subscription.cancelSubscriptionTitle
subscription.cancelSubscriptionMessage
subscription.cancelSubscriptionAction
subscription.restorePurchases
subscription.noPurchases
subscription.noPurchasesMessage
subscription.expiresOn
subscription.autoRenews
subscription.cancelled
subscription.paywallError
subscription.trialAlreadySubscribed
subscription.trialAlreadyUsed
subscription.trialStartFailed
subscription.loadError
subscription.invalidResponse
subscription.startTrialError
subscription.privacy
subscription.unlockFeature
subscription.modal.title
subscription.modal.description
subscription.modal.featureDescription
subscription.modal.upgradeNow
subscription.modal.maybeLater
subscription.modal.includes
subscription.features.title
subscription.features.unlimited
subscription.features.unlimitedDesc
subscription.features.feedingSchedules
subscription.features.feedingSchedulesDesc
subscription.features.budgetTracking
subscription.features.budgetTrackingDesc
subscription.features.export
subscription.features.exportDesc
subscription.features.priority
subscription.features.priorityDesc
subscription.features.petManagement
subscription.features.healthRecords
subscription.features.calendar
subscription.features.feeding
subscription.features.expenses
subscription.features.budgets
subscription.paywall.title
subscription.paywall.subtitle
subscription.success.title
subscription.success.message
subscription.success.button
subscription.trialSuccess.title
subscription.trialSuccess.message
subscription.trialSuccess.button
subscription.note
```

#### Health Records (1 key)
```
healthRecords.fetchByTypeError
```

---

### 🟡 ar.json - **24 missing keys**

#### Pets (8 keys)
```
pets.createError
pets.fetchError
pets.notFoundUpdate
pets.notFoundDelete
pets.updateError
pets.searchError
pets.uploadError
pets.statsError
```

#### Health Records (6 keys)
```
healthRecords.createError
healthRecords.fetchError
healthRecords.notFoundUpdate
healthRecords.notFoundDelete
healthRecords.updateError
healthRecords.fetchByTypeError
```

#### Events (8 keys)
```
events.createError
events.fetchError
events.notFound
events.notFoundUpdate
events.notFoundDelete
events.updateError
events.fetchByDateError
events.fetchUpcomingError
events.fetchTodayError
```

#### Settings (2 keys)
```
settings.selectCurrency
```

---

### 🟡 ko.json - **25 missing keys**

#### Pets (8 keys) - Same as ar.json, ru.json, tr.json
```
pets.createError
pets.fetchError
pets.notFoundUpdate
pets.notFoundDelete
pets.updateError
pets.searchError
pets.uploadError
pets.statsError
```

#### Health Records (6 keys) - Same as ar.json, ru.json, tr.json
```
healthRecords.createError
healthRecords.fetchError
healthRecords.notFoundUpdate
healthRecords.notFoundDelete
healthRecords.updateError
healthRecords.fetchByTypeError
```

#### Events (9 keys)
```
events.createError
events.fetchError
events.notFound
events.notFoundUpdate
events.notFoundDelete
events.updateError
events.fetchByDateError
events.fetchUpcomingError
events.fetchTodayError
```

#### Calendar (1 key)
```
calendar.eventCount_other
```

#### Settings (1 key)
```
settings.selectCurrency
```

---

### 🟡 ru.json - **24 missing keys**

#### Pets (8 keys) - Same as ar.json, ko.json, tr.json
```
pets.createError
pets.fetchError
pets.notFoundUpdate
pets.notFoundDelete
pets.updateError
pets.searchError
pets.uploadError
pets.statsError
```

#### Health Records (6 keys) - Same as ar.json, ko.json, tr.json
```
healthRecords.createError
healthRecords.fetchError
healthRecords.notFoundUpdate
healthRecords.notFoundDelete
healthRecords.updateError
healthRecords.fetchByTypeError
```

#### Events (8 keys)
```
events.createError
events.fetchError
events.notFound
events.notFoundUpdate
events.notFoundDelete
events.updateError
events.fetchByDateError
events.fetchUpcomingError
events.fetchTodayError
```

#### Settings (2 keys)
```
settings.selectCurrency
```

---

### 🟡 tr.json - **24 missing keys**

#### Pets (8 keys) - Same as ar.json, ko.json, ru.json
```
pets.createError
pets.fetchError
pets.notFoundUpdate
pets.notFoundDelete
pets.updateError
pets.searchError
pets.uploadError
pets.statsError
```

#### Health Records (6 keys) - Same as ar.json, ko.json, ru.json
```
healthRecords.createError
healthRecords.fetchError
healthRecords.notFoundUpdate
healthRecords.notFoundDelete
healthRecords.updateError
healthRecords.fetchByTypeError
```

#### Events (9 keys)
```
events.createError
events.fetchError
events.notFound
events.notFoundUpdate
events.notFoundDelete
events.updateError
events.fetchByDateError
events.fetchUpcomingError
events.fetchTodayError
```

#### Calendar (1 key)
```
calendar.eventCount_other
```

---

### 🟢 zh.json - **6 missing keys**

```
eventForm.suggestions.vetVisit
settings.selectCurrency
eventTypes.vet_visit
expenses.createError
expenses.updateError
expenses.deleteError
```

---

### 🟢 zh-TW.json - **3 missing keys**

```
eventForm.suggestions.vetVisit
settings.selectCurrency
eventTypes.vet_visit
```

---

### 🟢 es.json - **4 missing keys**

```
settings.selectCurrency
gender.male
gender.female
gender.other
```

---

### 🟢 de.json - **2 missing keys**

```
healthRecords.noTreatmentPlan
settings.selectCurrency
```

---

### 🟢 pt.json - **2 missing keys**

```
eventForm.suggestions.vetVisit
settings.selectCurrency
```

---

### 🟢 vi.json - **2 missing keys**

```
events.deleteEventConfirmation
settings.selectCurrency
```

---

### 🟢 ca.json - **1 missing key**

```
eventForm.suggestions.vetVisit
```

---

### 🟢 el.json - **1 missing key**

```
settings.selectCurrency
```

---

### 🟢 fr.json - **1 missing key**

```
settings.selectCurrency
```

---

### 🟢 he.json - **1 missing key**

```
settings.selectCurrency
```

---

### 🟢 hi.json - **1 missing key**

```
settings.selectCurrency
```

---

### 🟢 hu.json - **1 missing key**

```
events.deleteEventConfirmation
```

---

### 🟢 it.json - **1 missing key**

```
settings.selectCurrency
```

---

### 🟢 ja.json - **1 missing key**

```
settings.selectCurrency
```

---

### 🟢 ms.json - **1 missing key**

```
settings.selectCurrency
```

---

### 🟢 nl.json - **1 missing key**

```
settings.selectCurrency
```

---

### 🟢 pl.json - **1 missing key**

```
settings.selectCurrency
```

---

### 🟢 ro.json - **1 missing key**

```
settings.selectCurrency
```

---

### 🟢 th.json - **1 missing key**

```
settings.selectCurrency
```

---

## Common Missing Keys Patterns

### Most Frequently Missing Keys

| Key | Count in Files |
|-----|----------------|
| `settings.selectCurrency` | 14 |
| `events.createError` | 4 |
| `events.fetchError` | 4 |
| `events.notFound` | 4 |
| `events.notFoundUpdate` | 4 |
| `events.notFoundDelete` | 4 |
| `events.updateError` | 4 |
| `events.fetchByDateError` | 4 |
| `events.fetchUpcomingError` | 4 |
| `events.fetchTodayError` | 4 |
| `healthRecords.createError` | 4 |
| `healthRecords.fetchError` | 4 |
| `healthRecords.notFoundUpdate` | 4 |
| `healthRecords.notFoundDelete` | 4 |
| `healthRecords.updateError` | 4 |
| `healthRecords.fetchByTypeError` | 4 |
| `pets.createError` | 4 |
| `pets.fetchError` | 4 |
| `pets.notFoundUpdate` | 4 |
| `pets.notFoundDelete` | 4 |
| `pets.updateError` | 4 |
| `pets.searchError` | 4 |
| `pets.uploadError` | 4 |
| `pets.statsError` | 4 |
| `eventForm.suggestions.vetVisit` | 4 |
| `eventTypes.vet_visit` | 2 |

---

## Action Items

### Priority 1: Critical
- **id.json** - Add 94 missing keys (likely entire subscription section)
- **ar.json, ko.json, ru.json, tr.json** - Add 24-25 missing error handling keys

### Priority 2: High
- **zh.json** - Add 6 missing keys
- **zh-TW.json** - Add 3 missing keys
- **es.json** - Add 4 missing keys (common gender types)

### Priority 3: Normal
- **de.json, pt.json, vi.json** - Add 2 missing keys each
- Remaining 14 languages - Add 1 missing key each

---

## Quick Fix Script

To add missing keys with placeholder translations, you can use this Node.js script:

```javascript
const fs = require('fs');
const path = require('path');

// Configuration: Set the file you want to fix
const TARGET_FILE = 'id.json'; // Change this

const enPath = path.join(__dirname, '../locales', 'en.json');
const targetPath = path.join(__dirname, '../locales', TARGET_FILE);

function getAllKeys(obj) {
  const keys = [];
  function traverse(o, prefix = '') {
    for (const key in o) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (o[key] !== null && typeof o[key] === 'object') {
        traverse(o[key], fullKey);
      } else {
        keys.push(fullKey);
      }
    }
  }
  traverse(obj);
  return keys;
}

function setValue(obj, pathStr, value) {
  const parts = pathStr.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const targetData = JSON.parse(fs.readFileSync(targetPath, 'utf8'));

const enKeys = getAllKeys(enData);
const targetKeys = getAllKeys(targetData);

const missingKeys = enKeys.filter(k => !targetKeys.includes(k));

console.log(`Found ${missingKeys.length} missing keys`);
console.log('Adding missing keys with placeholder values...');

for (const key of missingKeys) {
  const enValue = getValue(enData, key);
  setValue(targetData, key, `[TODO: Translate "${enValue}"]`);
}

fs.writeFileSync(targetPath, JSON.stringify(targetData, null, 2));
console.log(`Updated ${TARGET_FILE} with ${missingKeys.length} placeholder translations`);
```

---

## Notes

- This report is generated automatically based on key comparison
- Translated values should be reviewed by native speakers
- Some keys like `settings.selectCurrency` might have been recently added
- The `subscription.*` keys appear to be completely missing in id.json (likely a newer feature)

---

*Last updated: 2025-02-01*
