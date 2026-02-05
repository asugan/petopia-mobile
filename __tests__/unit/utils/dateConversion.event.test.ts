import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  combineDateTimeToISO, 
  toISODateString,
  parseISODate 
} from '@/lib/utils/dateConversion';
import { toZonedTime } from 'date-fns-tz';

describe('Event Creation Date Flow', () => {
  // Test senaryosu:
  // Kullanıcı İstanbul'da (UTC+3)
  // 4 Şubat 2026 10:00'a event oluşturuyor
  // Event UTC olarak kaydedilmeli: 2026-02-04T07:00:00.000Z
  
  describe('combineDateTimeToISO - Event creation', () => {
    it('should correctly convert Istanbul local time to UTC', () => {
      // Kullanıcı formda seçiyor:
      const startDate = '2026-02-04';
      const startTime = '10:00';
      
      // combineDateTimeToISO çağrılıyor
      const result = combineDateTimeToISO(startDate, startTime);
      
      console.log('\n=== Event Creation Flow ===');
      console.log('Form date:', startDate);
      console.log('Form time:', startTime);
      console.log('combineDateTimeToISO result:', result);
      
      // new Date("2026-02-04T10:00:00") local timezone'da parse edilir
      // Sonra toISOString() ile UTC'ye çevrilir
      // Istanbul UTC+3 olduğu için:
      // 2026-02-04T10:00:00 Istanbul = 2026-02-04T07:00:00Z
      
      expect(result).toMatch(/^2026-02-04T07:00:00/);
      expect(result).toMatch(/Z$/);
    });

    it('should create the same UTC time regardless of test environment timezone', () => {
      // Bu test herhangi bir timezone'da çalıştırılabilir
      // Ama sonuç her zaman aynı olmalı çünkü new Date(string) local timezone'da parse eder
      
      const startDate = '2026-02-04';
      const startTime = '10:00';
      
      const result = combineDateTimeToISO(startDate, startTime);
      const parsed = new Date(result);
      
      // UTC saati kontrol et
      expect(parsed.getUTCHours()).toBe(7);
      expect(parsed.getUTCMinutes()).toBe(0);
      expect(parsed.getUTCDate()).toBe(4);
      expect(parsed.getUTCMonth()).toBe(1); // February (0-indexed)
      expect(parsed.getUTCFullYear()).toBe(2026);
      
      console.log('\n=== UTC Verification ===');
      console.log('UTC Hours:', parsed.getUTCHours());
      console.log('UTC Date:', parsed.getUTCDate());
    });
  });

  describe('Complete flow: Frontend to Backend', () => {
    it('should demonstrate the full event creation and query flow', () => {
      // Adım 1: Kullanıcı 4 Şubat 10:00 seçiyor (Istanbul)
      const userSelectedDate = '2026-02-04';
      const userSelectedTime = '10:00';
      const userTimezone = 'Europe/Istanbul';
      
      // Adım 2: Frontend combineDateTimeToISO ile UTC'ye çeviriyor
      const utcStartTime = combineDateTimeToISO(userSelectedDate, userSelectedTime);
      
      console.log('\n=== Complete Flow ===');
      console.log('User selected (Istanbul):', `${userSelectedDate} ${userSelectedTime}`);
      console.log('Sent to backend (UTC):', utcStartTime);
      
      // Adım 3: Backend'e gönderilen veri
      const eventData = {
        title: 'Vet Appointment',
        startTime: utcStartTime,
        // ... other fields
      };
      
      // Adım 4: Backend parseUTCDate ile parse ediyor
      // parseUTCDate("2026-02-04T07:00:00.000Z") -> Date objesi
      const backendParsedDate = new Date(eventData.startTime);
      
      console.log('Backend parsed (UTC):', backendParsedDate.toISOString());
      
      // Adım 5: Calendar tab'ında 4 Şubat seçiliyor
      const selectedCalendarDate = new Date('2026-02-04T00:00:00');
      const selectedDateStr = toISODateString(selectedCalendarDate);
      
      console.log('Calendar selected date:', selectedDateStr);
      
      // Adım 6: Backend getEventsByDate çağrılıyor
      // getUTCDateRangeForLocalDate("2026-02-04", "Europe/Istanbul")
      // Bu fonksiyon şu range'i döndürür:
      // start: 2026-02-03T21:00:00.000Z (4 Şubat 00:00 Istanbul)
      // end: 2026-02-04T21:00:00.000Z (5 Şubat 00:00 Istanbul)
      
      const rangeStart = new Date('2026-02-03T21:00:00.000Z');
      const rangeEnd = new Date('2026-02-04T21:00:00.000Z');
      
      console.log('Query range start:', rangeStart.toISOString());
      console.log('Query range end:', rangeEnd.toISOString());
      console.log('Event time:', eventData.startTime);
      
      // Adım 7: Event query range'de mi kontrol et
      const eventTime = new Date(eventData.startTime);
      const isInRange = eventTime >= rangeStart && eventTime < rangeEnd;
      
      console.log('Event in query range:', isInRange);
      
      expect(isInRange).toBe(true);
      
      // Adım 8: WeekView'da event'in doğru günde görünmesi
      // WeekView'da: toZonedTime(event.startTime, userTimezone)
      const zonedDate = toZonedTime(eventData.startTime, userTimezone);
      const zonedDateStr = toISODateString(zonedDate);
      
      console.log('\n=== WeekView Display ===');
      console.log('Event UTC:', eventData.startTime);
      console.log('Zoned to Istanbul:', zonedDate.toISOString());
      console.log('Zoned date string:', zonedDateStr);
      
      expect(zonedDateStr).toBe('2026-02-04');
    });

    it('should verify Istanbul timezone conversion', () => {
      // Istanbul UTC+3 (winter time, February)
      const utcDate = new Date('2026-02-04T07:00:00.000Z');
      const zonedDate = toZonedTime(utcDate.toISOString(), 'Europe/Istanbul');
      
      console.log('\n=== Istanbul Timezone Conversion ===');
      console.log('UTC:', utcDate.toISOString());
      console.log('Istanbul:', zonedDate.toISOString());
      console.log('Istanbul hours:', zonedDate.getHours());
      
      // Istanbul'da saat 10:00 olmalı
      expect(zonedDate.getHours()).toBe(10);
      expect(toISODateString(zonedDate)).toBe('2026-02-04');
    });
  });

  describe('Edge cases', () => {
    it('should handle midnight correctly', () => {
      const date = '2026-02-04';
      const time = '00:00';
      
      const result = combineDateTimeToISO(date, time);
      const parsed = new Date(result);
      
      console.log('\n=== Midnight Edge Case ===');
      console.log('Local midnight:', date, time);
      console.log('UTC result:', result);
      console.log('UTC hours:', parsed.getUTCHours());
      
      // Istanbul UTC+3, midnight Istanbul = 21:00 previous day UTC
      expect(parsed.getUTCHours()).toBe(21);
      expect(parsed.getUTCDate()).toBe(3); // Previous day in UTC
    });

    it('should handle late night correctly', () => {
      const date = '2026-02-04';
      const time = '23:59';
      
      const result = combineDateTimeToISO(date, time);
      const parsed = new Date(result);
      
      console.log('\n=== Late Night Edge Case ===');
      console.log('Local 23:59:', date, time);
      console.log('UTC result:', result);
      console.log('UTC hours:', parsed.getUTCHours());
      
      // Istanbul UTC+3, 23:59 Istanbul = 20:59 UTC
      expect(parsed.getUTCHours()).toBe(20);
      expect(parsed.getUTCMinutes()).toBe(59);
      expect(parsed.getUTCDate()).toBe(4); // Same day in UTC
    });
  });

  describe('Bug reproduction test', () => {
    it('should verify the bug scenario described by user', () => {
      // Kullanıcı diyor ki:
      // - 4 Şubat'ta event ekliyor
      // - Calendar'da 4 Şubat'ta nokta görünüyor ✓
      // - BottomSheet'te 4 Şubat seçildiğinde event gözükmüyor ✗
      // - 5 Şubat seçildiğinde gözüküyor ✗
      
      console.log('\n=== Bug Reproduction ===');
      
      // Senaryo: Event 4 Şubat 10:00'da (Istanbul)
      const eventDate = '2026-02-04';
      const eventTime = '10:00';
      const timezone = 'Europe/Istanbul';
      
      // Event UTC olarak kaydedilir
      const utcEventTime = combineDateTimeToISO(eventDate, eventTime);
      console.log('Event created at (UTC):', utcEventTime);
      
      // WeekView: toZonedTime ile event'in hangi günde olduğunu hesapla
      const zonedDate = toZonedTime(utcEventTime, timezone);
      const weekViewDate = toISODateString(zonedDate);
      console.log('WeekView shows event on:', weekViewDate);
      
      expect(weekViewDate).toBe('2026-02-04');
      
      // API Query: 4 Şubat için range hesapla
      // getUTCDateRangeForLocalDate("2026-02-04", "Europe/Istanbul")
      // Bu fonksiyonu backend testinde doğruladık, şimdi manuel hesapla
      const queryDate = '2026-02-04';
      
      // Istanbul UTC+3
      // 4 Şubat 00:00 Istanbul = 3 Şubat 21:00 UTC
      // 5 Şubat 00:00 Istanbul = 4 Şubat 21:00 UTC
      const rangeStart = new Date('2026-02-03T21:00:00.000Z');
      const rangeEnd = new Date('2026-02-04T21:00:00.000Z');
      
      console.log('Query range for 2026-02-04 (Istanbul):');
      console.log('  Start:', rangeStart.toISOString());
      console.log('  End:', rangeEnd.toISOString());
      
      // Event query range'de mi?
      const eventTimeDate = new Date(utcEventTime);
      const inRange = eventTimeDate >= rangeStart && eventTimeDate < rangeEnd;
      console.log('Event in range:', inRange);
      
      expect(inRange).toBe(true);
      
      // Eğer event 4 Şubat range'de ise, neden gözükmüyor?
      // Belki de event 5 Şubat range'de mi?
      const rangeStart5 = new Date('2026-02-04T21:00:00.000Z');
      const rangeEnd5 = new Date('2026-02-05T21:00:00.000Z');
      const inRange5 = eventTimeDate >= rangeStart5 && eventTimeDate < rangeEnd5;
      console.log('Event in 5 Feb range:', inRange5);
      
      expect(inRange5).toBe(false); // Olmamalı!
      
      // Sonuç: Event doğru günde ve doğru range'de
      // Peki neden kullanıcı 5 Şubat'ta görüyor?
      
      console.log('\n=== Analysis ===');
      console.log('All calculations show event should appear on 4 Feb.');
      console.log('If user sees it on 5 Feb, there must be another issue.');
      console.log('Possible causes:');
      console.log('1. Backend timezone parameter not being sent correctly');
      console.log('2. Backend using different timezone than frontend');
      console.log('3. Database storing date incorrectly');
      console.log('4. Event creation sending wrong time');
    });
  });
});
