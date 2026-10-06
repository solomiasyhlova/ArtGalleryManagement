/**
 * Escapes `\`, `%` and `_` so user input matches literally inside a `LIKE` / `ILIKE` pattern.
 * Postgres uses `\` as the default escape character, so no `ESCAPE` clause is needed.
 */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}
