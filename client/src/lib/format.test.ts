import { describe, expect, it } from 'vitest';
import { formatDate, formatPrice } from './format';

describe('formatDate', () => {
  it('spells out the month', () => {
    // Midday UTC, so the date is the same in (almost) every time zone.
    expect(formatDate('2026-03-05T12:00:00.000Z')).toBe('March 5, 2026');
    expect(formatDate('2025-12-24T12:30:00Z')).toBe('December 24, 2025');
  });
});

describe('formatPrice', () => {
  it('drops the cents for whole amounts', () => {
    expect(formatPrice(5500)).toBe('$5,500');
    expect(formatPrice(11000)).toBe('$11,000');
  });

  it('keeps two decimals for fractional amounts', () => {
    expect(formatPrice(4500.5)).toBe('$4,500.50');
    expect(formatPrice(0.99)).toBe('$0.99');
  });

  it('rounds to two decimals', () => {
    expect(formatPrice(19.999)).toBe('$20');
    expect(formatPrice(12.346)).toBe('$12.35');
  });

  it('groups thousands', () => {
    expect(formatPrice(1234567.89)).toBe('$1,234,567.89');
  });
});
