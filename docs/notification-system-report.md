# Petopia Mobile Notification Sistemi Raporu

## 1. Genel Mimari

Petopia mobile uygulaması **Expo Notifications** kütüphanesi kullanarak iki katmanlı notification sistemi implemente etmiştir:

1. **Local Notifications:** Cihaz üzerinde planlanan hatırlatıcılar
2. **Push Notifications:** Backend'den gönderilen anlık bildirimler (Expo Push API)

### 1.1 Temel Bileşenler

| Bileşen | Dosya Yolu | Açıklama |
|---------|-----------|----------|
| Notification Service | `lib/services/notificationService.ts` | Ana notification servisi |
| useNotifications Hook | `lib/hooks/useNotifications.ts` | Notification yönetim hook'u |
| useEventReminders Hook | `lib/hooks/useNotifications.ts` | Event hatırlatıcı hook'u |
| useReminderScheduler Hook | `hooks/useReminderScheduler.ts` | Hatırlatıcı planlama hook'u |
| NotificationPermissionPrompt | `components/NotificationPermissionPrompt.tsx` | İzin isteme UI'ı |
| Event Reminder Store | `stores/eventReminderStore.ts` | Hatırlatıcı state yönetimi |
| User Settings Store | `stores/userSettingsStore.ts` | Kullanıcı ayarları |

---

## 2. Notification Servisi

### 2.1 NotificationService Sınıfı (`notificationService.ts`)

**Singleton Pattern** ile implemente edilmiştir.

**Temel Özellikler:**
- Event hatırlatıcıları planlama/iptal etme
- Besleme hatırlatıcıları
- Bütçe uyarıları
- Quiet Hours (Sessiz saatler) desteği
- Push token backend kaydı

**Kanal Yapılandırması (Android):**
```typescript
// Event Reminders Kanalı
name: 'Event Reminders'
importance: HIGH
vibrationPattern: [0, 250, 250, 250]
lightColor: '#FFB3D1'

// Budget Alerts Kanalı
name: 'Budget Alerts'
importance: DEFAULT
vibrationPattern: [0, 250, 250]
lightColor: '#FFD166'
```

### 2.2 Ana Metodlar

| Metod | Açıklama | Kullanım Alanı |
|-------|----------|----------------|
| `requestPermissions()` | Bildirim izni iste | İlk kurulum, ayarlar sayfası |
| `areNotificationsEnabled()` | İzin durumunu kontrol et | UI kontrolleri |
| `scheduleEventReminder(event, minutes)` | Event hatırlatıcısı planla | Event oluşturma/güncelleme |
| `scheduleMultipleReminders(event, times)` | Çoklu hatırlatıcı planla | Event zinciri |
| `cancelNotification(id)` | Tekil hatırlatıcıyı iptal et | Event güncelleme |
| `cancelEventNotifications(eventId)` | Event'in tüm hatırlatıcılarını iptal et | Event silme |
| `scheduleFeedingReminder(schedule, minutes)` | Besleme hatırlatıcısı planla | Besleme takvimi |
| `sendBudgetAlertNotification(title, body)` | Bütçe uyarısı gönder | Finans sayfası |
| `registerPushTokenWithBackend()` | Push token'ı backend'e kaydet | İzin verildiğinde |
| `unregisterPushTokenFromBackend()` | Backend kaydını sil | İzin iptal edildiğinde |

### 2.3 Quiet Hours (Sessiz Saatler)

**Varsayılan Ayarlar:** 22:00 - 08:00

**Mantık:**
```typescript
// Hatırlatıcı sessiz saatlere denk gelirse
// Sessiz saat bitimine ertelenir
if (triggerTime in quietHours) {
  triggerTime = quietHours.endTime (next day if needed)
}
```

**Konfigürasyon:**
- Aktif/Pasif toggle
- Başlangıç saati (saat + dakika)
- Bitiş saati (saat + dakika)

---

## 3. Hatırlatıcı Preset'leri

### 3.1 Standart Preset'ler (`constants/reminders.ts`)

```typescript
const REMINDER_PRESETS = {
  standard: {
    minutes: [4320, 1440, 60, 0], // 3g, 1g, 1s, tam zamanında
  },
  compact: {
    minutes: [1440, 60, 0], // 1g, 1s, tam zamanında
  },
  minimal: {
    minutes: [60, 0], // 1s, tam zamanında
  },
};
```

