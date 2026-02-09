import { describe, expect, it } from 'vitest';
import { eventKeys } from '@/lib/hooks/queryKeys';

describe('eventKeys timezone scoping', () => {
  it('normalizes invalid timezone to undefined in scoped keys', () => {
    expect(eventKeys.todayScoped('Invalid/Timezone')).toEqual(
      eventKeys.todayScoped(undefined)
    );

    expect(eventKeys.upcomingScoped('')).toEqual(eventKeys.upcomingScoped(undefined));

    expect(eventKeys.calendarScoped('2026-02-04', '  ')).toEqual(
      eventKeys.calendarScoped('2026-02-04', undefined)
    );
  });
});
