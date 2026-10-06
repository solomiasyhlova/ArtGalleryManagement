import { describe, expect, it } from 'vitest';
import { formatPrice } from './format';

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