### 3.2 Özel Hatırlatıcı Süreleri

```typescript
const REMINDER_TIME_OPTIONS = [
  { value: 5, label: '5 dakika' },
  { value: 15, label: '15 dakika' },
  { value: 30, label: '30 dakika' },
  { value: 60, label: '1 saat' },
  { value: 120, label: '2 saat' },
  { value: 1440, label: '1 gün' },
  { value: 2880, label: '2 gün' },
  { value: 10080, label: '1 hafta' },
];
```

---

## 4. Custom Hook'lar

### 4.1 useNotifications Hook

**State'ler:**
- `permissions` - Mevcut izin durumu
- `permissionStatus` - 'granted' | 'denied' | 'undetermined'
- `isLoading` - İşlem durumu

**Metodlar:**
- `requestPermission()` - İzin iste
- `checkPermissionStatus()` - İzin durumunu kontrol et

**Otomatik İzleme:**
- Quiet hours değişikliklerini izler
- NotificationService'e senkronize eder

### 4.2 useEventReminders Hook

**State'ler:**
- `scheduledReminders` - Planlanmış hatırlatıcı listesi
- `isLoading` - Yükleme durumu

**Metodlar:**
- `scheduleReminder(event, minutes)` - Tekil hatırlatıcı planla
- `scheduleMultipleReminders(event, times)` - Çoklu planla
- `cancelReminder(notificationId)` - İptal et
- `cancelAllReminders()` - Tümünü iptal et
- `refreshReminders()` - Listeyi yenile

**Otomatik Senkronizasyon:**
- Event ID değiştiğinde hatırlatıcıları yükle
- Quiet hours aktifse zamanlamaya uyar

### 4.3 useReminderScheduler Hook

**Akıllı Planlama Mantığı:**

```typescript
if (pushTokenRegistered) {
  // Backend push notification gönderiyor
  // Local notification planlama (duplicate önleme)
  return [];
} else {
  // Local notification planla (fallback)
  return scheduleLocalReminders();
}
```

**Metodlar:**
- `scheduleChainForEvent(event, preset)` - Preset'e göre zincir planla
- `cancelRemindersForEvent(eventId)` - Event hatırlatıcılarını iptal et
- `clearReminderState(eventId)` - State'i temizle

---

## 5. State Yönetimi

### 5.1 Event Reminder Store (`eventReminderStore.ts`)

**Zustand** + **Persist** middleware kullanır.

**State'ler:**
```typescript
interface EventReminderState {
  reminderIds: Record<string, string[]>;     // Event ID → Notification ID'ler
  statuses: Record<string, EventLocalStatus>; // Event durumları
  presetSelections: Record<string, ReminderPresetKey>; // Event başına preset
  quietHoursEnabled: boolean;
  quietHours: {
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
  };
}
```

**Actions:**
- `setReminderIds(eventId, ids)` - Hatırlatıcı ID'lerini kaydet
- `clearReminderIds(eventId)` - Hatırlatıcıları temizle
- `markCompleted(eventId)` - Tamamlandı işaretle
- `markCancelled(eventId)` - İptal edildi işaretle
- `setQuietHours(quietHours)` - Sessiz saatleri güncelle

**Persist:**
- Storage: AsyncStorage
- Key: `event-reminders-storage`
- Partial persist (sadece gerekli alanlar)

### 5.2 User Settings Store

**Notification ile İlgili Ayarlar:**
```typescript
interface UserSettings {
  notificationsEnabled: boolean;        // Ana bildirim anahtarı
  budgetNotificationsEnabled: boolean;  // Bütçe uyarıları
  feedingRemindersEnabled: boolean;     // Besleme hatırlatıcıları
  quietHoursEnabled: boolean;           // Sessiz saatler aktif
  quietHours: {
    startHour: 22;
    startMinute: 0;
    endHour: 8;
    endMinute: 0;
  };
}
```

**Senkronizasyon:**
- Backend ile çift yönlü senkronizasyon
- Local varsayılanlar + API'den gelen değerler
- Değişiklikler anında API'ye gönderilir

