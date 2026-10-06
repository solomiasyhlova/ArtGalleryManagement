import type { User } from '@art-gallery/shared';
import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '../utils/http-error.js';
import { requireRole } from './require-role.js';

function createUser(role: User['role']): User {
  return {
    id: '0b8e4a4e-5c1d-4e0a-9a3b-1f2e3d4c5b6a',
    name: 'Someone',
    email: 'someone@gallery.local',
    role,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function createRes(user?: User) {
  return { locals: { user } } as Response;
}

describe('requireRole', () => {
  let next: NextFunction & ReturnType<typeof vi.fn>;
  const req = {} as Request;

  beforeEach(() => {
    next = vi.fn() as typeof next;
  });

  it('calls next() when the user has the role', () => {
    requireRole('admin')(req, createRes(createUser('admin')), next);

    expect(next).toHaveBeenCalledWith();
  });

  it('forwards a 403 FORBIDDEN when the role does not match', () => {
    requireRole('admin')(req, createRes(createUser('user')), next);

    const err = next.mock.calls[0]?.[0];
    expect(err).toBeInstanceOf(HttpError);
    expect(err).toMatchObject({ status: 403, code: 'FORBIDDEN' });
  });

  it('fails closed with a 401 when no user was loaded', () => {
    requireRole('admin')(req, createRes(), next);

    expect(next.mock.calls[0]?.[0]).toMatchObject({ status: 401, code: 'UNAUTHENTICATED' });
  });
});
