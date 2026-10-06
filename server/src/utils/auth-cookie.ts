import type { CookieOptions, Response } from 'express';
import ms from 'ms';
import { env } from '../config/env.js';

export const AUTH_COOKIE_NAME = 'token';

// Shared by set and clear: the browser only drops the cookie when path/sameSite/secure match.
const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.NODE_ENV === 'production',
  path: '/',
};

export function setAuthCookie(res: Response, token: string): void {
  // Same source as the JWT `expiresIn`, so the cookie and the token expire together.
  res.cookie(AUTH_COOKIE_NAME, token, { ...cookieOptions, maxAge: ms(env.JWT_EXPIRES_IN) });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, cookieOptions);
}