---

## 6. UI Bileşenleri

### 6.1 NotificationPermissionPrompt

**İki Mod:**

1. **Dialog Modu:**
   - Tam ekran modal
   - İzin isteme/devre dışı bırakma
   - Faydalar listesi (3 madde)
   - Ayarlara yönlendirme butonu

2. **Card Modu (`NotificationPermissionCard`):**
   - Inline kart şeklinde
   - 3 durum: Enabled / Disabled / Prompt
   - Ayarlara yönlendirme

**Durumlar:**
- **Enabled:** Yeşil tema, checkmark ikonu
- **Disabled:** Kırmızı tema, ayarlara yönlendirme
- **Prompt:** Sarı tema, izin isteme butonu

### 6.2 Kullanılan Ekranlar

| Ekran | Dosya | Kullanım |
|-------|-------|----------|
| Settings | `app/(tabs)/settings.tsx` | Ana bildirim ayarları |
| LargeTitle | `components/LargeTitle.tsx` | Hızlı toggle |
| Care | `app/(tabs)/care.tsx` | Besleme hatırlatıcıları |
| Finance | `app/(tabs)/finance.tsx` | Bütçe uyarıları |

---

## 7. Çalışma Akışları

### 7.1 İlk Kurulum Akışı

```
1. Kullanıcı uygulamayı açar
2. App._layout.tsx notification listener'ları başlatır
3. Settings sayfası yüklenir
4. NotificationPermissionPrompt gösterilir (izin yoksa)
5. Kullanıcı "Etkinleştir"e tıklar
6. requestPermissions() çağrılır
7. İzin verilirse:
   a. registerPushTokenWithBackend() çağrılır
   b. Expo Push Token alınır
   c. Backend'e kaydedilir
   d. SecureStore'a cache'lenir
8. updateSettings({ notificationsEnabled: true }) ile backend güncellenir
```

### 7.2 Event Hatırlatıcı Planlama Akışı

```
1. Kullanıcı event oluşturur/günceller
2. Event reminder toggle'ı aktifse:
   a. useReminderScheduler.scheduleChainForEvent() çağrılır
   b. Push token backend'de kayıtlı mı kontrol edilir
   c. Eğer kayıtlıysa:
      - Local notification planlamaya gerek yok (backend gönderir)
   d. Eğer kayıtlı değilse:
      - Event preset'i belirlenir (standard/compact/minimal)
      - Quiet hours kontrol edilir
      - scheduleMultipleReminders() ile local notification planlanır
      - Notification ID'leri store'a kaydedilir
3. Event güncellenirse:
   a. Önceki hatırlatıcılar iptal edilir
   b. Yenileri planlanır
```

### 7.3 Bildirim Tıklama Akışı

```
1. Kullanıcı notification'a tıklar
2. Notifications.addNotificationResponseReceivedListener tetiklenir
3. notificationService.handleNotificationResponse() çağrılır
4. Data payload parse edilir:
   - screen: 'event' → Event detay sayfasına yönlendir
   - screen: 'budget' → Finance sayfasına yönlendir
   - screen: 'feeding' → Care sayfasına yönlendir
5. Router.push() ile ilgili sayfaya yönlendirme yapılır
```

### 7.4 Timezone Değişikliği Akışı

```
1. App._layout.tsx'de upcomingEvents izlenir
2. Timezone değişikliği algılanır (Intl.DateTimeFormat)
3. Tüm aktif event hatırlatıcıları yeniden planlanır
4. Signature-based cache ile gereksiz planlamalar önlenir
```

---

## 8. Backend Entegrasyonu

### 8.1 API Endpoints

```typescript
// Cihaz kaydı
POST   /api/push/devices
DELETE /api/push/devices
GET    /api/push/devices

// Test notification
POST   /api/push/test

// Besleme schedule notification durumu
GET    /api/feeding-schedules/:id/notifications
```

### 8.2 Token Yönetimi

**SecureStore Keys:**
- `deviceId` - Benzersiz cihaz ID
- `expoPushToken` - Expo push token
- `pushTokenRegisteredWithBackend` - Backend kayıt durumu cache'i

