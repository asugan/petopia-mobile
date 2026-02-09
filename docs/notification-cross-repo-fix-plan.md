# Petopia Notification Sistemi Tam Düzeltme Planı (Mobile + Backend)

Bu plan, `petopia-mobile` ve `petopia-backend` arasında event / feeding schedule / budget notification akışlarını tamamen hizalamak ve production güvenilirliğine çıkarmak için hazırlanmıştır.

## Hedef

- Bildirimlerin **doğru zamanda**, **tek sefer**, **doğru kanalda**, **doğru yönlendirme ile** gelmesini garanti etmek.
- Local fallback + backend push davranışlarını deterministik hale getirmek.
- Kullanıcı ayarları (`notificationsEnabled`, `budgetNotificationsEnabled`, `feedingRemindersEnabled`, quiet hours) ile gerçek gönderim davranışını birebir senkronlamak.

## Kapsam

- Repo 1: `../petopia-mobile`
- Repo 2: `../petopia-backend`
- Modüller: event reminders, feeding reminders, budget alerts, push token lifecycle, scheduler jobs, notification payload contract

---

## Faz 0 - Kontrat Kilitleme (P0)

Amaç: İlk olarak mobil ve backend arasında tek bir payload/channel/preset sözleşmesi oluşturmak.

### 0.1 Ortak Notification Contract Dokümanı

- [ ] `docs/` altında tek kaynak bir sözleşme dosyası oluştur:
  - `channelId` değerleri
  - `data.screen` değerleri
  - `data.entityType/entityId` alanları
  - Event reminder preset dakika setleri
- [ ] Her akış için örnek payload ekle:
  - event
  - feeding
  - budget

### 0.2 Zorunlu Sözleşme Kararları

- [ ] `screen` enum standardı:
  - event: `event`
  - feeding: `feeding`
  - budget: `budget` (veya `finance`) → **tek değer seçilecek**
- [ ] `channelId` standardı:
  - event: `event-reminders`
  - feeding: `feeding-reminders` (veya event kanalı) → **tek değer seçilecek**
  - budget: `budget-alerts`
- [ ] Preset dakika setleri mobile/backend aynılaştırılacak.

---

## Faz 1 - Kritik Kırıkların Giderilmesi (P0)

Amaç: Şu anki üretim riskini oluşturan mismatch’leri kapatmak.

### 1.1 Budget push yönlendirme mismatch

- [ ] Backend budget payload `data.screen` değerini seçilen standarda çek (`../petopia-backend/src/services/budgetAlertService.ts`).
- [ ] Mobile response handler budget bildirimini aynı değerle yakalasın (`lib/services/notificationService.ts`).
- [ ] Geriye dönük uyum için handler geçici olarak her iki değeri de kabul etsin (migration süresince).

### 1.2 Feeding Android channel mismatch

- [ ] Mobile tarafında `feeding-reminders` channel oluştur (eğer ayrı channel kararı alınırsa) (`lib/services/notificationService.ts`).
- [ ] Backend feeding push channelId ile mobile channel tanımı birebir eşleşsin.
- [ ] Kanal adı değişmeyecekse constants katmanına alınsın (hardcode kaldır).

### 1.3 Event preset uyuşmazlığı

- [ ] Event reminder preset dakikalarını tek kaynağa taşı.
- [ ] Backend `eventReminderService.getReminderMinutesForPreset` mobil presetlerle aynı hale getirilsin.
- [ ] Gerekirse migration notu: eski event’lerde preset mapping değişikliğinin etkisi.

### 1.4 Push token yaşam döngüsü

- [ ] Mobile `notificationsEnabled=false` olduğunda backend unregister çağrısı ekle (`unregisterPushTokenFromBackend`).
- [ ] Logout akışında unregister + local cleanup (event/feeding) garanti altına alınsın.
- [ ] Token cache invalidation stratejisi netleştirilsin (stale registration riski).

---

## Faz 2 - Ayar Senkronu ve Davranış Tutarlılığı (P0/P1)

### 2.1 feedingRemindersEnabled uçtan uca destek

- [ ] Backend `UpdateUserSettingsRequest` ve route validation’a `feedingRemindersEnabled` ekle:
  - `../petopia-backend/src/types/api.ts`
  - `../petopia-backend/src/routes/userSettingsRoutes.ts`
  - `../petopia-backend/src/services/userSettingsService.ts`
- [ ] Feeding job/scheduler gönderiminde bu ayar kontrol edilsin.
- [ ] Mobile settings ekranına feeding reminder toggle ekle (yoksa).

### 2.2 Budget alert job ayar farkındalığı

