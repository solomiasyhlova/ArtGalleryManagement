import type { Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { clearAuthCookie, setAuthCookie } from './auth-cookie.js';

vi.mock('../config/env.js', () => ({ env: { NODE_ENV: 'development', JWT_EXPIRES_IN: '1d' } }));

function createRes() {
  return { cookie: vi.fn(), clearCookie: vi.fn() };
}

describe('auth cookie', () => {
  it('sets an httpOnly, lax token cookie that lives as long as the JWT', () => {
    const res = createRes();

    setAuthCookie(res as unknown as Response, 'signed.jwt');

    expect(res.cookie).toHaveBeenCalledWith('token', 'signed.jwt', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });
  });

  it('clears the cookie with the same path, sameSite and secure options', () => {
    const res = createRes();

    setAuthCookie(res as unknown as Response, 'signed.jwt');
    clearAuthCookie(res as unknown as Response);

    const setOptions = res.cookie.mock.calls[0]?.[2] as Record<string, unknown>;
    const [name, clearOptions] = res.clearCookie.mock.calls[0] as [string, Record<string, unknown>];
    expect(name).toBe('token');
    expect({ ...clearOptions, maxAge: setOptions.maxAge }).toEqual(setOptions);
  });
});
