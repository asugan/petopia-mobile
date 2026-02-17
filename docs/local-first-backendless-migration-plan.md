# Local-First Backendless Migration Plan (Rev 2)

## Guncel Durum (2026-02-17)

Tamamlanan ana basliklar:

- React Query runtime bagimliligi kaldirildi, app QueryClient olmadan calisiyor.
- Auth route/store/client katmani kaldirildi, login/signup zorunlulugu yok.
- Local DB + repository katmani aktif, temel domain servisleri local-first akista.
- CSV/PDF export akisi cihazda uretiliyor ve paylasiliyor.
- `usePublicConfig` bagimliligi kaldirildi (static/env config kullanimi).
- `@tanstack/react-query`, `axios`, `better-auth`, `@better-auth/expo` paketleri kaldirildi.

Bu snapshot icin dogrulama:

- `npx tsc --noEmit` gecerli
- `npm run test` gecerli (25/25 dosya, 81/81 test)

Kalan ana isler (bilerek sonraya birakildi):

- Integration (Expo) ve manuel regression checklist maddelerini cihaz uzerinde kapatma.

Bu revizyon, yeni kararlarin tamamini kapsar:

- Auth tamamen kaldirilacak
- Backend API bagimliligi kaldirilacak
- `@tanstack/react-query` tamamen kaldirilacak
- Sorgular Drizzle ile yazilacak
- RevenueCat client-side kullanilacak
- Bildirimler sadece local notification olacak
- CSV ve PDF raporlar cihazda uretilecek
- Eski datalar korunmayacak, sifirdan baslanacak (data migration yok)

## 1) Scope ve hedef

### In-scope

- `expo-sqlite` + `drizzle-orm` ile local veritabani
- Tum domain verilerinin local DB'ye alinmasi:
  - pets
  - events
  - recurrence rules
  - feeding schedules
  - health records
  - expenses
  - user settings
  - budget + budget alert state
- Auth katmaninin tamamen kaldirilmasi
- React Query katmaninin tamamen kaldirilmasi
- RevenueCat durumunun backend verify olmadan client-side yonetimi
- Push token backend kayit akisinin kaldirilmasi
- Export CSV/PDF islerinin cihazda uretimi

### Out-of-scope (bilerek)

- Multi-device sync
- Cloud backup / restore
- Server-driven config (`/api/public-config`)
- Backend push notification
- Eski veri migrationi (DB transfer / transform)

## 2) Kritik prensipler

1. Data migration yok
- Mevcut/legacy datalarin tasinmasi yapilmayacak.
- Gerekirse ilk local-first surumde DB reset uygulanacak.

2. React Query yok
- `QueryClient`, `useQuery`, `useMutation`, query key/cache altyapisi kaldirilacak.
- Domain hooklari Drizzle uzerinden dogrudan veri okuyacak/yazacak.

3. Tek kaynak local DB
- Tum operasyonlar internet olmadan calisacak.

## 3) Hedef mimari

### 3.1 Data layer

- Engine: `expo-sqlite`
- ORM: `drizzle-orm` (Expo SQLite driver)
- DB dosyasi: `petopia.db`
- Init stratejisi: migration yerine idempotent table create
  - `CREATE TABLE IF NOT EXISTS ...`
  - Gerekirse major surum gecisinde tam reset

### 3.2 Query/State layer (React Query'siz)

- `@tanstack/react-query` kaldirilir.
- Yeni model:
  - `lib/repositories/*`: Drizzle sorgulari
  - `lib/services/*`: domain is kurallari
  - `lib/hooks/*`: `useEffect` + `useState` + gerekirse Zustand tetikleyicileri
- Cache ihtiyaci minimal tutulur, ekran odakli yeniden yukleme tercih edilir.

### 3.3 Auth

- `better-auth` tamamen kaldirilir.
- App login gerektirmeden acilir.

### 3.4 Subscription

- RevenueCat tek kaynak olacak (client-side)
- Trial/pro durumu client policy + RevenueCat customerInfo ile takip edilir.

### 3.5 Notification

- Sadece Expo local notifications
- Push register/unregister/verify backend kodlari silinir.

### 3.6 Export

