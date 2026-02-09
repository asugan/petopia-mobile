# Timezone Refactor Uygulama Plani (Mobile + Backend)

Bu dokuman, `petopia-mobile` ve `../petopia-backend` kod tabanlari icin tek bir implementasyon plani sunar.
Amac: tarih/saat davranisini tamamen deterministic, test edilebilir ve domain-semantigine uygun hale getmek.

## 1) Hedef Mimari (Kilitleyecegimiz Kurallar)

### 1.1 Temporal tipler
- `Instant`: RFC3339 datetime + timezone zorunlu (`Z` veya `+/-HH:MM`).
- `LocalDate`: sadece `YYYY-MM-DD`.
- `LocalTime`: sadece `HH:mm`.

### 1.2 Timezone ownership kurali
- Oncelik: `request timezone > user settings timezone > UTC`.
- Event/recurrence/feeding gibi local-day domainlerinde IANA timezone explicit olmali.

### 1.3 Query boundary standardi
- Tum range sorgulari yarim-acik aralik olacak: `[start, end)`.
- Mongo tarafinda standart: `$gte: start`, `$lt: end`.

### 1.4 Domain semantikleri
- `event`, `recurrence`, `feeding`: user-local gun semantigi.
- `expense ledger`, `fx`, `audit`: UTC instant semantigi.

---

## 2) Mevcut Durumdan Cikan Kritik Refactor Basliklari

### P0 (hemen)
1. Naive datetime parse davranisini kontrat altina alip kademeli kapatmak.
2. `recurrence exception` yolunda `new Date(date)` kullanimini kaldirmak.
3. Expense create/update route date validasyonunu query validasyonu seviyesine cekmek.
4. Mobile date utility katmaninda "UTC dogrulama" adlandirma/semantiklerini netlestirmek.

### P1 (yakindan)
1. Tum backend date boundary hesaplarini `[start, end)` standardina toplamak.
2. Finance ay semantigini urun karari ile kilitlemek (UTC month vs user-local month).
3. Mobile tarafinda date utility katmanini tek bir giris noktasina sadelemek.
4. Notification feeding path'te `schedule.time` parse logic'ini deterministic yapmak.

### P2 (kalite)
1. PDF/report ciktisi timezone semantigini urun beklentisine gore netlestirmek.
2. Feeding schedule `days` alanini string yerine enum-array modele tasimak.
3. Kullanilmayan veya semantik cakisan legacy helperlari deprecate etmek.

---

## 3) Detayli Implementasyon Fazlari

## Faz 0 - Hazirlik ve Guvenlik Cemberi

### Hedef
Degisiklikleri guvenli uygulamak icin standart ve gozlemleme mekanizmasi kurmak.

### Yapilacaklar
- [ ] ADR benzeri kisa karar dokumani ekle (`Temporal Contract`).
- [ ] Backend'e naive datetime kullanim metrigi/log ekle (warn-level).
- [ ] Mobile ve backend icin ortak test matrix dosyasi olustur.

### Dosyalar
- `docs/timezone-cross-repo-refactor-implementation-plan.md` (bu dosya)
- `../petopia-backend/src/lib/dateUtils.ts`

### Cikis Kriteri
- Naive parse nerede/ ne kadar oldugu gorunur hale gelmis olmali.

---

## Faz 1 - Backend Kontrat Sertlestirme (P0)

### 1.1 Naive datetime handling politikasini merkezi hale getir

#### Sorun
`parseUTCDate` timezone'suz datetime'i `Z` ekleyerek parse ediyor. Bu davranis bilincli ve dokumante olmali ya da strict moda gecmeli.

#### Aksiyon
- [ ] `parseUTCDate` icin modlu davranis tanimla:
  - `compat`: mevcut davranis (naive -> `Z`) + warning.
  - `strict`: timezone'suz datetime reject.
- [ ] Flag ile kontrol et (`DATE_PARSE_MODE=compat|strict`).

#### Dosya
- `../petopia-backend/src/lib/dateUtils.ts`

### 1.2 Recurrence exception parse fix

#### Sorun
`new Date(date)` runtime parse farklarina acik.

