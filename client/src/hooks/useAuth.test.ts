import type { User } from '@art-gallery/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api';
import { fetchCurrentUser } from './useAuth';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return { ...actual, api: { ...actual.api, get } };
});

const USER: User = {
  id: '6f1c2c3e-8a4b-4c1d-9e2f-1a2b3c4d5e6f',
  name: 'Gallery Admin',
  email: 'admin@gallery.local',
  role: 'admin',
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
};

describe('fetchCurrentUser', () => {
  beforeEach(() => {
    get.mockReset();
  });

  it('returns the signed-in user from GET /auth/me', async () => {
    get.mockResolvedValue(USER);

    await expect(fetchCurrentUser()).resolves.toEqual(USER);
    expect(get).toHaveBeenCalledWith('/auth/me');
  });

  it('treats a 401 as signed out, not as an error', async () => {
    get.mockRejectedValue(new ApiError(401, 'UNAUTHENTICATED', 'Not signed in'));

    await expect(fetchCurrentUser()).resolves.toBeNull();
  });

  it.each([
    new ApiError(500, 'INTERNAL_ERROR', 'Boom'),
    new ApiError(0, 'NETWORK_ERROR', 'Unable to reach the server'),
    new ApiError(403, 'FORBIDDEN', 'Forbidden'),
  ])('rethrows other API errors ($status)', async (error) => {
    get.mockRejectedValue(error);

    await expect(fetchCurrentUser()).rejects.toBe(error);
  });
});
