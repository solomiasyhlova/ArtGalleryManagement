import 'reflect-metadata';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { AppDataSource } from './db/data-source.js';

try {
  await AppDataSource.initialize();
} catch (error) {
  // Connection-refused errors are an AggregateError with an empty message, and Postgres can send
  // localized messages that arrive garbled, so always include the error code (e.g. 28P01, ECONNREFUSED).
  const code = error instanceof Error && 'code' in error ? String(error.code) : undefined;
  const message = error instanceof Error ? error.message : String(error);
  const reason = [code, message].filter(Boolean).join(': ');
  console.error('Failed to connect to the database (check DATABASE_URL in server/.env):', reason);
  process.exit(1);
}
console.info('Database connected');

createApp().listen(env.PORT, (error) => {
  if (error) {
    console.error(`Failed to start server on port ${env.PORT}:`, error.message);
    process.exit(1);
  }
  console.info(`Server listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});
