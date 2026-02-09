# Timezone Refactor Master Plan

Bu dokuman, `petopia-mobile` ve `../petopia-backend` projelerinde timezone kullanimini "mukemmel ve tutarli" hale getirmek icin uygulanacak teknik plandir.

## Hedef

- Tum tarih/saat islemlerinde tek bir mental model kullanmak
- UI gosterimi, form input/output, API filtreleme ve reminder scheduling arasinda tam tutarlilik saglamak
- Device timezone ile user timezone farkindan kaynaklanan gun kaymasi/saat kaymasi buglarini tamamen kapatmak

## Kapsam

- Mobile app (`/home/asugan/Projects/petopia-mobile`)
- Backend API (`/home/asugan/Projects/petopia-backend`)

## Mevcut Durum Ozeti

- Backend'de timezone sanitize/resolve altyapisi iyi seviyede:
  - `../petopia-backend/src/lib/timezone.ts`
  - `../petopia-backend/src/lib/dateUtils.ts`
- Mobile'da timezone secimi ve store yapisi iyi seviyede:
  - `lib/utils/timezone.ts`
  - `lib/hooks/useUserTimezone.ts`
- Ancak bazi ekranlarda ve util katmaninda device-local hesaplar ile user-timezone hesaplar karisik kullaniliyor.

## Kritik Bulgular

### P0 - Takvim Secili Gun ve API Tarih Uyumsuzlugu

- `app/(tabs)/calendar.tsx` icinde `formattedDate` hala `toISODateString(currentDate)` ile uretiliyor.
- `toISODateString` device local date uretir.
- `useCalendarEvents(..., { timezone: userTimezone })` ile birlikte kullanildiginda secili gun key'i ile backend query timezone'u farkli mantiktan gelebilir.

**Etkisi:** Bottom sheet bos gorunme, eventlerin bir gun ileri/geri listelenmesi.

### P0 - Month/Week Grid Gun Eslestirme Karisimi

- `components/calendar/MonthView.tsx`
- `components/calendar/WeekView.tsx`
- Event tarafi `toZonedTime(event.startTime, userTimezone)` ile normalize edilirken, day key tarafinda `toISODateString(day)` device-local kalabiliyor.

**Etkisi:** Dot/selected day uyumsuzlugu.

### P0 - Event Create/Edit Timezone-Aware Degil

- `lib/utils/dateConversion.ts` -> `combineDateTimeToISO`
- `hooks/useEventForm.ts`
- `components/forms/SmartDateTimePicker.tsx`

Formdaki `date + time` birlestirme su an local runtime timezone ile yapiliyor; user settings timezone farkliysa UTC'ye donusum yanlis olabilir.

**Etkisi:** Event olusturma/duzenlemede saat kaymasi.

### P1 - EventList Filtreleme vs Gruplama Mantik Ayrismasi

- `components/EventList.tsx`
  - Filtre: `startOfDay/endOfDay` (device local)
  - Gruplama: `formatInTimeZone(..., userTimezone)`

**Etkisi:** Ayni ekranda filtre sonucu ile section basligi tutarsizligi.

### P1 - Feeding Reminder Gunluk Cache UTC Gunune Gore

- `lib/hooks/useFeedingReminders.ts`
  - `new Date().toISOString().split('T')[0]`

**Etkisi:** "Bugun zaten hatirlatildi" kontrolu user timezone yerine UTC gunune gore donebilir.

### P1 - Backend Date Parsing String Format Riski

- `../petopia-backend/src/lib/dateUtils.ts`
- `../petopia-backend/src/services/recurrenceService.ts`

`fromZonedTime("YYYY-MM-DD 00:00:00", tz)` gibi space'li formatlar kullaniliyor.

**Etkisi:** Runtime parse davranisi ortama bagimli riskler (DST veya parser farkliliklari).

### P2 - Today/Upcoming Endpointlerinde Timezone Parametresi Yok

- `../petopia-backend/src/routes/eventRoutes.ts`
- `../petopia-backend/src/services/eventService.ts`

`/calendar/:date` endpoint'i client timezone kabul ederken `/today` ve `/upcoming` sadece settings timezone'a bagli.

**Etkisi:** API kontratinda asimetri, istemci tarafi kontrol kisitli.

## Mimari Karar (Final Model)

### Veri Tipleri

- `Instant`: UTC ISO datetime (`2026-02-04T07:00:00.000Z`)
- `LocalDate`: `YYYY-MM-DD`
- `LocalTime`: `HH:mm`
- `IanaTimezone`: `Europe/Istanbul` gibi timezone string

### Kural Seti

1. DB/API kalici datetime daima `Instant` (UTC ISO) olacak.
2. UI gosterimi daima `userTimezone` ile yapilacak.
3. Form input (date+time) -> `userTimezone` kullanilarak `Instant`a cevrilecek.
4. Takvim gunu sorgulari (`LocalDate`) timezone ile birlikte yorumlanacak.

## Refactor Fazlari

## Faz 1 - Calendar Core Tutarliligi (P0)

### Yapilacaklar

- `app/(tabs)/calendar.tsx`
  - `formattedDate` uretimini user timezone bazli hale getir.
  - Ornek: `formatInTimeZone(currentDate, userTimezone, 'yyyy-MM-dd')`.

- `components/calendar/MonthView.tsx` ve `components/calendar/WeekView.tsx`
  - Day key hesaplarini da user timezone semantigine sabitle.
  - Event/day eslestirme tek bir helper uzerinden calissin.