- [ ] `sendAlertsToAllUsers` içinde kullanıcı settings kontrolü ekle:
  - `notificationsEnabled`
  - `budgetNotificationsEnabled`
- [ ] Ayar kapalıysa alert state tüketilmesin veya işaretleme stratejisi ayrıştırılsın.

### 2.3 “Check alert” side-effect ayrıştırma

- [ ] `GET /api/budget/alerts` endpoint’i “read-only” olacak şekilde düzenle.
- [ ] Alert state mutate eden davranış ayrı bir “dispatch/ack” operasyonuna taşınsın.
- [ ] Finance ekranı polling’i state tüketmeyecek hale getirilsin.

---

## Faz 3 - Navigation + Quiet Hours + Fallback Kararlılığı (P1)

### 3.1 Notification click routing tamamlanması

- [ ] Mobile `handleNotificationResponse` içinde feeding routing ekle.
- [ ] `entityType/entityId` tabanlı tek routing resolver’a geç (screen bağımlılığı azalt).

### 3.2 Quiet hours backend tarafı

- [ ] Karar: quiet hours backend push’ta da uygulanacak mı?
- [ ] Uygulanacaksa event/feeding/budget servislerinde send-before-check ekle.
- [ ] Uygulanmayacaksa ürün kararı dokümante edilip UI’da açıkça belirtilsin.

### 3.3 Fallback determinism

- [ ] Delivery channel karar mekanizması netleştir:
  - backend token varsa local scheduling kapalı
  - token yoksa local açık
- [ ] Bu kural event/feeding/budget için aynı olacak.
- [ ] Finance ekranına bağlı local budget notification bağımlılığı kaldır (app-level orchestrator).

---

## Faz 4 - Test Sertleştirme (P0/P1)

### 4.1 Backend testleri

- [ ] `budgetAlertService` için unit testler:
  - settings kapalıyken send yok
  - duplicate/race durumunda tekrar gönderim yok
  - severity escalation (warning → critical)
- [ ] `feedingReminderChecker` için unit/integration test:
  - channel/payload doğrulama
  - retry + max retry
  - settings disable senaryosu
- [ ] Event preset parity testi (mobile contract ile aynı dakika seti).

### 4.2 Mobile testleri

- [ ] `notificationService.handleNotificationResponse` routing testleri (event/feeding/budget).
- [ ] `useBudgetAlertNotifications` side-effect testleri (poll + token registered + local fallback).
- [ ] Push unregister senaryosu testleri (toggle off / logout).

### 4.3 Cross-repo contract test

- [ ] Basit JSON fixture tabanlı sözleşme testi:
  - backend payload fixture -> mobile parser/routing expectation

---

## Faz 5 - Operasyonel Hazırlık ve Rollout (P1)

### 5.1 Observability

- [ ] Ortak log alanları:
  - `notificationType`, `deliveryChannel`, `userId`, `entityId`, `screen`, `channelId`, `dedupeKey`
- [ ] Job metrikleri:
  - processed/sent/failed/skipped(reason)
- [ ] Mobile diagnostic ekranında son 20 schedule/send kararı gösterimi (debug build).

### 5.2 Güvenli geçiş

- [ ] Feature flag ile rollout:
  - `NOTIFICATION_CONTRACT_V2`
  - `BUDGET_ALERT_READONLY_CHECK`
- [ ] Aşamalı açılış (internal → %10 → %50 → %100).
- [ ] Rollback planı (eski payload handler backward-compatible tutulacak).

---

## Uygulama Sırası (Önerilen)

1. Faz 0 (contract)
2. Faz 1 (kritik kırıklar)
3. Faz 2 (ayar senkronu + state side-effects)
4. Faz 4 (test sertleştirme)
5. Faz 3 (quiet hours/fallback refinements)
6. Faz 5 (rollout/observability)

> Not: Faz 3 ve Faz 4 paralel yürütülebilir, ancak Faz 1/2 tamamlanmadan prod rollout yapılmamalı.

---

## Tamamlanma Kriterleri (Definition of Done)

- [ ] Event/feeding/budget için payload contract tek ve version’lı.
- [ ] Mobile + backend preset/channel/screen uyumsuzluğu kalmadı.
- [ ] Kullanıcı bildirim ayarları kapalıyken hiçbir kanal bildirim göndermiyor.
- [ ] Push token disable/logout akışlarında backend cihaz kaydı doğru kapanıyor.
- [ ] Kritik akışlar testlerle güvence altında (unit + contract).
- [ ] 7 günlük gözlemde duplicate/missing notification oranı hedef KPI altında.
