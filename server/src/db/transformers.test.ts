import { describe, expect, it } from 'vitest';
import { numericTransformer } from './transformers.js';

describe('numericTransformer', () => {
  describe('from (DB → JS)', () => {
    it('parses numeric strings into numbers', () => {
      expect(numericTransformer.from('4500.00')).toBe(4500);
      expect(numericTransformer.from('4500.50')).toBe(4500.5);
      expect(numericTransformer.from('0.01')).toBe(0.01);
    });

    it('passes null and undefined through', () => {
      expect(numericTransformer.from(null)).toBeNull();
      expect(numericTransformer.from(undefined)).toBeUndefined();
    });
  });

  describe('to (JS → DB)', () => {
    it('serializes numbers as strings', () => {
      expect(numericTransformer.to(4500.5)).toBe('4500.5');
      expect(numericTransformer.to(4500)).toBe('4500');
    });

    it('passes null and undefined through', () => {
      expect(numericTransformer.to(null)).toBeNull();
      expect(numericTransformer.to(undefined)).toBeUndefined();
    });
  });
});
