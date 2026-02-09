# Monetization Funnel Dashboard (PostHog)

This document defines the exact funnels, charts, and breakdowns to track subscription conversion.

## Event Catalog

Use these events as implemented in `lib/posthog/subscriptionEvents.ts`:

- `paywall_view`
- `paywall_close`
- `trial_start_click`
- `trial_started`
- `trial_failed`
- `purchase_started`
- `purchase_success`
- `purchase_failed`
- `restore_click`
- `restore_success`
- `restore_failed`

Common properties (already sent by hooks/screens):

- `screen`
- `source`
- `is_pro`
- `is_trial_active`
- `can_start_trial`
- `provider`
- `tier`
- Optional: `reason`, `trigger`, `result`, `error_message`

## Dashboard: Core Widgets

Create one dashboard named `Monetization - Subscription Funnel` with these cards.

### 1) Main Conversion Funnel

Type: Funnel

Steps:

1. `paywall_view`
2. `purchase_started`
3. `purchase_success`

Settings:

- Conversion window: 7 days
- Breakdown: `source`
- Secondary breakdown: `screen`

Goal: Identify which entry point has the highest view->paid conversion.

### 2) Trial Funnel

Type: Funnel

Steps:

1. `paywall_view`
2. `trial_start_click`
3. `trial_started`

Settings:

- Conversion window: 7 days
- Filter: `can_start_trial = true`
- Breakdown: `source`

Goal: Measure trial intent and trial start completion.

### 3) Trial to Paid Funnel

Type: Funnel

Steps:

1. `trial_started`
2. `purchase_started`
3. `purchase_success`

Settings:

- Conversion window: 30 days
- Breakdown: `source` (from trial event)

Goal: Validate monetization quality after trial starts.

### 4) Drop-off Reasons

Type: Trends (stacked bar)

Events:

- `paywall_close`
- `purchase_failed`
- `trial_failed`
- `restore_failed`

Breakdown:

- `reason`
- `error_message` (table view)

Goal: Find preventable friction (pricing confusion, technical errors, close behavior).

### 5) Entry Source Performance

Type: Trends (table)

Events:

- `paywall_view`
- `purchase_success`

Breakdown: `source`
Formula (or external calc): `purchase_success / paywall_view`

Goal: Rank sources by conversion efficiency.

### 6) Restore Health

Type: Funnel

Steps:

1. `restore_click`
2. `restore_success`

Breakdown: `screen`

Goal: Ensure restoring works and support load stays low.

## Recommended Source Groups

Normalize `source` in analysis by grouping:

- Home: `home_*`
- Pets: `pets_*`
- Care: `care_*`, `feeding_modal_*`
- Finance: `finance_*`
- Gate/Prompts: `feature_gate_modal`, `upgrade_prompt_*`, `subscription_card*`
- Retention/Risk: `downgrade_screen`
- System: `api_pro_required`
- Direct: `direct`

## Weekly Review Cadence

Run this review once per week:

1. Check `paywall_view -> purchase_success` by `source`
2. Compare trial funnel vs previous week
3. Inspect top 3 `purchase_failed` reasons
4. Identify one source to optimize copy/UX next week

## KPI Targets (Initial)

- `paywall_view -> trial_started`: +20% vs baseline
- `paywall_view -> purchase_success`: +10% vs baseline
- `restore_click -> restore_success`: >= 80%
- `purchase_failed` rate: down week over week

## Notes for Experiments

For copy or UX tests, add one property to `paywall_view` and `purchase_success`:

- `paywall_variant`: e.g. `control`, `value_copy_v1`

This enables direct variant comparison without changing dashboard structure.
