# Timezone Refactor Report (Mobile + Backend)

Date: 2026-02-09
Scope:
- `petopia-mobile`
- `petopia-backend`

## Executive Summary

The event flow is mostly timezone-safe and already uses strong patterns (`date-fns-tz`, timezone-scoped queries, local-day boundary logic). The highest remaining risk is inconsistent date parsing/formatting in non-event domains (health/expense/pet), plus acceptance of ambiguous datetime strings (timezone-less inputs).

Primary priorities:
1. Enforce canonical wire formats (`Instant`, `LocalDate`, `LocalTime`) at app and API boundaries.
2. Remove timezone-naive date rendering in health/expense/pet screens.
3. Fix end-date inclusivity and recurrence exception serialization edge cases.

## Canonical Contract (Target)

- `Instant` fields: strict RFC3339 UTC string (e.g. `2026-02-09T10:30:00.000Z`).
- `LocalDate` fields: strict `YYYY-MM-DD` only.
- `LocalTime` fields: strict `HH:mm`; must be interpreted with explicit IANA timezone.
- Never accept timezone-less datetime (`YYYY-MM-DDTHH:mm[:ss]`) at long-term API boundary.

## Findings (Prioritized)

### Critical

1. Ambiguous datetime acceptance in mobile serialization paths
- Risk: timezone-less datetime strings can drift by hours/day between users.
- Evidence:
  - `lib/utils/dateConversion.ts`
  - `lib/services/petService.ts`
  - `lib/services/expenseService.ts`

### High

1. Date-only end range semantics can exclude same-day records
- Risk: `endDate=YYYY-MM-DD` interpreted as start of day instead of full-day inclusive.
- Evidence:
  - `petopia-backend/src/services/eventService.ts`
  - `petopia-backend/src/services/expenseService.ts`
  - `petopia-backend/src/services/healthRecordService.ts`

2. Recurrence exception serialization can become locale-dependent
- Risk: non-ISO string reaches backend validation/parsing.
- Evidence:
  - `app/event/[id].tsx`

3. Health UI has timezone-naive rendering
- Risk: day shifts around UTC midnight / DST boundaries.
- Evidence:
  - `app/(tabs)/care.tsx`
  - `app/health/[id].tsx`
  - `components/HealthOverview.tsx`

### Medium

1. Legacy picker hardcodes locale (`tr-TR`)
- Risk: i18n inconsistency and local parsing/rendering divergence.
- Evidence:
  - `components/DateTimePicker.tsx`

2. DST-naive feeding next-time helper (`+24h` arithmetic)
- Risk: wrong next schedule on DST transition days.
- Evidence:
  - `lib/utils/activityUtils.ts`

3. Server-local date mutations in backend utilities
- Risk: environment-dependent behavior.
- Evidence:
  - `petopia-backend/src/config/subscriptionConfig.ts`
  - `petopia-backend/src/services/exchangeRateService.ts`

## Refactor Plan

### Phase 1 (Quick Wins)
- Normalize recurrence exception date to strict ISO UTC.
- Replace health list/detail date formatting with timezone-aware helper.
- Remove hardcoded locale from legacy picker.
- Fix event calendar invalidation to include timezone-scoped cache keys.
- Fix feeding next-time computation to use timezone-aware utility.

### Phase 2 (Boundary Hardening)
- Mobile: reject timezone-less datetime in shared serializer.
- Backend: use end-of-day semantics for date-only range `endDate`.
- Backend: introduce dedicated range-end date parser utility.

### Phase 3 (Strict Contract)
- Backend boundary: warn then reject timezone-less datetime payloads.
- Align TS API response types with wire (`string` for datetime).
- Add validation for persisted timezone fields.

## Rollout / Compatibility

1. Release A
- Ship strict serialization on mobile and inclusive endDate semantics on backend.
- Keep parser compatibility but add warnings/metrics for naive datetime usage.

2. Release B
- Turn warnings into 400 validation errors for timezone-less datetime.
- Update client schemas/tests to strict-only.

3. Release C
- Remove fallback code paths and document final contract in API docs.

## Testing Matrix

- DST boundaries: Europe/Berlin, America/New_York.
- Non-DST zones: Europe/Istanbul, Asia/Dubai.
- Extremes: Pacific/Kiritimati (UTC+14), Pacific/Honolulu (UTC-10).
- Boundary times: `00:00`, `23:59`, month-end, year-end.
- Endpoint regressions: events, recurrences, expenses, health filters.

## Implementation Status

This report is saved to drive implementation in the next steps.

### Current Status Checklist

- [x] Phase 1 quick wins implemented.
- [x] Phase 2 boundary hardening implemented (mobile serializer + backend inclusive endDate parser).
- [~] Phase 3 strict contract rollout in progress:
  - [x] Warning telemetry path added for timezone-less datetime parse.
  - [x] Strict reject gate added via `REJECT_TIMEZONE_LESS_DATETIME`.
  - [x] Backend request schemas hardened for datetime fields (timezone offset or `Z` required).
  - [x] API type contracts aligned for wire datetime strings in `src/types/api.ts`.
  - [x] Persisted timezone validation added in Mongoose models.
  - [ ] Default production switch to strict reject (`REJECT_TIMEZONE_LESS_DATETIME=true`) pending rollout decision.
  - [x] Timezone matrix integration tests added for event/expense/health/recurrence route contracts.

## Progress Log

Implemented in this iteration:
- Mobile recurrence exception serialization standardized to ISO UTC.
- Health date rendering moved to timezone-aware formatting in:
  - `app/(tabs)/care.tsx`
  - `app/health/[id].tsx`
  - `components/HealthOverview.tsx`
- Legacy `DateTimePicker` locale hardcoding removed; now follows app language.
- Subscription expiry date rendering moved to timezone-aware formatting in:
  - `components/subscription/SubscriptionCard.tsx`
- Mobile serializer hardened in `lib/utils/dateConversion.ts`:
  - date-only -> UTC midnight ISO
  - timezone-less datetime -> rejected
  - timezone-aware datetime -> canonical ISO
- Expense service date serialization now uses shared strict normalization.
- Event calendar cache invalidation now matches timezone-scoped keys.
- Feeding next-time logic in `lib/utils/activityUtils.ts` switched to DST-aware utility.
- Backend date-only `endDate` filters made inclusive via `parseUTCRangeEndDate` in:
  - `src/services/eventService.ts`
  - `src/services/expenseService.ts`
  - `src/services/healthRecordService.ts`
- Backend local-time mutations replaced with UTC-safe variants in:
  - `src/config/subscriptionConfig.ts`
  - `src/services/exchangeRateService.ts`
- Backend strict-mode groundwork for timezone-less datetime:
  - `src/lib/dateUtils.ts` now logs warning when coercing naive datetime to UTC.
  - If `REJECT_TIMEZONE_LESS_DATETIME=true`, timezone-less datetime is rejected.
  - `.env.example` updated with `REJECT_TIMEZONE_LESS_DATETIME`.

Added tests:
- Mobile: `__tests__/unit/utils/dateConversion.normalize.test.ts`
- Backend: extended `__tests__/unit/lib/dateUtils.test.ts` for range-end parsing.
- Backend: added tests for warning/coercion and strict rejection behavior in `parseUTCDate`.
- Backend: added route-level timezone contract matrix tests in `__tests__/unit/routes/datetimeContract.matrix.test.ts`.
- Backend: updated `__tests__/unit/controllers/expenseController.timezone.test.ts` for strict string-wire datetime flow.