- Ortak helper ekle:
  - `lib/utils/timezoneDate.ts` (onerilen)
  - `toLocalDateKey(dateLike, timezone): string`

### Basari Kriteri

- Device timezone ne olursa olsun, secilen gun ve event dot ayni gunu isaret eder.

## Faz 2 - Event Form Conversion Dogrulugu (P0)

### Yapilacaklar

- `lib/utils/dateConversion.ts`
  - Yeni fonksiyon: `combineDateTimeToISOInTimeZone(dateStr, timeStr, timezone)`
  - `fromZonedTime` kullanarak guvenli UTC donusumu yap.

- `hooks/useEventForm.ts`
  - Edit mode parse islemi user timezone tabanli yapilsin.

- `components/forms/SmartDateTimePicker.tsx`
  - `combinedOutputName` set edilirken timezone-aware converter kullanilsin.

- `lib/schemas/eventSchema.ts`
  - Transform pipeline timezone-aware fonksiyona gecsin.

### Basari Kriteri

- Event create/edit isleminde farkli timezone kombinasyonlarinda saat kaymasi olmaz.

## Faz 3 - Listeleme, Prefetch, Reminder Gun Anahtarlari (P1)

### Yapilacaklar

- `components/EventList.tsx`
  - Filtreleme ve section/grouping ayni timezone helperlarini kullansin.

- `lib/hooks/usePrefetchData.ts` ve `lib/hooks/useSmartPrefetching.ts`
  - `today/tomorrow` key'leri user timezone bazli uretilsin.

- `lib/hooks/useFeedingReminders.ts`
  - Gunluk cache key'i UTC yerine user timezone date key olsun.

- `lib/schemas/feedingScheduleSchema.ts` (helper katmani)
  - `getNextFeedingTime` device local yerine timezone-aware hale getirilsin.

### Basari Kriteri

- Tum "bugun/yarin" hesaplari uygulama genelinde ayni timezone modeline gore calisir.

## Faz 4 - Backend API Kontrat Genisletmesi ve Sertlestirme (P1/P2)

### Yapilacaklar

- `../petopia-backend/src/routes/eventRoutes.ts`
  - `/today` ve `/upcoming` endpointlerine optional `timezone` query validation ekle.

- `../petopia-backend/src/controllers/eventController.ts`
  - Bu query parametrelerini service'e ilet.

- `../petopia-backend/src/services/eventService.ts`
  - `getTodayEvents/getUpcomingEvents` icin timezone cozumleme onceligi:
    - `clientTimezone > userSettings.timezone > UTC`

- `../petopia-backend/src/lib/dateUtils.ts` ve `../petopia-backend/src/services/recurrenceService.ts`
  - `fromZonedTime` input stringlerini ISO-style (`YYYY-MM-DDTHH:mm:ss`) yap.

### Basari Kriteri

- Calendar/today/upcoming endpointleri timezone davranisi acisindan simetrik olur.

## Faz 5 - Test Sertlestirme (P0-P2)

### Backend Testleri

- `eventService` timezone precedence testlerini `/today` ve `/upcoming` icin genislet.
- DST edge case testleri ekle (`Europe/Berlin`, `America/New_York`).
- Empty/whitespace timezone ve invalid timezone fallback testleri tamamla.

### Mobile Testleri

- Unit test: timezone-aware date key helperlari.
- Form conversion testleri: create/edit roundtrip.
- Kalender secili gun + event list integration testleri (mismatch regression).

### Manuel Test Matrisi

- Device: `America/Los_Angeles`, User: `Europe/Istanbul`
- Event saatleri: `00:30`, `09:00`, `23:30`
- DST gunleri:
  - `Europe/Berlin` DST baslangic/bitis
  - `America/New_York` DST baslangic/bitis

## Teknik Standartlar

- Timezone normalize fonksiyonu tek noktada olsun:
  - Mobile: `lib/utils/timezone.ts`
  - Backend: `src/lib/timezone.ts`
- Date key (`yyyy-MM-dd`) uretimi tek helper uzerinden yapilsin.
- Kodda `new Date(...).toISOString().split('T')[0]` kullanimi timezone-sensitive akislarda kaldirilsin.

## Implementation Checklist

- [ ] Faz 1 tamamlandi
- [ ] Faz 2 tamamlandi
- [ ] Faz 3 tamamlandi
- [ ] Faz 4 tamamlandi
- [ ] Faz 5 tamamlandi
- [ ] Regression testler green

## Riskler ve Mitigasyon

- **Risk:** Legacy akislarda beklenmeyen saat kaymasi
  - **Mitigasyon:** Kademeli rollout + snapshot test + timezone matrix

- **Risk:** API kontrat degisikligiyle eski clientlar etkilenebilir
  - **Mitigasyon:** Query parametreleri optional tutulacak, backward compatibility korunacak

- **Risk:** DST gecisleri zor edge-case yaratir
  - **Mitigasyon:** DST odakli test seti zorunlu olacak

## Beklenen Sonuc

Bu plan uygulandiginda:

- Takvim ekrani, event detay, event listesi, reminder scheduling ve backend query sinirlari tek timezone modeline baglanir.
- Device timezone farki artik bug kaynagi olmaz.
- "Bugun/yarin" ve "secili gun" davranislari tum uygulamada deterministik hale gelir.
