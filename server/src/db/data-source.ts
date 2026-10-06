import { DataSource } from 'typeorm';
import { env } from '../config/env.js';

// Globs need forward slashes; `import.meta.dirname` uses backslashes on Windows.
const migrationsDir = `${import.meta.dirname.replaceAll('\\', '/')}/migrations`;

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: env.DATABASE_URL,
  // `pg` waits forever by default; an unresponsive host would hang startup and /health.
  connectTimeoutMS: 5000,
  synchronize: false,
  migrationsRun: false,
  logging: env.NODE_ENV === 'development',
  entities: [],
  migrations: [`${migrationsDir}/*.{ts,js}`],
});
