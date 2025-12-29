import { describe, expect, it } from 'vitest';

import { parseCurrencyInput } from '@/lib/utils/currency';

describe('parseCurrencyInput', () => {
  it('parses US formatted numbers with thousand separators', () => {
    expect(parseCurrencyInput('1,234.56')).toBeCloseTo(1234.56);
    expect(parseCurrencyInput('$1,234.56')).toBeCloseTo(1234.56);
    expect(parseCurrencyInput('1,234,567.89')).toBeCloseTo(1234567.89);
  });

  it('parses EU formatted numbers with thousand separators', () => {
    expect(parseCurrencyInput('1.234,56')).toBeCloseTo(1234.56);
    expect(parseCurrencyInput('€1.234,56')).toBeCloseTo(1234.56);
    expect(parseCurrencyInput('1.234.567,89')).toBeCloseTo(1234567.89);
  });

  it('treats a single separator near the end as decimal', () => {
    expect(parseCurrencyInput('12,34')).toBeCloseTo(12.34);
    expect(parseCurrencyInput('12.3')).toBeCloseTo(12.3);
  });

  it('treats a single separator far from the end as thousands', () => {
    expect(parseCurrencyInput('1,234')).toBeCloseTo(1234);
    expect(parseCurrencyInput('1.234')).toBeCloseTo(1234);
  });

  it('returns undefined for empty or invalid input', () => {
    expect(parseCurrencyInput('')).toBeUndefined();
    expect(parseCurrencyInput('   ')).toBeUndefined();
    expect(parseCurrencyInput('abc')).toBeUndefined();
  });
});
