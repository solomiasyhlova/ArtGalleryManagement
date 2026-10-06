import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from './api';

const GENERIC_MESSAGE = 'Something went wrong. Please try again.';

/** A message that is safe to show: network failures and 4xx keep theirs, 5xx and bugs don't. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status < 500) return error.message;
  return GENERIC_MESSAGE;
}

/**
 * Puts the API's per-field `details` under the matching form fields. Anything that can't be
 * shown on a field becomes a form-level `root` error.
 */
export function applyApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
): void {
  let fieldErrorSet = false;
  if (error instanceof ApiError && error.details) {
    for (const [field, messages] of Object.entries(error.details)) {
      const message = messages[0];
      if (!message || !fields.includes(field as Path<T>)) continue;
      setError(field as Path<T>, { type: 'server', message }, { shouldFocus: !fieldErrorSet });
      fieldErrorSet = true;
    }
  }
  if (!fieldErrorSet) setError('root', { type: 'server', message: getErrorMessage(error) });
}
