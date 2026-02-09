# Notification Contract v2 (Mobile + Backend)

Bu dokuman, mobil uygulama ve backend arasindaki bildirim payload sozlesmesinin tek kaynagidir.

## Channel IDs

- `event-reminders`
- `feeding-reminders`
- `budget-alerts`

## `data.screen` Enum

- event: `event`
- feeding: `feeding`
- budget: `budget`

Gecis suresince mobile, geriye donuk uyumluluk icin `finance` degerini de budget yonlendirmesi olarak kabul eder.

## `data.entityType` Enum

- event: `event`
- feeding: `feeding`
- budget: `budget`

## `data.entityId`

- event: event `_id`
- feeding: feeding schedule `_id`
- budget: user budget `_id` (yoksa bos string)

## Event Reminder Preset Dakikalari

- `standard`: `[4320, 1440, 60, 0]` (3d, 1d, 1h, event aninda)
- `compact`: `[1440, 60, 0]` (1d, 1h, event aninda)
- `minimal`: `[60, 0]` (1h, event aninda)

## Payload Ornekleri

### Event

```json
{
  "title": "Vet kontrolu",
  "body": "Mar 3, 14:00 (1h once)",
  "data": {
    "type": "event_reminder",
    "screen": "event",
    "entityType": "event",
    "entityId": "65f0...",
    "eventId": "65f0...",
    "eventType": "vet_visit"
  },
  "channelId": "event-reminders"
}
```

### Feeding

```json
{
  "title": "Luna icin yemek zamani",
  "body": "60 g dry_food",
  "data": {
    "type": "feeding_reminder",
    "screen": "feeding",
    "entityType": "feeding",
    "entityId": "78a1...",
    "scheduleId": "78a1...",
    "petId": "63c2..."
  },
  "channelId": "feeding-reminders"
}
```

### Budget

```json
{
  "title": "Budget alert",
  "body": "You are nearing your budget limit",
  "data": {
    "type": "budget_alert",
    "screen": "budget",
    "entityType": "budget",
    "entityId": "90b4...",
    "percentage": "87.5",
    "severity": "warning"
  },
  "channelId": "budget-alerts"
}
```
