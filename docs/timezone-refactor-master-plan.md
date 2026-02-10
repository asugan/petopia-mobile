# Timezone Refactor Master Plan (Mobile + Backend)

Bu dokuman, `petopia-mobile` ve `petopia-backend` projelerinde timezone kullanimini tutarli, test edilebilir ve bakimi kolay bir hale getirmek icin uygulanacak refactor planidir.

## 1) Hedef

- Tum tarih/saat akisini tek bir sozlesmeye oturtmak.
- UTC/local/day-boundary kaynakli bug riskini minimuma indirmek.
- Cache, API ve domain hesaplarinda timezone uyumsuzluklarini kapatmak.

## 2) Temel Sozlesme

- `Instant`: her zaman UTC ISO (`YYYY-MM-DDTHH:mm:ss.sssZ`)
- `LocalDate`: `YYYY-MM-DD` (timezone'suz takvim gunu)
- `LocalTime`: `HH:mm`
- `IanaTimeZone`: `Europe/Istanbul`, `America/New_York` vb.
- Offset'siz datetime (`YYYY-MM-DDTHH:mm:ss`) API katmaninda kabul edilmemeli.

## 3) Kritik Bulgular (Onceliklendirilmis)

### P0 - Kritik (Hemen)

1. `dateJSONReplacer` offset'li datetime stringleri bozabiliyor
   - Dosya: `../petopia-backend/src/lib/dateUtils.ts`
   - Risk: `...+03:00Z` gibi invalid tarih olusumu

2. Event cache key'leri timezone'a gore scope edilmiyor (`today`, `upcoming`)
   - Dosyalar:
     - `lib/hooks/queryKeys.ts`
     - `lib/hooks/useEvents.ts`
   - Risk: timezone degisiminde stale/yanlis veri

3. Date-only parse noktalarinda `new Date('YYYY-MM-DD')` kullanim riski
   - Dosyalar:
     - `components/forms/SmartDatePicker.tsx`
     - `lib/utils/dateConversion.ts`
   - Risk: negatif offsetlerde gun kaymasi

### P1 - Yuksek

4. Finance domain monthly/yearly boundary hesaplari server local zamana bagli
   - Dosyalar:
     - `../petopia-backend/src/services/expenseService.ts`
     - `../petopia-backend/src/services/budgetAlertService.ts`
     - `../petopia-backend/src/services/userBudgetService.ts`

5. Expense controller query date parse dağinik/gevsek
   - Dosya: `../petopia-backend/src/controllers/expenseController.ts`

6. Recurrence day/month hesaplari timezone ile tam tutarli degil
   - Dosya: `../petopia-backend/src/services/recurrenceService.ts`

### P2 - Orta

7. FE tarafinda ad-hoc `toISOString().slice(...)` / `split('T')` kullanimlari
   - Dosyalar:
     - `lib/schemas/eventSchema.ts`
     - `components/forms/SmartDatePicker.tsx`
     - ilgili diger utility noktalar

8. Feeding reminder zaman hesap algoritmasi FE + BE'de duplicate
   - Dosyalar:
     - `lib/utils/feedingReminderTime.ts`
     - `../petopia-backend/src/services/feedingReminderService.ts`

9. Timezone normalize/fallback mantigi bazi yerlerde kopya
   - Dosyalar:
     - `lib/hooks/useEvents.ts`
     - `lib/utils/timezone.ts`
     - `../petopia-backend/src/services/feedingScheduleService.ts`
     - `../petopia-backend/src/jobs/feedingReminderChecker.ts`

## 4) Uygulama Fazlari

## Faz 1 - Guvenli Stabilizasyon (P0)

### 1.1 Backend serializer duzeltmesi
- `dateJSONReplacer` icinde sadece timezone bilgisiz datetime string normalize et.
- `Z` veya `+/-HH:mm` varsa oldugu gibi birak.

### 1.2 Event cache key timezone scope
- `eventKeys` icine:
  - `todayScoped(timezone)`
  - `upcomingScoped(timezone)`
- `useTodayEvents`, `useUpcomingEvents` bu key'leri kullansin.
- Migration icin eski key invalidate et.

### 1.3 Date-only parse guvenli hale getirme
- `parseLocalDate('YYYY-MM-DD')` helper ekle (local constructor ile).
- Form/UI katmaninda date-only parse noktalarini bu helper'a tasi.

Teslim Kriteri:
- Serializer regression testi yesil.
- Timezone degisince event cache dogru segmentten okunuyor.
- Date-only ekranlama testleri farkli timezone'larda stabil.

## Faz 2 - Domain Boundary Standardizasyonu (P1)

### 2.1 Finance boundary utility merkezi
- Backend'e merkezi utility ekle (ornek: `getMonthRange(...)`, `getYearRange(...)`).
- `expenseService`, `budgetAlertService`, `userBudgetService` bu utility'yi kullansin.

### 2.2 Expense query date parse standardi
- `expenseController` query date parse'larini `parseUTCDate` tabanli tek akisa getir.
- `expenseRoutes` tarafinda date query schema'larini strict hale getir.

### 2.3 Recurrence timezone tutarliligi
- `recurrenceService` gun/ay kararlarini `rule.timezone` baglaminda hesaplasin.
- UTC day kontrolu ile local day mantigi karismasin.

Teslim Kriteri:
- Aylik/yillik raporlar server TZ degisse de ayni sonuc veriyor.
- Recurrence DST ve gun donumlerinde beklenen eventleri uretiyor.

## Faz 3 - Kod Sadelestirme ve Tekillestirme (P2)

### 3.1 FE date helper temizligi
- `toISOString().slice`, `split('T')` patternlerini merkezi formatter/util ile degistir.
- `dateConversion` icindeki legacy/ambiguous helper'lari deprecate/kaldir.

### 3.2 Feeding reminder hesaplama tek referans
- FE/BE algoritmalarini hizala (tercihen tek kaynak mantik + test parity).

### 3.3 Timezone resolve mantigi tek noktaya topla
- duplicate normalize/fallback kodlarini kaldir.

Teslim Kriteri:
- Tarih donusumleri tek bir pattern ile ilerliyor.
- Feeding hesaplari FE ve BE'de ayni orneklere ayni sonucu veriyor.

## 5) Test Plani

## Unit Test
- `Europe/Istanbul`, `America/New_York`, `UTC` icin boundary testleri
- DST baslangic/bitis senaryolari
- `LocalDate` parse testleri (`YYYY-MM-DD`)
- Offset'li datetime serialization testleri

## Integration Test
- Event `today/upcoming/calendar` endpointleri timezone param ile
- Timezone degisimi sonrasinda cache invalidation davranisi
- Expense monthly/yearly endpointlerinin timezone bagimsizligi

## Regression Test
- Eski endpoint davranisi (timezone absent) bozulmuyor mu?
- Recurrence exception ve endDate senaryolari

## 6) Is Listesi (Dosya Bazli)

### Mobile
- `lib/hooks/queryKeys.ts`
- `lib/hooks/useEvents.ts`
- `lib/hooks/usePrefetchData.ts`
- `lib/hooks/useSmartPrefetching.ts`
- `components/forms/SmartDatePicker.tsx`
- `lib/utils/dateConversion.ts`
- `lib/utils/timezone.ts`
- `lib/utils/feedingReminderTime.ts`

### Backend
- `../petopia-backend/src/lib/dateUtils.ts`
- `../petopia-backend/src/controllers/expenseController.ts`
- `../petopia-backend/src/routes/expenseRoutes.ts`
- `../petopia-backend/src/services/expenseService.ts`
- `../petopia-backend/src/services/budgetAlertService.ts`
- `../petopia-backend/src/services/userBudgetService.ts`
- `../petopia-backend/src/services/recurrenceService.ts`
- `../petopia-backend/src/services/feedingReminderService.ts`

## 7) Definition of Done

- P0 maddeleri production'a alinmis.
- Timezone degisimi sonrasi event listeleri dogru cache segmentinden geliyor.
- Date-only parse kaynakli gun kaymasi bug'i kapanmis.
- Finance monthly/yearly raporlari server TZ'den etkilenmiyor.
- Recurrence ve feeding reminder DST testleri yesil.
- Yeni timezone guideline dokumantasyonu eklenmis.

## 8) Notlar

- Refactor sirasinda geriye donuk uyumluluk kritik: timezone parami olmayan cagrilar kontrollu fallback ile devam etmeli.
- Tumu tek PR yerine faz bazli PR'lara bolmek risk yonetimi acisindan daha guvenli.
