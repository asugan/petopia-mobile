# Backend-Mobile i18n Entegrasyon Planı

## 📋 Genel Bakış

Bu plan, Petopia mobile uygulaması ile backend arasındaki i18n (internationalization) senkronizasyonunu sağlamak için hazırlanmıştır. Mobil uygulama zaten 30 dilde tam i18n desteğine sahipken, backend notification servisleri henüz bu desteğe sahip değildir.

---

## 🚨 Mevcut Durum

### Mobile (Tamamlanmış)
- ✅ 30 dilde çeviri dosyaları hazır
- ✅ i18next entegrasyonu aktif
- ✅ Tüm notification mesajları localized
- ⚠️ Sadece `lib/services/notificationService.ts:508` satırında `time.atTime` → `events.time.atTime` düzeltmesi gerekiyor

### Backend (Eksik)
- ❌ Event Reminders: 🇹🇷 Türkçe sabit kodlanmış
- ❌ Budget Alerts: 🇺🇸 İngilizce sabit kodlanmış
- ❌ Feeding Reminders: 🇺🇸 İngilizce sabit kodlanmış
- ❌ UserSettings.language kullanılmıyor

---

## 🛠️ Uygulama Adımları

### Phase 1: Backend i18n Altyapısı (1-2 gün)

#### 1.1 Kütüphane Kurulumu
```bash
cd ../petopia-backend
npm install i18next i18next-fs-backend
```

#### 1.2 Çeviri Dosya Yapısı (Mobile ile senkronize)
```
src/locales/
├── en/notifications.json      # Referans
├── tr/notifications.json      # Mevcut Türkçe metinler taşınacak
├── de/notifications.json
├── fr/notifications.json
└── ... (26 dil daha toplam 30 dil)
```

#### 1.3 i18n Konfigürasyonu
**Yeni Dosya:** `src/config/i18n.ts`

```typescript
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';

i18next
  .use(Backend)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    ns: ['notifications'],
    defaultNS: 'notifications',
    backend: {
      loadPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.json'),
    },
    interpolation: {
      escapeValue: false, // XSS koruması gerekmez (backend'de HTML yok)
    },
  });

export default i18next;
```

---

### Phase 2: Çeviri Dosyaları (3-5 gün)

#### 2.1 Referans Çeviri Dosyası (İngilizce)
**Dosya:** `src/locales/en/notifications.json`

```json
{
  "eventReminder": {
    "daysLater": "{{count}} days later",
    "hoursLater": "{{count}} hours later",
    "minutesLater": "{{count}} minutes later",
    "title": "{{emoji}} {{petName}}: {{eventTitle}}",
    "titleNoPet": "{{emoji}} {{eventTitle}}"
  },
  "budgetAlert": {
    "warning": {
      "title": "Budget alert",
      "body": "You've used {{percentage}}% of your monthly budget. {{currency}} {{remaining}} remaining."
    },
    "critical": {
      "title": "Budget exceeded",
      "body": "You've exceeded your monthly budget by {{currency}} {{exceeded}}. Current spending: {{currency}} {{current}} / {{currency}} {{budget}}"
    }
  },
  "feedingReminder": {
    "title": "🍽️ Feeding time for {{petName}}",
    "body": "Time to feed {{petName}}: {{amount}} of {{foodType}}"
  }
}
```

#### 2.2 Türkçe Çeviri Dosyası
**Dosya:** `src/locales/tr/notifications.json`

```json
{
  "eventReminder": {
    "daysLater": "{{count}} gün sonra",
    "hoursLater": "{{count}} saat sonra",
    "minutesLater": "{{count}} dakika sonra",
    "title": "{{emoji}} {{petName}}: {{eventTitle}}",
    "titleNoPet": "{{emoji}} {{eventTitle}}"
  },
  "budgetAlert": {
    "warning": {
      "title": "Bütçe Uyarısı",
      "body": "Aylık bütçenizin %{{percentage}}'ini kullandınız. Kalan: {{currency}} {{remaining}}"
    },
    "critical": {
      "title": "Bütçe Aşıldı",
      "body": "Aylık bütçenizi {{currency}} {{exceeded}} kadar aştınız. Mevcut harcama: {{currency}} {{current}} / {{currency}} {{budget}}"
    }
  },
  "feedingReminder": {
    "title": "🍽️ {{petName}} beslenme zamanı",
    "body": "{{petName}} besleme zamanı: {{amount}} {{foodType}}"
  }
}
```

