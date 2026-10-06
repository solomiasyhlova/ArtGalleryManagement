import { ERROR_CODES, type RegisterInput, type User as PublicUser } from '@art-gallery/shared';
import bcrypt from 'bcrypt';
import { QueryFailedError } from 'typeorm';
import { AppDataSource } from '../db/data-source.js';
import { User } from '../entities/User.js';
import { HttpError } from '../utils/http-error.js';

export const BCRYPT_ROUNDS = 12;

// A hash of a random value at BCRYPT_ROUNDS cost (a test keeps the two in sync). Unknown emails
// are compared against it, so both login failures take the same time and don't reveal which
// emails exist.
const DUMMY_HASH = '$2b$12$wzekJmMkboAJtS0lh7PN4OzaBIOhvMa7WSKs8msaOtzMil/D6Ia6q';

const users = () => AppDataSource.getRepository(User);

export type NewUser = Omit<RegisterInput, 'confirmPassword'>;

const PG_UNIQUE_VIOLATION = '23505';

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    (error.driverError as { code?: unknown }).code === PG_UNIQUE_VIOLATION
  );
}

function emailTaken(): HttpError {
  return new HttpError(409, ERROR_CODES.EMAIL_TAKEN, 'Email is already registered', {
    email: ['An account with this email already exists'],
  });
}

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

/** Always creates a `user`; admins only come from the seed. */
export async function register({ name, email, password }: NewUser): Promise<PublicUser> {
  const normalizedEmail = normalizeEmail(email);
  if (await users().existsBy({ email: normalizedEmail })) throw emailTaken();

  const passwordHash = await hashPassword(password);
  try {
    const user = await users().save(
      users().create({ name, email: normalizedEmail, passwordHash, role: 'user' }),
    );
    return toPublicUser(user);
  } catch (error) {
    // Two sign-ups with the same email can both pass the check above; the unique index decides.
    if (isUniqueViolation(error)) throw emailTaken();
    throw error;
  }
}

export async function getUserById(id: string): Promise<PublicUser | null> {
  const user = await users().findOneBy({ id });
  return user && toPublicUser(user);
}
