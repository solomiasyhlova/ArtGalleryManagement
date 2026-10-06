import type { EntityManager } from 'typeorm';
import { env } from '../../config/env.js';
import { User } from '../../entities/User.js';
import { hashPassword, normalizeEmail } from '../../services/auth.service.js';

/** Creates the admin from the ADMIN_* env vars, unless a user with that email already exists. */
export async function seedAdmin(manager: EntityManager): Promise<void> {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NAME) {
    throw new Error('Set ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_NAME in server/.env');
  }

  const users = manager.getRepository(User);
  const email = normalizeEmail(ADMIN_EMAIL);

  if (await users.existsBy({ email })) {
    console.info(`  ${email} already exists, skipped`);
    return;
  }

  await users.insert({
    name: ADMIN_NAME,
    email,
    passwordHash: await hashPassword(ADMIN_PASSWORD),
    role: 'admin',
  });
  console.info(`  created admin ${email}`);
}