#### 2.3 Diğer Diller İçin Çeviri Stratejisi
1. Mobil uygulamadaki `locales/*.json` dosyalarından notification bölümünü çıkar
2. Backend formatına dönüştür
3. Dil dosyalarını `src/locales/{lang}/notifications.json` olarak kaydet
4. 30 dilin tamamı için tekrarla

---

### Phase 3: Servis Güncellemeleri (2-3 gün)

#### 3.1 Event Reminder Service
**Dosya:** `src/services/eventReminderService.ts`

**Değişiklikler:**
```typescript
import i18next from '../config/i18n';
import { UserSettingsModel } from '../models/mongoose/index.js';

async scheduleReminders(config: EventReminderConfig): Promise<EventReminderResult> {
  const { eventId, userId, eventType, eventTitle, startTime, petName, reminderMinutes, timezone } = config;

  // Get user's language preference
  const userSettings = await UserSettingsModel.findOne({ userId: new Types.ObjectId(userId) });
  const userLang = userSettings?.language ?? 'en';
  
  // Change i18n language for this user
  i18next.changeLanguage(userLang);

  for (const minutes of reminderMinutes) {
    // ... existing logic ...

    // Format notification content using i18n
    const emoji = this.getEventTypeEmoji(eventType);
    const formattedDate = formatInTimeZone(startTime, timezone, 'MMM d, HH:mm');

    const notificationTitle = petName
      ? i18next.t('eventReminder.title', { emoji, petName, eventTitle })
      : i18next.t('eventReminder.titleNoPet', { emoji, eventTitle });

    const days = Math.floor(minutes / 1440);
    const hours = Math.floor(minutes / 60);
    const mins = minutes;

    let notificationBody: string;
    if (minutes >= 1440) {
      notificationBody = `${formattedDate} (${i18next.t('eventReminder.daysLater', { count: days })})`;
    } else if (minutes >= 60) {
      notificationBody = `${formattedDate} (${i18next.t('eventReminder.hoursLater', { count: hours })})`;
    } else {
      notificationBody = `${formattedDate} (${i18next.t('eventReminder.minutesLater', { count: mins })})`;
    }

    // Send notification...
  }
}
```

**Mevcut Türkçe Kod (Satır 69-73) - Kaldırılacak:**
```typescript
// ESKİ (KALDIRILACAK):
const notificationBody = minutes >= 1440
  ? `${formattedDate} (${Math.floor(minutes / 1440)} gün sonra)`
  : minutes >= 60
    ? `${formattedDate} (${Math.floor(minutes / 60)} saat sonra)`
    : `${formattedDate} (${minutes} dakika sonra)`;
```

#### 3.2 Notification Messages Config
**Dosya:** `src/config/notificationMessages.ts`

**Değişiklikler:**
```typescript
import i18next from './i18n';

// ESKİ (KALDIRILACAK):
// export const budgetAlertMessages: BudgetAlertMessages = { ... }
// export const feedingReminderMessages: FeedingReminderMessages = { ... }

// YENİ:
export const getBudgetAlertMessages = (language: string) => {
  i18next.changeLanguage(language);
  
  return {
    warning: {
      title: i18next.t('budgetAlert.warning.title'),
      body: ({ percentage, currency, remaining }: { percentage: number; currency: string; remaining: number }) =>
        i18next.t('budgetAlert.warning.body', { 
          percentage: percentage.toFixed(0), 
          currency, 
          remaining: remaining.toFixed(2) 
        }),
    },
    critical: {
      title: i18next.t('budgetAlert.critical.title'),
      body: ({ currency, exceeded, current, budget }: { currency: string; exceeded: number; current: number; budget: number }) =>
        i18next.t('budgetAlert.critical.body', { 
          currency, 
          exceeded: exceeded.toFixed(2), 
          current: current.toFixed(2), 
          budget: budget.toFixed(2) 
        }),
    },
  };
};

export const getFeedingReminderMessages = (language: string) => {
  i18next.changeLanguage(language);
  
  return {
    title: (petName: string) => i18next.t('feedingReminder.title', { petName }),
    body: ({ petName, amount, foodType }: { petName: string; amount: string; foodType: string }) => 
      i18next.t('feedingReminder.body', { petName, amount, foodType }),
  };
};
```

#### 3.3 Budget Alert Service
**Dosya:** `src/services/budgetAlertService.ts`

