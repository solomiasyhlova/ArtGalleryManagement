import type { User } from '@art-gallery/shared';
import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '../utils/http-error.js';
import { requireAuth } from './require-auth.js';

const { verifyToken, getUserById } = vi.hoisted(() => ({
  verifyToken: vi.fn(),
  getUserById: vi.fn(),
}));

vi.mock('../config/env.js', () => ({ env: { NODE_ENV: 'test', JWT_EXPIRES_IN: '1d' } }));
vi.mock('../utils/jwt.js', () => ({ verifyToken }));
vi.mock('../services/auth.service.js', () => ({ getUserById }));

const USER_ID = '0b8e4a4e-5c1d-4e0a-9a3b-1f2e3d4c5b6a';

const user: User = {
  id: USER_ID,
  name: 'Gallery Admin',
  email: 'admin@gallery.local',
  role: 'admin',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function createReq(cookies?: Record<string, unknown>) {
  return { cookies } as Request;
}

function createRes() {
  return { locals: {} } as Response;
}

describe('requireAuth', () => {
  let next: NextFunction & ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn() as typeof next;
  });

  function expectUnauthenticated(res: Response) {
    const err = next.mock.calls[0]?.[0];
    expect(err).toBeInstanceOf(HttpError);
    expect(err).toMatchObject({ status: 401, code: 'UNAUTHENTICATED' });
    expect(res.locals.user).toBeUndefined();
  }

  it('loads the user into res.locals.user for a valid token', async () => {
    verifyToken.mockReturnValue({ sub: USER_ID, role: 'admin' });
    getUserById.mockResolvedValue(user);
    const res = createRes();

    await requireAuth(createReq({ token: 'valid.jwt' }), res, next);

    expect(verifyToken).toHaveBeenCalledWith('valid.jwt');
    expect(getUserById).toHaveBeenCalledWith(USER_ID);
    expect(res.locals.user).toEqual(user);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects a request without the cookie', async () => {
    const res = createRes();

    await requireAuth(createReq({}), res, next);

    expectUnauthenticated(res);
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it('rejects a request when cookie-parser produced no cookies object', async () => {
    const res = createRes();

    await requireAuth(createReq(undefined), res, next);

    expectUnauthenticated(res);
  });

  it('rejects a non-string token', async () => {
    const res = createRes();

    await requireAuth(createReq({ token: { forged: true } }), res, next);

    expectUnauthenticated(res);
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it('rejects an invalid or expired token without hitting the database', async () => {
    verifyToken.mockReturnValue(null);
    const res = createRes();

    await requireAuth(createReq({ token: 'bad.jwt' }), res, next);

    expectUnauthenticated(res);
    expect(getUserById).not.toHaveBeenCalled();
  });

  it('rejects a valid token for a user that no longer exists', async () => {
    verifyToken.mockReturnValue({ sub: USER_ID, role: 'admin' });
    getUserById.mockResolvedValue(null);
    const res = createRes();

    await requireAuth(createReq({ token: 'valid.jwt' }), res, next);

    expectUnauthenticated(res);
  });

  it('uses the role from the database, not the token', async () => {
    verifyToken.mockReturnValue({ sub: USER_ID, role: 'admin' });
    getUserById.mockResolvedValue({ ...user, role: 'user' });
    const res = createRes();

    await requireAuth(createReq({ token: 'valid.jwt' }), res, next);

    expect(res.locals.user?.role).toBe('user');
  });
});
