# Ukraine Language Implementation Plan
## (Ukrayna Dili Entegrasyon Raporu)

**Tarih:** 2026-02-01
**Dil Kodu:** `uk`
**Dil Adı:** Ukrainian (Українська)

---

## Executive Summary

This report outlines the complete implementation plan for adding Ukrainian language support to both the mobile application and backend system. The plan covers all notification-related translations and ensures consistency across platforms.

---

## Current Status

### Mobile Application (`petopia-mobile`)
- **Current Languages:** 31 languages
- **i18n Library:** i18next + react-i18next
- **Format:** JSON files in `locales/` directory
- **Native iOS:** 34 localization files in `locales/native/`

### Backend System (`petopia-backend`)
- **Current Languages:** 32 languages
- **i18n Library:** i18next + i18next-fs-backend
- **Format:** JSON files in `src/locales/{code}/notifications.json`

---

## Implementation Plan

### Phase 1: Mobile Application - Main Translations

#### 1.1 Create Main Translation File
**File:** `/home/asugan/Projects/petopia-mobile/locales/uk.json`

- Base reference: Copy `en.json` or `tr.json` structure
- Translate all keys to Ukrainian
- **Estimated keys:** ~1,500+ keys across multiple namespaces

**Key Sections:**
- `common` - UI labels, buttons, navigation
- `pets` - Pet-related screens
- `events` - Event management
- `finance` - Budget and expenses
- `health` - Health records
- `notifications` - Notification messages
- `time` - Time/date formatting
- `validation` - Form validation messages

#### 1.2 Update i18n Configuration
**File:** `/home/asugan/Projects/petopia-mobile/lib/i18n.ts`

```typescript
// Add 'uk' to supportedLngs array
supportedLngs: [
  'en', 'tr', 'it', 'de', 'fr', 'es', 'pt', 'ja', 'ko',
  'ru', 'ar', 'sv', 'no', 'cs', 'sk', 'hr', 'hi', 'th',
  'vi', 'ms', 'zh', 'zh-TW', 'pl', 'el', 'he', 'ro',
  'nl', 'da', 'fi', 'hu', 'ca', 'uk'  // ← Add Ukrainian
],
```

#### 1.3 Update Language Display Names
**File:** `/home/asugan/Projects/petopia-mobile/stores/userSettingsStore.ts`

Add Ukrainian to language list:

```typescript
{
  code: 'uk',
  name: 'Ukrainian',
  nativeName: 'Українська',
  flag: '🇺🇦',
  rtl: false
}
```

#### 1.4 Create Native iOS Localization File
**File:** `/home/asugan/Projects/petopia-mobile/locales/native/uk.json`

iOS-specific translations for system dialogs:

```json
{
  "CFBundleDisplayName": "Petopia",
  "NSPhotoLibraryUsageDescription": "Дозвольте Petopia доступ до ваших фотографій.",
  "NSCameraUsageDescription": "Дозвольте Petopia робити фотографії.",
  "NSUserNotificationUsageDescription": "Ми використовуємо сповіщення для нагадувань про догляд за домашніми тваринами."
}
```

#### 1.5 Add to iOS Project (Optional but Recommended)
If native iOS strings are required in Xcode format:

**Steps:**
1. Create `ios/Petopia/uk.lproj/InfoPlist.strings`
2. Add localization in Xcode project settings
3. Update Info.plist to include Ukrainian as supported language

---

### Phase 2: Mobile Application - Notification Translations

#### 2.1 Notification Keys to Translate
In `locales/uk.json`, add the following under `notifications` namespace:

```json
{
  "notification": {
    "reminderTitle": "{{emoji}} {{eventType}} для {{petName}}",
    "reminderBody": "Нагадування: {{eventType}}",
    "feedingReminderTitle": "🍽️ Час годування {{petName}}",
    "feedingReminderBody": "Час нагодувати {{petName}}: {{amount}} {{foodType}}",
    "feedingReminderNowTitle": "🍽️ Поточне годування {{petName}}",
    "feedingReminderNowBody": "{{petName}} потребує годування зараз",
    "reminderTimes": {
      "5m": "5 хвилин тому",
      "15m": "15 хвилин тому",
      "30m": "30 хвилин тому",
      "1h": "1 годину тому",
      "2h": "2 години тому",
      "1d": "1 день тому",
      "2d": "2 дні тому",
      "1w": "1 тиждень тому"
    }
  }
}
```

