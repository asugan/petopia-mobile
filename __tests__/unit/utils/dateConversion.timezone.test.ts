import { describe, expect, it } from 'vitest';
import { combineDateTimeToISOInTimeZone } from '@/lib/utils/dateConversion';
import { formatInTimeZone } from '@/lib/utils/date';

describe('combineDateTimeToISOInTimeZone', () => {
  it('converts Europe/Istanbul local datetime to UTC instant', () => {
    const iso = combineDateTimeToISOInTimeZone(
      '2026-02-04',
      '10:00',
      'Europe/Istanbul'
    );

    expect(iso).toBe('2026-02-04T07:00:00.000Z');
  });

  it('converts America/New_York local datetime to UTC instant', () => {
    const iso = combineDateTimeToISOInTimeZone(
      '2026-02-04',
      '10:00',
      'America/New_York'
    );

    expect(iso).toBe('2026-02-04T15:00:00.000Z');
  });

  it('falls back from invalid timezone to device/default resolution', () => {
    const iso = combineDateTimeToISOInTimeZone(
      '2026-02-04',
      '10:00',
      'Invalid/Timezone'
    );

    expect(iso).toMatch(/^2026-02-04T\d{2}:00:00.000Z$/);
  });

  it('supports create/edit roundtrip without time drift', () => {
    const originalInstant = '2026-02-03T21:30:00.000Z';
    const timezone = 'Europe/Istanbul';

    const datePart = formatInTimeZone(originalInstant, timezone, 'yyyy-MM-dd');
    const timePart = formatInTimeZone(originalInstant, timezone, 'HH:mm');
    const roundtripInstant = combineDateTimeToISOInTimeZone(
      datePart,
      timePart,
      timezone
    );

    expect(roundtripInstant).toBe(originalInstant);
  });
});
