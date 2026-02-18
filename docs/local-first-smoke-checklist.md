# Local-First Smoke Checklist

Bu checklist local-first/backendless migration sonrasi kritik akislarin hizli dogrulamasini hedefler.

## 1) First Launch

- [ ] App acilisi login olmadan tamamlanir
- [ ] Onboarding akisi tamamlanir
- [ ] Tabs ekranlari acilir (Home / Calendar / Care / Finance / Settings)

## 2) Core CRUD

- [ ] Pet create / edit / delete
- [ ] Event create / edit / delete
- [ ] Expense create / edit / delete
- [ ] Feeding schedule create / toggle / delete

## 3) Recurrence

- [ ] Recurring event olusturma
- [ ] Series update (tum seri)
- [ ] Single occurrence edit (exception + yeni tekil event)
- [ ] Single occurrence delete (exception)
- [ ] Recurrence regenerate

## 4) Notifications (Local)

- [ ] Notification permission alma
- [ ] Event reminder chain schedule
- [ ] Feeding reminder schedule
- [ ] Budget alert local notification
- [ ] Notification navigation routing (event/care/finance)

## 5) Subscription / Gate

- [ ] RevenueCat status okunur
- [ ] Free plan limitleri uygulanir
- [ ] Downgrade flow calisir

## 6) Finance Export

- [ ] CSV export uretilir
- [ ] PDF export uretilir
- [ ] Vet summary PDF uretilir
- [ ] Share sheet acilir

## 7) Timezone Regression

- [ ] Calendar gun bazli event dagilimi dogru
- [ ] Today/Upcoming timezone dogru
- [ ] Reminder trigger zamanlari timezone ile uyumlu
