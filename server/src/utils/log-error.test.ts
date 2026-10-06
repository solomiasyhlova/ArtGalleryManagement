import { QueryFailedError } from 'typeorm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logError, toLoggedError } from './log-error.js';

const mockEnv = vi.hoisted(() => ({ NODE_ENV: 'development' }));
vi.mock('../config/env.js', () => ({ env: mockEnv }));

const EMAIL = 'jane@example.com';
const HASH = '$2b$12$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234';

/** What `pg` and TypeORM produce when a sign-up INSERT violates a constraint. */
function failedInsert(): QueryFailedError {
  const driverError = Object.assign(
    new Error('new row for relation "users" violates check constraint'),
    {
      code: '23514',
      constraint: 'users_email_lowercase',
      table: 'users',
      detail: `Failing row contains (Jane, ${EMAIL}, ${HASH}).`,
      where: `values (${EMAIL})`,
    },
  );
  return new QueryFailedError(
    'INSERT INTO "users"("name", "email", "password_hash") VALUES ($1, $2, $3)',
    ['Jane', EMAIL, HASH],
    driverError,
  );
}

describe('toLoggedError', () => {
  it('keeps the Postgres code, constraint, table and parameterized SQL', () => {
    expect(toLoggedError(failedInsert())).toMatchObject({
      name: 'QueryFailedError',
      message: 'new row for relation "users" violates check constraint',
      code: '23514',
      constraint: 'users_email_lowercase',
      table: 'users',
      query: 'INSERT INTO "users"("name", "email", "password_hash") VALUES ($1, $2, $3)',
    });
  });

  it('drops bound parameters and row values', () => {
    const logged = toLoggedError(failedInsert());

    expect(Object.keys(logged)).not.toContain('parameters');
    expect(Object.keys(logged)).not.toContain('detail');
    expect(Object.keys(logged)).not.toContain('driverError');
    const text = JSON.stringify(logged);
    expect(text).not.toContain(EMAIL);
    expect(text).not.toContain(HASH);
  });

  it('keeps the stack and a string code of other errors', () => {
    const err = Object.assign(new Error('connect failed'), { code: 'ECONNREFUSED', port: 5432 });

    const logged = toLoggedError(err);

    expect(logged).toMatchObject({
      name: 'Error',
      message: 'connect failed',
      code: 'ECONNREFUSED',
    });
    expect(logged.stack).toContain('connect failed');
    expect(logged).not.toHaveProperty('port');
  });

  it('ignores non-string and empty safe fields', () => {
    const err = Object.assign(new Error('boom'), { code: 42, table: '' });

    expect(toLoggedError(err)).not.toHaveProperty('code');
    expect(toLoggedError(err)).not.toHaveProperty('table');
  });

  it('describes non-Error throwables without dumping objects', () => {
    expect(toLoggedError('boom')).toEqual({ name: 'NonError', message: 'boom' });
    expect(toLoggedError({ password: 'secret' })).toEqual({
      name: 'NonError',
      message: 'Non-Error thrown (object)',
    });
  });
});

describe('logError', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    mockEnv.NODE_ENV = 'development';
    vi.restoreAllMocks();
  });

  it('writes one JSON line with the context in production', () => {
    mockEnv.NODE_ENV = 'production';

    logError('Unhandled error', failedInsert(), { method: 'POST', path: '/auth/register' });

    expect(console.error).toHaveBeenCalledOnce();
    const [line] = vi.mocked(console.error).mock.calls[0]!;
    expect(typeof line).toBe('string');
    expect(line).not.toContain('\n');
    expect(JSON.parse(line as string)).toMatchObject({
      level: 'error',
      message: 'Unhandled error',
      method: 'POST',
      path: '/auth/register',
      error: { name: 'QueryFailedError', code: '23514' },
    });
    expect(line).not.toContain(EMAIL);
    expect(line).not.toContain(HASH);
  });

  it('prints the stack and the redacted fields outside production', () => {
    logError('Seed failed', failedInsert());

    const [heading, fields] = vi.mocked(console.error).mock.calls[0]!;
    expect(heading).toMatch(/^Seed failed: QueryFailedError: new row/);
    expect(fields).toMatchObject({ code: '23514', table: 'users' });
    expect(JSON.stringify([heading, fields])).not.toContain(HASH);
  });
});