**Değişiklikler:**
```typescript
// ESKİ:
// import { budgetAlertMessages } from '../config/notificationMessages.js';

// YENİ:
import { getBudgetAlertMessages } from '../config/notificationMessages.js';
import { UserSettingsModel } from '../models/mongoose/index.js';

async sendBudgetAlert(userId: string, ...): Promise<BudgetAlertResult> {
  // ... existing logic ...
  
  // Get user's language
  const userSettings = await UserSettingsModel.findOne({ userId: new Types.ObjectId(userId) });
  const userLang = userSettings?.language ?? 'en';
  
  // Get localized messages
  const messages = getBudgetAlertMessages(userLang);
  
  const title = severity === 'critical' 
    ? messages.critical.title 
    : messages.warning.title;
  
  const body = severity === 'critical'
    ? messages.critical.body({ currency, exceeded: Math.abs(remaining), current: currentSpending, budget: budgetAmount })
    : messages.warning.body({ percentage, currency, remaining });
  
  // Send notification...
}
```

#### 3.4 Feeding Reminder Service
**Dosya:** `src/services/feedingReminderService.ts`

**Değişiklikler:**
```typescript
// ESKİ:
// import { feedingReminderMessages } from '../config/notificationMessages.js';

// YENİ:
import { getFeedingReminderMessages } from '../config/notificationMessages.js';

async sendFeedingReminder(scheduleId: string, userId: string): Promise<FeedingReminderResult> {
  // ... existing logic ...
  
  // Get user's language
  const userSettings = await UserSettingsModel.findOne({ userId: new Types.ObjectId(userId) });
  const userLang = userSettings?.language ?? 'en';
  
  // Get localized messages
  const messages = getFeedingReminderMessages(userLang);
  
  const title = messages.title(pet.name);
  const body = messages.body({
    petName: pet.name,
    amount: schedule.amount,
    foodType: schedule.foodType,
  });
  
  // Send notification...
}
```

#### 3.5 Feeding Reminder Checker Job
**Dosya:** `src/jobs/feedingReminderChecker.ts`

**Değişiklikler:**
```typescript
// Her notification gönderiminde kullanıcının dilini al
const userSettings = await UserSettingsModel.findOne({ userId: notification.userId });
const userLang = userSettings?.language ?? 'en';
const messages = getFeedingReminderMessages(userLang);

await pushNotificationService.sendToUser(notification.userId.toString(), {
  title: messages.title(pet.name),
  body: messages.body({
    petName: pet.name,
    amount: schedule.amount,
    foodType: schedule.foodType,
  }),
  // ...
});
```

---

### Phase 4: Mobile Düzeltme (10 dakika)

**Dosya:** `lib/services/notificationService.ts` (Satır 508)

```typescript
// ESKİ (HATALI):
time: i18n.t('time.atTime', { time: feedingTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }),

// YENİ (DÜZELTİLMİŞ):
time: i18n.t('events.time.atTime', { time: feedingTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }),
```

---

### Phase 5: Test ve Deployment (2 gün)

#### 5.1 Unit Testler
Her servis için farklı dillerde test yazılacak:

**Örnek Test:**
```typescript
describe('eventReminderService i18n', () => {
  it('should use user language preference', async () => {
    const userId = 'test-user';
    await UserSettingsModel.create({ userId, language: 'tr' });
    
    const result = await eventReminderService.scheduleReminders({
      userId,
      // ...
    });
    
    expect(result.notifications[0].body).toContain('gün sonra');
  });
  
  it('should fallback to english when language not found', async () => {
    const result = await eventReminderService.scheduleReminders({
      userId: 'no-lang-user',
      // ...
    });
    
    expect(result.notifications[0].body).toContain('days later');
  });
});
```

#### 5.2 Manuel Test Senaryoları
1. Event hatırlatıcısı oluştur (Türkçe dilinde)
   - Beklenen: "5 gün sonra"
2. Event hatırlatıcısı oluştur (Almanca dilinde)
   - Beklenen: "5 Tage später"
3. Budget alert gönder (İngilizce)
   - Beklenen: "Budget alert"
4. Dil değiştir ve yeni bildirim gönder
   - Eski bildirimler eski dilde kalmalı
   - Yeni bildirimler yeni dilde olmalı

#### 5.3 Staging Deployment
- Test kullanıcıları ile farklı dillerde doğrulama
- Her notification tipi için en az 3 farklı dil test edilmeli

---

## 🌍 Mobil-Backend Senkronizasyonu

### Çeviri Key Uyumluluğu

