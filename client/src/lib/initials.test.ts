import { describe, expect, it } from 'vitest';
import { getInitials } from './initials';

describe('getInitials', () => {
  it('takes the first letters of the first two words', () => {
    expect(getInitials('Gallery Admin')).toBe('GA');
  });

  it('ignores words after the second', () => {
    expect(getInitials('Maria del Carmen Gonzalez')).toBe('MD');
  });

  it('returns one letter for a single word', () => {
    expect(getInitials('Cher')).toBe('C');
  });

  it('upper-cases the result', () => {
    expect(getInitials('alex johnson')).toBe('AJ');
  });

  it('ignores extra whitespace', () => {
    expect(getInitials('  Liam \t  Smith  ')).toBe('LS');
  });

  it('keeps characters outside the BMP whole', () => {
    expect(getInitials('𝒜da Lovelace')).toBe('𝒜L');
  });

  it('returns an empty string for a blank name', () => {
    expect(getInitials('   ')).toBe('');
  });
});
