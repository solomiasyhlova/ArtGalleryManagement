import { ERROR_CODES } from '@art-gallery/shared';
import type { RequestHandler } from 'express';
import { getUserById } from '../services/auth.service.js';
import { AUTH_COOKIE_NAME } from '../utils/auth-cookie.js';
import { HttpError } from '../utils/http-error.js';
import { verifyToken } from '../utils/jwt.js';

/**
 * Verifies the session cookie and loads the user into `res.locals.user`. A missing or invalid
 * token, or a user that no longer exists, is a 401. The role comes from the database, not the
 * token, so role changes apply immediately.
 */
export const requireAuth: RequestHandler = async (req, res, next) => {
  const token: unknown = req.cookies?.[AUTH_COOKIE_NAME];
  const payload = typeof token === 'string' ? verifyToken(token) : null;
  const user = payload && (await getUserById(payload.sub));

  if (!user) {
    next(new HttpError(401, ERROR_CODES.UNAUTHENTICATED, 'Authentication required'));
    return;
  }

  res.locals.user = user;
  next();
};