#### Aksiyon
- [ ] `recurrenceController.addException` icinde `parseUTCDate(date)` kullan.

#### Dosya
- `../petopia-backend/src/controllers/recurrenceController.ts`

### 1.3 Expense route validation strictlestirme

#### Sorun
Query tarafi strict, create/update body tarafi gevsek.

#### Aksiyon
- [ ] `createExpenseSchema.date` ve `updateExpenseSchema.date` alanlarini `dateQuerySchema` ile ayni strictlige cek.

#### Dosya
- `../petopia-backend/src/routes/expenseRoutes.ts`

### Cikis Kriteri
- Tum date input endpointleri ayni seviyede validate edilmeli.

---

## Faz 2 - Backend Boundary Standartlastirma (P1)

### 2.1 `[start, end)` standardi

#### Sorun
`$lt end` ve `$lte end-1ms` karisimi var.

#### Aksiyon
- [ ] `getUTCTodayBoundariesForTimeZone` ve `getUTCUpcomingBoundariesForTimeZone` donusunu `{ gte, lt }` seklinde normalize et.
- [ ] Event service sorgularini `$lt` ile birlestir.

#### Dosyalar
- `../petopia-backend/src/lib/dateUtils.ts`
- `../petopia-backend/src/services/eventService.ts`

### 2.2 Expense/finance month semantigi karari

#### Karar Noktasi
- Seçenek A: UTC month (mevcut).
- Seçenek B: user-local month (onerilen UX semantigi).

#### Aksiyon
- [ ] Secilen modele gore `getMonthRange/getYearRange` kullanimini revize et veya timezone-aware month range helper ekle.
- [ ] API dokumani ve frontend metinlerini guncelle.

#### Dosyalar
- `../petopia-backend/src/services/expenseService.ts`
- `../petopia-backend/src/services/userBudgetService.ts`
- `../petopia-backend/src/services/budgetAlertService.ts`

### Cikis Kriteri
- Tum range sorgulari tek standarda gecmis olmali.

---

## Faz 3 - Mobile Utility Konsolidasyonu (P1)

### 3.1 Utility katmanini teklestir

#### Sorun
`date.ts`, `dateConversion.ts`, component-level parse/format logic daginik.

#### Aksiyon
- [ ] `lib/utils/dateConversion.ts` icin net API katmani belirle (parse/serialize/convert).
- [ ] `combineDateTimeToISO` fonksiyonunu deprecated et, tum kullanimlari `combineDateTimeToISOInTimeZone`e tasi.
- [ ] `isValidUTCISOString` ad/semantik duzelt (`isValidDateTimeString` veya gercek UTC zorunlulugu).

#### Dosyalar
- `lib/utils/dateConversion.ts`
- `lib/utils/date.ts`
- `lib/utils/timezoneDate.ts`

### 3.2 Form componentlerinde deterministic parse

#### Aksiyon
- [ ] `SmartDatePicker` ve `SmartDateTimePicker` icinde `new Date(string)` fallbacklerini azalt, strict parser helper kullan.
- [ ] Output formatlarini domain bazli sadele (`LocalDate`, `LocalTime`, `Instant`).

#### Dosyalar
- `components/forms/SmartDatePicker.tsx`
- `components/forms/SmartDateTimePicker.tsx`

### 3.3 Notification feeding parse fix

#### Sorun
`new Date(schedule.time)` `'HH:mm'` gibi degerlerde belirsiz.

#### Aksiyon
- [ ] `schedule.time` parse basarisizsa degil, dogrudan format turune gore deterministic branch kullan.
- [ ] Feeding reminder trigger hesaplamasini tek helper'a al.

#### Dosya
- `lib/services/notificationService.ts`

### Cikis Kriteri
- Mobile tarafinda parse/format davranisi tek utility kontratina baglanmali.

---

## Faz 4 - API Sozlesmesi ve Client Uyumu

### Aksiyonlar
- [ ] Event endpoint cagrisinda timezone param gecis stratejisini standardize et.
- [ ] Gerekirse ortak header stratejisi (`X-Timezone`) tanimla.
- [ ] Recurrence payloadlarinda timezone zorunlulugunu dogrulayan runtime guard ekle.

