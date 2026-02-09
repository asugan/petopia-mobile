# Timezone Guidelines (Mobile + Backend)

Bu dokuman, timezone refactor sonrasi ekip icin kalici kurallari tanimlar.

## 1) Veri Sozlesmesi

- `Instant`: Her zaman UTC ISO (`YYYY-MM-DDTHH:mm:ss.sssZ`)
- `LocalDate`: `YYYY-MM-DD` (timezone'suz takvim gunu)
- `LocalTime`: `HH:mm`
- `IanaTimeZone`: `Europe/Istanbul`, `America/New_York` vb.
- Offset'siz datetime (`YYYY-MM-DDTHH:mm:ss`) API'de kabul edilmez.

## 2) Parse/Format Kurallari

- Date-only parse icin `new Date('YYYY-MM-DD')` kullanma.
- Mobile:
  - `parseLocalDate(...)`, `dateOnlyToUTCMidnightISOString(...)`, `toLocalDateKey(...)` helperlarini kullan.
  - Query key timezone scoping icin `eventKeys.todayScoped/upcomingScoped/calendarScoped` kullan.
- Backend:
  - Incoming date/datetime parse icin `parseUTCDate(...)` kullan.
  - Month/year boundary hesaplari icin `getMonthRange/getYearRange/getCurrentUTCMonthRange` kullan.

## 2.1 API timezone iletim kontrati

- Event endpointlerinde timezone onceligi:
  - `query.timezone`
  - `X-Timezone` header
  - user settings timezone
  - `UTC`
- `query.timezone` veya `X-Timezone` gecilecekse IANA timezone olmalidir.
- Invalid timezone degeri `400 INVALID_TIMEZONE` / `VALIDATION_ERROR` olarak reddedilir.

## 3) Cache ve Query Key Kurallari (Mobile)

- `today`, `upcoming`, `calendar` query key'leri timezone scope edilmelidir.
- Timezone degisimi oldugunda legacy key'ler invalidate edilmelidir.
- Event mutation sonrasinda timezone-scoped ve legacy segmentler birlikte invalidate edilmelidir.

## 4) Recurrence ve Feeding Kurallari

- Recurrence day/month kararlarini daima `rule.timezone` local gun baglaminda hesapla.
- UTC day ve local day mantigini karistirma.
- Feeding reminder hesaplamasinda FE/BE parity korunmali; ayni test senaryolari her iki tarafta da yesil olmali.

## 5) Test Minimumu

- Unit:
  - `Europe/Istanbul`, `America/New_York`, `UTC`
  - DST baslangic/bitis
  - `LocalDate` parse
  - Offset'li datetime serialization
- Regression:
  - Timezone degisimi sonrasi cache segment dogrulugu
  - Recurrence day-boundary ve DST
  - Feeding reminder parity (FE + BE)

## 6) Code Review Checklist

- [ ] Yeni endpoint date field'lari strict mi?
- [ ] Offset'siz datetime engelleniyor mu?
- [ ] Date-only parse helper ile mi?
- [ ] Query key timezone-scoped mi?
- [ ] Timezone fallback tek noktadan mi resolve ediliyor?
- [ ] DST/day-boundary icin test eklendi mi?
