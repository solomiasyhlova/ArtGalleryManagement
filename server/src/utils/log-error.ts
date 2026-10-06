import { env } from '../config/env.js';

/**
 * Error fields that never hold user data. Everything else is dropped: TypeORM's
 * `QueryFailedError` keeps the bound `parameters` and copies every Postgres error field onto
 * itself, including `detail` (`Key (email)=(…) already exists`, `Failing row contains (…)`).
 * `query` is the parameterized SQL text, with `$1`-style placeholders instead of values.
 */
const SAFE_FIELDS = ['code', 'constraint', 'table', 'column', 'query'] as const;

export type LoggedError = Record<string, string>;

/** Reduces any thrown value to an allowlist of fields that are safe to write to the logs. */
export function toLoggedError(err: unknown): LoggedError {
  if (!(err instanceof Error)) {
    return {
      name: 'NonError',
      message: typeof err === 'string' ? err : `Non-Error thrown (${typeof err})`,
    };
  }

  const logged: LoggedError = { name: err.name, message: err.message };
  const fields = err as unknown as Record<string, unknown>;
  for (const field of SAFE_FIELDS) {
    const value = fields[field];
    if (typeof value === 'string' && value !== '') logged[field] = value;
  }
  if (err.stack) logged.stack = err.stack;
  return logged;
}

/**
 * Logs a redacted error to stderr. In production it's one JSON line, so log collectors (Render's
 * log stream) keep the stack in a single entry instead of one entry per line.
 */
export function logError(
  message: string,
  err: unknown,
  context: Record<string, string> = {},
): void {
  const error = toLoggedError(err);

  if (env.NODE_ENV === 'production') {
    console.error(JSON.stringify({ level: 'error', message, ...context, error }));
    return;
  }

  const { stack, ...fields } = error;
  console.error(`${message}: ${stack ?? `${error.name}: ${error.message}`}`, {
    ...context,
    ...fields,
  });
}