#### 2.2 Event Types Translation
Under `eventTypes` namespace:

```json
{
  "eventTypes": {
    "feeding": "Годування",
    "grooming": "Гігієна",
    "walk": "Прогулянка",
    "vet": "Ветеринарія",
    "medication": "Ліки",
    "training": "Дресировка",
    "play": "Гра",
    "bath": "Купання",
    "other": "Інше"
  }
}
```

#### 2.3 Food Types Translation
Under `foodTypes` namespace:

```json
{
  "foodTypes": {
    "dry": "Сухий корм",
    "wet": "Вологий корм",
    "raw": "Сирий корм",
    "homemade": "Домашній корм",
    "treats": "Ласощі",
    "supplement": "Додатковий корм",
    "other": "Інше"
  }
}
```

#### 2.4 Time Formatting
Under `events.time` namespace:

```json
{
  "events": {
    "time": {
      "atTime": "о {{time}}"
    }
  }
}
```

---

### Phase 3: Backend - Notification Translations

#### 3.1 Create Backend Translation File
**File:** `/home/asugan/Projects/petopia-backend/src/locales/uk/notifications.json`

```json
{
  "eventReminder": {
    "daysLater": "{{count}} днів тому",
    "hoursLater": "{{count}} годин тому",
    "minutesLater": "{{count}} хвилин тому",
    "title": "{{emoji}} {{petName}}: {{eventTitle}}",
    "titleNoPet": "{{emoji}} {{eventTitle}}"
  },
  "budgetAlert": {
    "warning": {
      "title": "Попередження про бюджет",
      "body": "Ви використали {{percentage}}% вашого місячного бюджету. Залишилось: {{currency}}{{remaining}}"
    },
    "critical": {
      "title": "Бюджет перевищено",
      "body": "Ви перевищили ваш місячний бюджет на {{currency}}{{exceeded}}"
    }
  },
  "feedingReminder": {
    "title": "🍽️ Час годування для {{petName}}",
    "body": "Час нагодувати {{petName}}: {{amount}} {{foodType}}"
  }
}
```

#### 3.2 Update Backend i18n Configuration
**File:** `/home/asugan/Projects/petopia-backend/src/config/i18n.ts`

Add Ukrainian to the language options if needed. The current configuration uses a dynamic loading approach, so no direct changes may be required if the file follows the correct naming pattern.

#### 3.3 Update Notification Message Service
**File:** `/home/asugan/Projects/petopia-backend/src/config/notificationMessages.ts`

Ensure Ukrainian is included in the language validation if there's explicit language checking:

```typescript
const SUPPORTED_LANGUAGES = [
  'en', 'tr', 'de', 'fr', 'es', 'it', 'pt', 'ru', 'ar',
  'ja', 'ko', 'zh', 'zh-TW', 'hi', 'th', 'vi', 'ms',
  'pl', 'nl', 'cs', 'sk', 'hr', 'sv', 'no', 'da',
  'fi', 'hu', 'ro', 'el', 'he', 'ca', 'id', 'uk'  // ← Add Ukrainian
];
```

#### 3.4 Verify Service Integration
Verify that all notification services correctly handle the new language:

**Files to check:**
- `src/services/eventReminderService.ts`
- `src/services/budgetAlertService.ts`
- `src/services/feedingReminderService.ts`

These services use:
```typescript
const messages = getEventReminderMessages(userLanguage);
```

Since `userLanguage` comes from the UserSettings collection, adding the translation file and ensuring the language code follows ISO 639-1 (`uk`) should be sufficient.

---

### Phase 4: Testing & Validation

#### 4.1 Mobile Application Testing

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Language Selection | Select Ukrainian from language settings | App displays all UI in Ukrainian |
| Device Detection | Change device language to Ukrainian | App auto-detects and sets language to `uk` |
| Notifications | Create event with reminder | Notification displays in Ukrainian |
| Form Validation | Trigger validation errors | Error messages in Ukrainian |
| RTL Layout | Verify layout direction | Ukrainian is LTR (left-to-right) |
| iOS Native | Install on iOS device | Permission dialogs in Ukrainian |

#### 4.2 Backend Testing

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| User Language | Set user language to `uk` | Notifications sent in Ukrainian |
| Event Reminder | Create event reminder | Title and body in Ukrainian |
| Budget Alert | Trigger budget warning | Alert message in Ukrainian |
| Fallback | Invalid language code | Falls back to English |
| Missing Translation | Missing translation key | Falls back to key or English |

