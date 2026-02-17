export const SUBSCRIPTION_EVENTS = {
  PAYWALL_VIEW: 'paywall_view',
  PAYWALL_CLOSE: 'paywall_close',
  PURCHASE_STARTED: 'purchase_started',
  PURCHASE_SUCCESS: 'purchase_success',
  PURCHASE_FAILED: 'purchase_failed',
  RESTORE_CLICK: 'restore_click',
  RESTORE_SUCCESS: 'restore_success',
  RESTORE_FAILED: 'restore_failed',
} as const;

export type SubscriptionEventName =
  (typeof SUBSCRIPTION_EVENTS)[keyof typeof SUBSCRIPTION_EVENTS];

export type SubscriptionEventProperties = Record<
  string,
  string | number | boolean | null | undefined
>;
