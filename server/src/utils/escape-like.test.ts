import { describe, expect, it } from 'vitest';
import { escapeLike } from './escape-like.js';

describe('escapeLike', () => {
  it.each([
    ['Liam Smith', 'Liam Smith'],
    ['', ''],
    ['%', '\\%'],
    ['_', '\\_'],
    ['\\', '\\\\'],
    ['50%_off\\', '50\\%\\_off\\\\'],
    ['%%__', '\\%\\%\\_\\_'],
  ])('escapes %j as %j', (value, escaped) => {
    expect(escapeLike(value)).toBe(escaped);
  });

  it('escapes the backslash first, so escapes are never doubled', () => {
    expect(escapeLike('\\%')).toBe('\\\\\\%');
  });
});
