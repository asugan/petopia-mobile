import { describe, expect, it } from 'vitest';
import { normalizeToISOString } from '@/lib/utils/dateConversion';

describe('normalizeToISOString', () => {
  it('normalizes date-only values to UTC midnight ISO', () => {
    const normalized = normalizeToISOString('2026-02-09');
    expect(normalized).toBe('2026-02-09T00:00:00.000Z');
  });

  it('rejects timezone-less datetime strings', () => {
    const normalized = normalizeToISOString('2026-02-09T10:30:00');
    expect(normalized).toBeUndefined();
  });

  it('accepts timezone-aware datetime strings and canonicalizes output', () => {
    const normalized = normalizeToISOString('2026-02-09T10:30:00+03:00');
    expect(normalized).toBe('2026-02-09T07:30:00.000Z');
  });
});