#### 4.3 Cross-Platform Validation

1. **Language Code Consistency:** Both platforms use `uk` for Ukrainian
2. **Key Alignment:** Notification keys match between mobile and backend
3. **Fallback Chain:** When Ukrainian translation is missing, fallback works correctly

---

## File Checklist

### Mobile Application

- [ ] `/locales/uk.json` - Main translation file (all namespaces)
- [ ] `/locales/native/uk.json` - iOS native localization
- [ ] Update `/lib/i18n.ts` - Add `uk` to `supportedLngs`
- [ ] Update `/stores/userSettingsStore.ts` - Add Ukrainian to language list
- [ ] (Optional) Create `ios/Petopia/uk.lproj/InfoPlist.strings`
- [ ] (Optional) Update `ios/Petopia/Info.plist` for Ukrainian support

### Backend System

- [ ] `/src/locales/uk/notifications.json` - Notification translation file
- [ ] Verify `/src/config/i18n.ts` handles new language
- [ ] Update `/src/config/notificationMessages.ts` if needed
- [ ] Test all notification services

---

## Translation Guidelines

### Ukrainian Language Specifics

1. **Script:** Cyrillic
2. **Direction:** Left-to-Right (LTR)
3. **Grammar:** Three grammatical genders (masculine, feminine, neuter)
4. **Number Handling:** Ukrainian has complex plural forms
5. **Date Format:** DD.MM.YYYY
6. **Number Format:** 1 234 567,89 (space for thousands, comma for decimals)

### i18n Interpolation Examples

```typescript
// Simple interpolation
"welcome": "Ласкаво просимо, {{username}}!"

// Pluralization (use i18next plural feature)
"petCount_one": "{{count}} тварина",
"petCount_few": "{{count}} тварини",
"petCount_many": "{{count}} тварин",
"petCount_other": "{{count}} тварин"

// Gender-specific (optional, use _male/_female suffix)
"greeting_male": "Вітаю, пане!",
"greeting_female": "Вітаю, пані!",
```

### Common Ukrainian Terminology for Pet Care

| English | Ukrainian |
|---------|-----------|
| Pet | Домашня тварина / Улюбленець |
| Dog | Собака / Пес |
| Cat | Кіт / Кішка |
| Feeding | Годування |
| Walking | Прогулянка |
| Grooming | Гігієна / Догляд |
| Vet check | Ветеринарія / Огляд |
| Medication | Ліки / Лікування |
| Budget | Бюджет |
| Reminder | Нагадування |
| Notification | Сповіщення |

---

## Deployment Process

### 1. Development Phase
1. Create translation files
2. Update configuration
3. Test locally

### 2. Code Review
1. Review all translation files
2. Verify code changes
3. Test on both iOS and Android

### 3. Deployment Order
1. **Deploy Backend First:** Update notification translations
2. **Deploy Mobile Second:** Push app update with Ukrainian support

### 4. Post-Deployment
1. Monitor for errors in translation keys
2. Collect user feedback on translations
3. Update as needed

---

## Potential Issues & Solutions

| Issue | Impact | Solution |
|-------|--------|----------|
| Missing translation keys | Shows key names instead of translated text | Ensure all keys from base file are translated |
| Pluralization issues | Incorrect number forms | Use i18next plural feature with Ukrainian-specific rules |
| iOS fallback to English | Native strings not loaded | Verify iOS lproj directory structure |
| Backend doesn't load translations | Returns English notifications | Check JSON file structure and path |
| Font rendering issues | Cyrillic characters not displayed | Ensure app font supports Cyrillic |

---

## Summary

| Platform | Languages Before | Languages After | New Files |
|----------|------------------|-----------------|-----------|
| Mobile | 31 | 32 | 2 JSON files |
| Backend | 32 | 33 | 1 JSON file |

**Total New Files:** 3
**Total Key Updates:** ~1,500+ keys in mobile, ~15 keys in backend

---

## Next Steps

1. **Translation:** Translate `locales/uk.json` with all required keys
2. **Backend:** Create `src/locales/uk/notifications.json`
3. **Integration:** Update configuration files
4. **Testing:** Thorough testing on both platforms
5. **Deployment:** Backend first, then mobile
6. **Monitoring:** Track usage and gather feedback

---

**Document Version:** 1.0
**Prepared by:** Claude Code
**Review Status:** Requires implementation validation