**Registration Flow:**
```typescript
1. getExpoPushTokenAsync() - Token al
2. SecureStore'dan deviceId getir (veya oluştur)
3. POST /api/push/devices
4. SecureStore'a cache'le
```

**Smart Registration Check:**
- Önce local cache kontrolü (hızlı)
- Gerekirse backend'den doğrulama (ağ çağrısı)

---

## 9. Çift Bildirim Önleme (Duplicate Prevention)

### 9.1 Mantık

```typescript
const scheduleChainForEvent = async (event) => {
  // Backend push token kayıtlı mı?
  const pushRegistered = await isPushTokenRegistered();
  
  if (pushRegistered) {
    // Backend zaten push notification gönderecek
    // Local notification planlama (duplicate olur)
    clearReminderIds(event._id);
    return [];
  }
  
  // Fallback: Local notification planla
  return scheduleLocalReminders(event);
};
```

### 9.2 Senaryolar

| Senaryo | Backend Push | Local Push | Sonuç |
|---------|--------------|------------|-------|
| Token kayıtlı + İzin verilmiş | ✅ | ❌ | Sadece backend |
| Token kayıtlı + İzin reddedilmiş | ❌ | ❌ | Bildirim yok |
| Token kayıtlı değil + İzin verilmiş | ❌ | ✅ | Sadece local |
| Uçak modu / Offline | ❌ | ✅ | Local fallback |

---

## 10. Hata Yönetimi

### 10.1 İzin Hataları

**Permanently Denied:**
- Ayarlara yönlendirme butonu göster
- `Linking.openSettings()` ile sistem ayarlarına gönder

**Undetermined:**
- Dialog göster, izin iste
- Faydaları listele

### 10.2 Token Hataları

**Invalid Token:**
- Backend otomatik temizler
- Yeniden kayıt denemesi

**Network Hatası:**
- Retry mekanizması (expo-notifications içinde)
- Cache'den fallback

### 10.3 Schedule Hataları

**Geçmiş Zaman:**
- Otomatik filtreleme
- `triggerDate <= new Date()` kontrolü

**Duplicate Time:**
- `Set` kullanarak benzersiz zamanlar
- Aynı zamanda birden fazla hatırlatıcı önleme

---

## 11. Emoji ve İkonlar

### 11.1 Event Tipi Emoji'leri

```typescript
const eventTypeEmoji = {
  feeding: '🍽️',
  exercise: '🏃',
  grooming: '✂️',
  play: '🎾',
  training: '🎓',
  vet_visit: '🏥',
  walk: '🚶',
  bath: '🛁',
  vaccination: '💉',
  medication: '💊',
  other: '📅',
};
```

### 11.2 Mama Tipi Emoji'leri

```typescript
const foodTypeEmoji = {
  dry_food: '🍖',
  wet_food: '🥫',
  raw_food: '🥩',
  homemade: '🍲',
  treats: '🦴',
  supplements: '💊',
  other: '🍽️',
};
```

---

## 12. Test ve Debugging

### 12.1 Test Notification

```typescript
// Backend üzerinden test
await api.post('/api/push/test', {
  title: 'Petopia Test',
  body: 'Test bildirimi başarılı!',
});
```

### 12.2 Debug Tools

- `notificationService.getNotificationStats()` - İstatistikler
- `Notifications.getAllScheduledNotificationsAsync()` - Planlanmış listesi
- Expo Push Notification Tool (web arayüz)

---

## 13. Gelecek Geliştirmeler

### 13.1 Planlanan Özellikler

- **Rich Notifications:** Görseller, action butonları
- **Grouped Notifications:** Aynı event için gruplama
- **Badge Count:** App ikonu üzerinde sayı
- **Critical Alerts:** Acil durum bildirimleri (iOS)
- **Notification History:** Geçmiş bildirimler listesi

### 13.2 İyileştirmeler

- **Batch Token Refresh:** Toplu token yenileme
- **Analytics:** Bildirim açılma oranları
- **A/B Testing:** Farklı hatırlatıcı stratejileri

---

**Rapor Tarihi:** 29 Ocak 2026  
**Mobile Path:** `/home/asugan/Projects/petopia-mobile`  
**Expo SDK:** ~52.0.0  
**expo-notifications:** ~0.28.19
