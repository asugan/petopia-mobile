import { describe, expect, it } from 'vitest';
import {
  EVENT_REMINDER_PRESET_MINUTES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_SCREENS,
} from '@/constants/notificationContract';

describe('notification contract constants', () => {
  it('defines stable channel ids', () => {
    expect(NOTIFICATION_CHANNELS).toEqual({
      event: 'event-reminders',
      feeding: 'feeding-reminders',
      budget: 'budget-alerts',
    });
  });

  it('defines stable screen values', () => {
    expect(NOTIFICATION_SCREENS.event).toBe('event');
    expect(NOTIFICATION_SCREENS.feeding).toBe('feeding');
    expect(NOTIFICATION_SCREENS.budget).toBe('budget');
  });

  it('keeps event reminder presets aligned with contract', () => {
    expect(EVENT_REMINDER_PRESET_MINUTES.standard).toEqual([4320, 1440, 60, 0]);
    expect(EVENT_REMINDER_PRESET_MINUTES.compact).toEqual([1440, 60, 0]);
    expect(EVENT_REMINDER_PRESET_MINUTES.minimal).toEqual([60, 0]);
  });
});
