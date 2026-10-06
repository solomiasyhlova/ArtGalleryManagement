import { USER_ROLES, type UserRole } from '@art-gallery/shared';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';

export interface TokenPayload {
  sub: string;
  role: UserRole;
}

const payloadSchema = z.object({ sub: z.uuid(), role: z.enum(USER_ROLES) });

export function signToken({ sub, role }: TokenPayload): string {
  return jwt.sign({ role }, env.JWT_SECRET, {
    algorithm: 'HS256',
    subject: sub,
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

/**
 * Returns the payload of a valid, unexpired HS256 token, or `null` for anything else
 * (bad signature, expired, other algorithm, unexpected payload shape).
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    // Pin the algorithm so a token can't choose its own (e.g. `none`).
    const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    const result = payloadSchema.safeParse(decoded);
    return result.success ? result.data : null;
  } catch (error) {
    // TokenExpiredError and NotBeforeError extend JsonWebTokenError.
    if (error instanceof jwt.JsonWebTokenError) return null;
    throw error;
  }
}