- CSV: local dosya uretimi + share
- PDF: HTML -> PDF (onerilen `expo-print`) + share

## 4) Fazli plan

## Faz 0 - Hazirlik

- [x] Branch ac: `refactor/local-first-no-react-query`
- [x] Kritik ekranlar icin smoke checklist olustur
- [x] "No migration" karari dokumante et

Deliverable:
- Uygulama sifirdan baslatma stratejisi net.

## Faz 1 - SQLite + Drizzle kurulum (migration olmadan)

- [x] Paketler:
  - `expo-sqlite`
  - `drizzle-orm`
  - (PDF icin) `expo-print`
- [x] `lib/db/client.ts` olustur
- [x] `lib/db/schema/*.ts` olustur
- [x] `lib/db/init.ts` yaz:
  - tablo create (if not exists)
  - opsiyonel hard reset helper (dev / major upgrade)

Not:
- `drizzle-kit`/SQL migration pipeline zorunlu degil.
- Bu planda "schema migration" yerine "reset + recreate" yaklasimi var.

Deliverable:
- App acilisinda DB hazir, migration script yok.

## Faz 2 - React Query sokumu

- [x] `QueryClientProvider` kaldir (`app/_layout.tsx`)
- [x] `lib/config/queryConfig.ts` kaldir
- [x] `lib/hooks/core/*` (`useResource`, `useResources`, `useConditionalQuery`, query key factory) kaldir veya yenile
- [x] `useOnlineManager` gibi query-spesifik hooklari temizle

Deliverable:
- App React Query olmadan derleniyor.

## Faz 3 - Domain katmani Drizzle'a tasima

Sira (dusuk risk -> yuksek risk):

1) Pets + User Settings
- [x] `petService`
- [x] `userSettingsService`

2) Health + Expense + Budget
- [x] `healthRecordService`
- [x] `expenseService`
- [x] `userBudgetService`

3) Events + Feeding
- [x] `eventService`
- [x] `feedingScheduleService`

4) Recurrence
- [x] `recurrenceService`
- [x] series update/regenerate/exception akislari

Deliverable:
- Tum tab ekranlarinda veri lokal DB'den geliyor.

## Faz 4 - Auth tamamen kaldirma

- [x] `lib/auth/client.ts`, `lib/auth/useAuth.ts` kaldir
- [x] `providers/AnalyticsIdentityProvider.tsx` sadele / kaldir
- [x] `(auth)` route grubunu kaldir veya lokal onboarding'e redirect et
- [x] auth guard kodlarini temizle (`app/index.tsx`, `app/(tabs)/_layout.tsx`, `app/_layout.tsx`)

Deliverable:
- Login/signup olmadan uygulama acilir.

## Faz 5 - Subscription client-side RevenueCat

- [x] `subscriptionApiService` kaldir / `subscriptionService` olarak sade local servis haline getir
- [x] `useSubscriptionQueries` backend yerine local + RevenueCat yap
- [x] downgrade kurallarini lokal pet sayisina bagla
- [x] `usePublicConfig` bagimliligini kaldir (RevenueCat config env/static)

Deliverable:
- Subscription akislari backend olmadan calisir.

## Faz 6 - Notification tamamen local

- [x] `notificationService` icindeki backend push fonksiyonlarini sil
- [x] settings ekraninda register/unregister backend cagrilarini sil
- [x] event/feeding/budget reminder scheduling tamamen local kalir

Deliverable:
- Bildirimler internet bagimsiz calisir.

## Faz 7 - CSV/PDF cihazda uretim

- [x] CSV: local query -> csv string -> file write -> share
- [x] PDF: html template -> `expo-print` -> share
- [x] `expenseService` icindeki backend download endpoint bagimliliklarini sil

Deliverable:
- Finance export backend'siz tamamlanir.

## Faz 8 - Temizlik

- [x] `lib/api/*` tamamen kaldir
- [x] `ENV.ENDPOINTS`, `EXPO_PUBLIC_API_URL` temizle
- [x] `usePublicConfig` kaldir
- [x] `accountService` local reset mantigina cevir veya kaldir
- [x] package cleanup: kullanilmayan dependencyleri sil

