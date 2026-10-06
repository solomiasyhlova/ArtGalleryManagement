import { ERROR_CODES, type User as PublicUser } from '@art-gallery/shared';
import bcrypt from 'bcrypt';
import { AppDataSource } from '../db/data-source.js';
import { User } from '../entities/User.js';
import { HttpError } from '../utils/http-error.js';

export const BCRYPT_ROUNDS = 12;

// A hash of a random value at BCRYPT_ROUNDS cost (a test keeps the two in sync). Unknown emails
// are compared against it, so both login failures take the same time and don't reveal which
// emails exist.
const DUMMY_HASH = '$2b$12$wzekJmMkboAJtS0lh7PN4OzaBIOhvMa7WSKs8msaOtzMil/D6Ia6q';

const users = () => AppDataSource.getRepository(User);

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/** Copies only public fields, so the password hash can't leak even when it was selected. */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function login(email: string, password: string): Promise<PublicUser> {
  const user = await users()
    .createQueryBuilder('user')
    .addSelect('user.passwordHash')
    .where('user.email = :email', { email: normalizeEmail(email) })
    .getOne();

  const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !passwordMatches) {
    throw new HttpError(401, ERROR_CODES.UNAUTHENTICATED, 'Invalid email or password');
  }
  return toPublicUser(user);
}

export async function getUserById(id: string): Promise<PublicUser | null> {
  const user = await users().findOneBy({ id });
  return user && toPublicUser(user);
}
