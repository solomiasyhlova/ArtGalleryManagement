import { describe, expect, it } from 'vitest';
import { safeRedirect } from './safe-redirect';

describe('safeRedirect', () => {
  it.each(['/', '/artworks/123', '/?type=painting&page=2', '/artworks/1#details'])(
    'keeps the internal path %s',
    (target) => {
      expect(safeRedirect(target)).toBe(target);
    },
  );

  it.each([null, undefined, ''])('falls back to / for %s', (target) => {
    expect(safeRedirect(target)).toBe('/');
  });

  it.each([
    'https://evil.com',
    'http://evil.com/path',
    'javascript:alert(1)',
    'artworks',
    '//evil.com',
    '///evil.com',
    '/\\evil.com',
    '/\t/evil.com',
    '/\n/evil.com',
  ])('rejects %j', (target) => {
    expect(safeRedirect(target)).toBe('/');
  });
});
