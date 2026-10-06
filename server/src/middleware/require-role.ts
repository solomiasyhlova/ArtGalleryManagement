import { ERROR_CODES, type UserRole } from '@art-gallery/shared';
import type { RequestHandler } from 'express';
import { HttpError } from '../utils/http-error.js';

/** Must run after `requireAuth`. Fails closed with a 401 if no user was loaded. */
export function requireRole(role: UserRole): RequestHandler {
  return (_req, res, next) => {
    const { user } = res.locals;

    if (!user) {
      next(new HttpError(401, ERROR_CODES.UNAUTHENTICATED, 'Authentication required'));
      return;
    }
    if (user.role !== role) {
      next(new HttpError(403, ERROR_CODES.FORBIDDEN, 'You do not have permission to do this'));
      return;
    }
    next();
  };
}