Deliverable:
- Kod tabaninda backend endpoint ve React Query referansi kalmaz.

## 5) Etkilenecek ana dosyalar

### Kaldirilacak

- `lib/api/client.ts`
- `lib/auth/client.ts`
- `lib/auth/useAuth.ts`
- `lib/services/subscriptionApiService.ts`
- `lib/hooks/usePublicConfig.ts`
- `lib/config/queryConfig.ts`
- `lib/hooks/core/useResource.ts`
- `lib/hooks/core/useResources.ts`
- `lib/hooks/core/useConditionalQuery.ts`

### Buyuk refactor

- `lib/services/subscriptionService.ts`
- `lib/services/petService.ts`
- `lib/services/eventService.ts`
- `lib/services/healthRecordService.ts`
- `lib/services/feedingScheduleService.ts`
- `lib/services/expenseService.ts`
- `lib/services/userBudgetService.ts`
- `lib/services/userSettingsService.ts`
- `lib/services/recurrenceService.ts`
- `lib/services/notificationService.ts`
- `lib/hooks/usePets.ts`
- `lib/hooks/useEvents.ts`
- `lib/hooks/useExpenses.ts`
- `lib/hooks/useHealthRecords.ts`
- `lib/hooks/useFeedingSchedules.ts`
- `lib/hooks/useRecurrence.ts`
- `lib/hooks/useUserBudget.ts`

### Layout/provider

- `app/_layout.tsx`
- `app/index.tsx`
- `app/(tabs)/_layout.tsx`
- `providers/AnalyticsIdentityProvider.tsx`
- `providers/SubscriptionProvider.tsx`

## 6) Test plani

### Unit

- [x] Repository CRUD testleri
- [x] Recurrence generation testleri
- [x] Budget hesaplama testleri
- [x] Export CSV/PDF generation testleri

### Integration (Expo)

- [ ] First launch (sifir data) sorunsuz
- [ ] Pet/Event/Expense create-edit-delete
- [ ] Notification scheduling flow
- [ ] Subscription gate flow

### Regression checklist

- [ ] Home tab verileri dogru
- [ ] Calendar timezone davranisi dogru
- [ ] Care reminderlari dogru
- [ ] Finance export aciliyor/paylasiliyor

## 7) Riskler ve mitigasyon

1. React Query kaldirma sonrasi UI state daginikligi
- Mitigasyon: domain bazli custom hook standardi + ortak load/error pattern.

2. No migration nedeniyle schema degisiklikleri
- Mitigasyon: major degisiklikte kontrollu DB reset politikasi.

3. Subscription backend verify olmayinca guvenlik
- Mitigasyon: RevenueCat source-of-truth + sik customerInfo refresh.

4. PDF platform farklari
- Mitigasyon: ortak HTML template + iOS/Android cihaz testi.

## 8) Kabul kriterleri (Definition of Done)

- [x] Uygulama backend URL olmadan aciliyor
- [x] Uygulama React Query olmadan calisiyor
- [x] Tum temel domain CRUD akislari internet olmadan calisiyor
- [x] Login/signup/auth zorunlulugu yok
- [x] Subscription flow RevenueCat client-side calisiyor
- [x] Bildirimler local scheduler ile calisiyor
- [x] CSV/PDF export cihazda uretilip paylasiliyor
- [x] Kod tabaninda `/api/*` endpoint referansi kalmiyor

## 9) Tahmini takvim

- Faz 0-2: 4-6 gun
- Faz 3-4: 8-12 gun
- Faz 5-7: 5-8 gun
- Faz 8: 2-3 gun

Toplam: yaklasik 3-5 hafta.

---

## Ek: Hemen sonraki ilk 5 is

1. `lib/db/client.ts`, `lib/db/schema/*`, `lib/db/init.ts` olustur (migration yok).
2. `app/_layout.tsx` icinden `QueryClientProvider` ve query bagimli kodlari kaldir.
3. `lib/hooks/usePets.ts` ve `lib/services/petService.ts` ikilisini Drizzle'a gecir.
4. `lib/auth/*` ve auth guardlarini sokerek app acilisini auth'suz hale getir.
5. `expenseService` icin local CSV/PDF generation pipeline'ini devreye al.