### Mobile dosyalar
- `lib/services/eventService.ts`
- `lib/hooks/useEvents.ts`
- `lib/hooks/queryKeys.ts`

### Backend dosyalar
- `../petopia-backend/src/routes/eventRoutes.ts`
- `../petopia-backend/src/controllers/eventController.ts`
- `../petopia-backend/src/services/eventService.ts`

### Cikis Kriteri
- Ayni request farkli timezone ile atildiginda beklenen local-day sonucunu stabil vermeli.

---

## Faz 5 - Veri Modeli Iyilestirme (P2)

### 5.1 Feeding `days` model migration

#### Sorun
String/comma format parse-kirilgan.

#### Aksiyon
- [ ] Backend modelde `days: DayOfWeek[]` tipine gecis planla.
- [ ] API backward compatibility layer ekle (string kabul edip array'e cevir).
- [ ] Mobile schema/transform katmanini array-first modele tasit.

#### Dosyalar
- `../petopia-backend/src/models/mongoose/feedingSchedule.ts`
- `../petopia-backend/src/services/feedingScheduleService.ts`
- `lib/schemas/feedingScheduleSchema.ts`

### Cikis Kriteri
- Feeding gun secimi parse string bagimliligindan cikmis olmali.

---

## 4) Test ve Kalite Plani

## 4.1 Unit test matrix (zorunlu)
- [ ] DST forward: `Europe/Berlin` (spring transition).
- [ ] DST backward: `America/New_York` (fall transition).
- [ ] DST-free ama offset kritik: `Europe/Istanbul`.
- [ ] Half-hour zone: `Asia/Kolkata`.
- [ ] Tarih sinirlari: ay sonu/yil sonu/leap day.

## 4.2 Entegrasyon testleri
- [ ] Mobile form -> backend parse -> DB -> response -> mobile render roundtrip.
- [ ] Event `today/upcoming/calendar` endpointlerinde timezone degisim regresyonu.
- [ ] Recurrence generation + exception flow timezone regressions.

## 4.3 Komutlar

### Mobile
- `npm run lint`
- `npm run test`
- `npx tsc --noEmit`

### Backend
- `npm run lint`
- `npm run test`
- `npx tsc --noEmit`

---

## 5) Rollout ve Geri Donus (Rollback) Stratejisi

### Rollout
1. Compat mode ile yayinla (warning + telemetry).
2. Mobile yeni payload formatina gecsin.
3. Strict mode'u feature flag ile kademeli ac.

### Rollback
- Flag'i `strict -> compat` cekerek naif parse rejectlerini geri al.
- Query boundary degisikligi tek committe tutulursa hizli revert yapilabilir.

---

## 6) Task Breakdown (Sprint-ready)

## Sprint A (P0)
- [ ] Backend strict date parse modu + telemetry.
- [ ] Recurrence exception parse fix.
- [ ] Expense route date schema strictlestirme.
- [ ] Ilk regresyon test paketi.

## Sprint B (P1)
- [ ] Backend boundary standardizasyonu (`[start, end)`).
- [ ] Finance month semantic karari + implementasyon.
- [ ] Mobile utility konsolidasyonu (faz-1).

## Sprint C (P1/P2)
- [ ] SmartDatePicker/SmartDateTimePicker sadeleme.
- [ ] Notification feeding parse refactor.
- [ ] API contract dokumantasyonu.

## Sprint D (P2)
- [ ] Feeding days model migration.
- [ ] Report timezone semantik netlestirme.
- [ ] Legacy helper temizligi.

---

## 7) Basari Kriterleri (Definition of Done)

- `new Date(string)` business-critical pathlerde kaldirildi veya izole edildi.
- Tüm endpointlerde date input kontrati net ve tutarli.
- Event/recurrence/feeding timezone regresyon testleri yesil.
- `[start, end)` sorgu standardi event querylerde tam uygulandi.
- Mobile utility katmani tek bir temporal contract etrafinda toplandi.

---

## 8) Notlar

- Bu plan, mevcut timezone altyapisini sifirdan yazmak yerine kontrollu ve geri donulebilir bir refactor odaklidir.
- En yuksek ROI: P0 + boundary standardizasyonu + mobile utility sadeleme.