| Bildirim Tipi | Mobile Key | Backend Key | Durum |
|--------------|-----------|-------------|--------|
| Event Reminder Title | `notifications.reminderTitle` | `eventReminder.title` | Senkronize edilecek |
| Event Reminder Body | `notifications.reminderBody` | `eventReminder.daysLater` etc. | Backend yeni |
| Budget Alert Warning | - | `budgetAlert.warning.title` | Backend yeni |
| Budget Alert Critical | - | `budgetAlert.critical.title` | Backend yeni |
| Feeding Reminder Title | `notifications.feedingReminderTitle` | `feedingReminder.title` | Senkronize edilecek |
| Feeding Reminder Body | `notifications.feedingReminderBody` | `feedingReminder.body` | Senkronize edilecek |

### Dil Kodları
Her iki platform da aynı ISO 639-1 dil kodlarını kullanmalı:
- `en` - English
- `tr` - Türkçe
- `de` - Deutsch
- `fr` - Français
- `es` - Español
- `it` - Italiano
- `pt` - Português
- ... (toplam 30 dil)

---

## 📊 Zaman Çizelgesi

| Phase | Süre | Bağımlılık | Sorumlu |
|-------|------|------------|---------|
| Phase 1: Altyapı | 1-2 gün | - | Backend Team |
| Phase 2: Çeviriler | 3-5 gün | Phase 1 | Backend Team |
| Phase 3: Servisler | 2-3 gün | Phase 1-2 | Backend Team |
| Phase 4: Mobile Fix | 10 dk | - | Mobile Team |
| Phase 5: Test | 2 gün | Phase 3-4 | QA Team |

**Toplam Tahmini Süre:** 1 hafta

---

## ⚠️ Riskler ve Önlemler

### Risk 1: UserSettings.language null/undefined
**Sorun:** Kullanıcı dil tercihi ayarlanmamış olabilir
**Çözüm:** `userSettings?.language ?? 'en'` fallback kullan

### Risk 2: i18next Thread Safety
**Sorun:** `changeLanguage()` global state değiştirir
**Çözüm:** Her request'te `t()` fonksiyonuna `lng` parametresi geç:
```typescript
i18next.t('key', { lng: userLang, ...vars })
```

### Risk 3: Performans (DB Sorgusu)
**Sorun:** Her notification'da UserSettings sorgusu
**Çözüm:** UserSettings cache'leme (Redis veya in-memory):
```typescript
const cacheKey = `user:lang:${userId}`;
let userLang = await cache.get(cacheKey);
if (!userLang) {
  const settings = await UserSettingsModel.findOne({ userId });
  userLang = settings?.language ?? 'en';
  await cache.set(cacheKey, userLang, 3600); // 1 saat
}
```

### Risk 4: Eksik Çeviri
**Sorun:** Yeni bir dil eklenirse çeviri dosyası eksik olabilir
**Çözüm:** Fallback mekanizması zaten i18next'te var

---

## ✅ Checklist

### Phase 1
- [ ] `npm install i18next i18next-fs-backend`
- [ ] `src/config/i18n.ts` oluştur
- [ ] `src/locales/` dizin yapısını oluştur

### Phase 2
- [ ] İngilizce (en) çeviri dosyası
- [ ] Türkçe (tr) çeviri dosyası
- [ ] Diğer 28 dil için çeviri dosyaları

### Phase 3
- [ ] `src/config/notificationMessages.ts` refactor
- [ ] `src/services/eventReminderService.ts` güncelle
- [ ] `src/services/budgetAlertService.ts` güncelle
- [ ] `src/services/feedingReminderService.ts` güncelle
- [ ] `src/jobs/feedingReminderChecker.ts` güncelle

### Phase 4
- [ ] `lib/services/notificationService.ts:508` düzelt

### Phase 5
- [ ] Unit testler yaz
- [ ] Manuel test senaryoları çalıştır
- [ ] Staging deployment
- [ ] Production deployment

---

## 📚 Referanslar

- [i18next Documentation](https://www.i18next.com/)
- [i18next-fs-backend](https://github.com/i18next/i18next-fs-backend)
- Mobile i18n Raporu: `docs/notification-i18n-report.md`
- Mobile Notification Raporu: `docs/notification-system-report.md`
- Backend i18n Analizi: `../petopia-backend/docs/notification-i18n-analysis.md`
- Backend Notification Raporu: `../petopia-backend/docs/notification-system-report.md`

---

**Plan Tarihi:** 29 Ocak 2026  
**Son Güncelleme:** 29 Ocak 2026  
**Versiyon:** 1.0  
**Yazar:** Petopia Team
