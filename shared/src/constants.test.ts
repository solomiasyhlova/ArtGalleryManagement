import { describe, expect, it } from 'vitest';
import { ARTWORK_TYPES, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, USER_ROLES } from './index.js';

describe('constants', () => {
  it('lists the predefined artwork types', () => {
    expect(ARTWORK_TYPES).toEqual([
      'painting',
      'sculpture',
      'photography',
      'drawing',
      'print',
      'digital',
    ]);
  });

  it('lists the user roles', () => {
    expect(USER_ROLES).toEqual(['user', 'admin']);
  });

  it('defines sane pagination limits', () => {
    expect(DEFAULT_PAGE_SIZE).toBe(12);
    expect(MAX_PAGE_SIZE).toBe(50);
    expect(DEFAULT_PAGE_SIZE).toBeLessThanOrEqual(MAX_PAGE_SIZE);
  });
});
