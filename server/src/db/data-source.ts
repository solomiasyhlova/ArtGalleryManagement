import { DataSource } from 'typeorm';
import { env } from '../config/env.js';
import { Artwork } from '../entities/Artwork.js';
import { User } from '../entities/User.js';

// Globs need forward slashes; `import.meta.dirname` uses backslashes on Windows.
const migrationsDir = `${import.meta.dirname.replaceAll('\\', '/')}/migrations`;

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: env.DATABASE_URL,
  // `pg` waits forever by default; an unresponsive host would hang startup and /health.
  connectTimeoutMS: 5000,
  synchronize: false,
  // Use Postgres 13+'s built-in gen_random_uuid() (TypeORM picks it for 'pgcrypto'), and never let
  // TypeORM run CREATE EXTENSION on connect: schema changes go through migrations only.
  uuidExtension: 'pgcrypto',
  installExtensions: false,
  migrationsRun: false,
  logging: env.NODE_ENV === 'development',
  entities: [User, Artwork],
  migrations: [`${migrationsDir}/*.{ts,js}`],
});
