import type bcrypt from 'bcrypt';
import { QueryFailedError } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '../entities/User.js';
import { HttpError } from '../utils/http-error.js';
import { BCRYPT_ROUNDS, getUserById, login, register, toPublicUser } from './auth.service.js';

const { queryBuilder, repository, compare, hash } = vi.hoisted(() => {
  const queryBuilder = {
    addSelect: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    getOne: vi.fn(),
  };
  return {
    queryBuilder,
    repository: {
      createQueryBuilder: vi.fn(() => queryBuilder),
      findOneBy: vi.fn(),
      existsBy: vi.fn(),
      create: vi.fn((fields: object) => ({ ...fields })),
      save: vi.fn(),
    },
    compare: vi.fn(),
    hash: vi.fn(),
  };
});

vi.mock('../db/data-source.js', () => ({
  AppDataSource: { getRepository: () => repository },
}));

vi.mock('bcrypt', () => ({ default: { compare, hash } }));

function createUser(overrides: Partial<User> = {}): User {
  return Object.assign(
    {
      id: '0b8e4a4e-5c1d-4e0a-9a3b-1f2e3d4c5b6a',
      name: 'Gallery Admin',
      email: 'admin@gallery.local',
      passwordHash: '$2b$12$realhash',
      role: 'admin',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    },
    overrides,
  ) as User;
}

describe('auth.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('returns the public user when the password matches', async () => {
      queryBuilder.getOne.mockResolvedValue(createUser());
      compare.mockResolvedValue(true);

      const user = await login('admin@gallery.local', 'correct-password');

      expect(compare).toHaveBeenCalledWith('correct-password', '$2b$12$realhash');
      expect(user).toEqual({
        id: '0b8e4a4e-5c1d-4e0a-9a3b-1f2e3d4c5b6a',
        name: 'Gallery Admin',
        email: 'admin@gallery.local',
        role: 'admin',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      });
      expect(user).not.toHaveProperty('passwordHash');
    });

    it('selects the hidden password hash and looks up the normalized email', async () => {
      queryBuilder.getOne.mockResolvedValue(createUser());
      compare.mockResolvedValue(true);

      await login('  Admin@Gallery.LOCAL ', 'correct-password');

      expect(queryBuilder.addSelect).toHaveBeenCalledWith('user.passwordHash');
      expect(queryBuilder.where).toHaveBeenCalledWith('user.email = :email', {
        email: 'admin@gallery.local',
      });
    });

    it('rejects a wrong password with a generic 401', async () => {
      queryBuilder.getOne.mockResolvedValue(createUser());
      compare.mockResolvedValue(false);

      const error = await login('admin@gallery.local', 'wrong').catch((e: unknown) => e);

      expect(error).toBeInstanceOf(HttpError);
      expect(error).toMatchObject({
        status: 401,
        code: 'UNAUTHENTICATED',
        message: 'Invalid email or password',
      });
    });

    it('rejects an unknown email with the same 401, after comparing against a dummy hash', async () => {
      queryBuilder.getOne.mockResolvedValue(null);
      compare.mockResolvedValue(false);

      const error = await login('nobody@gallery.local', 'whatever').catch((e: unknown) => e);

      expect(error).toMatchObject({
        status: 401,
        code: 'UNAUTHENTICATED',
        message: 'Invalid email or password',
      });
      expect(compare).toHaveBeenCalledTimes(1);
    });

    it('uses a dummy hash with the same cost as real hashes', async () => {
      queryBuilder.getOne.mockResolvedValue(null);
      compare.mockResolvedValue(false);
      const { default: realBcrypt } = await vi.importActual<{ default: typeof bcrypt }>('bcrypt');

      await login('nobody@gallery.local', 'whatever').catch(() => undefined);

      const dummyHash = compare.mock.calls[0]?.[1] as string;
      expect(realBcrypt.getRounds(dummyHash)).toBe(BCRYPT_ROUNDS);
    });

    it('never succeeds for an unknown email, even if the dummy hash matched', async () => {
      queryBuilder.getOne.mockResolvedValue(null);
      compare.mockResolvedValue(true);

      await expect(login('nobody@gallery.local', 'whatever')).rejects.toMatchObject({
        status: 401,
      });
    });
  });

  describe('register', () => {
    const input = { name: 'Test User', email: 'Test@Example.com', password: 'password123' };

    function uniqueViolation(): QueryFailedError {
      return new QueryFailedError(
        'INSERT INTO "users" ...',
        [],
        Object.assign(new Error('duplicate key'), { code: '23505' }),
      );
    }

    beforeEach(() => {
      repository.existsBy.mockResolvedValue(false);
      hash.mockResolvedValue('$2b$12$newhash');
      repository.save.mockImplementation((fields: Partial<User>) =>
        Promise.resolve(createUser({ ...fields })),
      );
    });

    it('hashes the password, forces the user role and returns the public user', async () => {
      const user = await register(input);

      expect(hash).toHaveBeenCalledWith('password123', BCRYPT_ROUNDS);
      expect(repository.save).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: '$2b$12$newhash',
        role: 'user',
      });
      expect(user).toMatchObject({ name: 'Test User', email: 'test@example.com', role: 'user' });
      expect(user).not.toHaveProperty('passwordHash');
    });

    it('ignores a role smuggled into the input', async () => {
      await register({ ...input, role: 'admin' } as typeof input);

      expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ role: 'user' }));
    });

    it('checks for an existing account by the normalized email', async () => {
      await register(input);

      expect(repository.existsBy).toHaveBeenCalledWith({ email: 'test@example.com' });
    });

    it('rejects a taken email with 409 before hashing or inserting', async () => {
      repository.existsBy.mockResolvedValue(true);

      const error = await register(input).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(HttpError);
      expect(error).toMatchObject({
        status: 409,
        code: 'EMAIL_TAKEN',
        details: { email: ['An account with this email already exists'] },
      });
      expect(hash).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('maps a unique violation from a concurrent insert to the same 409', async () => {
      repository.save.mockRejectedValue(uniqueViolation());

      await expect(register(input)).rejects.toMatchObject({
        status: 409,
        code: 'EMAIL_TAKEN',
        details: { email: ['An account with this email already exists'] },
      });
    });

    it('rethrows other database errors', async () => {
      const failure = new QueryFailedError(
        'INSERT INTO "users" ...',
        [],
        Object.assign(new Error('check violation'), { code: '23514' }),
      );
      repository.save.mockRejectedValue(failure);

      await expect(register(input)).rejects.toBe(failure);
    });
  });

  describe('getUserById', () => {
    it('returns the public user', async () => {
      repository.findOneBy.mockResolvedValue(createUser());

      const user = await getUserById('0b8e4a4e-5c1d-4e0a-9a3b-1f2e3d4c5b6a');

      expect(repository.findOneBy).toHaveBeenCalledWith({
        id: '0b8e4a4e-5c1d-4e0a-9a3b-1f2e3d4c5b6a',
      });
      expect(user).toMatchObject({ email: 'admin@gallery.local', role: 'admin' });
    });

    it('returns null when the user does not exist', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(getUserById('0b8e4a4e-5c1d-4e0a-9a3b-1f2e3d4c5b6a')).resolves.toBeNull();
    });
  });

  describe('toPublicUser', () => {
    it('drops the password hash and serializes dates', () => {
      expect(toPublicUser(createUser())).toEqual({
        id: '0b8e4a4e-5c1d-4e0a-9a3b-1f2e3d4c5b6a',
        name: 'Gallery Admin',
        email: 'admin@gallery.local',
        role: 'admin',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      });
    });
  });
});
