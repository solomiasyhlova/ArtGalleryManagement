import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from './api';

const GENERIC_MESSAGE = 'Something went wrong. Please try again.';

/** A message that is safe to show: network failures and 4xx keep theirs, 5xx and bugs don't. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status < 500) return error.message;
  return GENERIC_MESSAGE;
}

/** An API error with per-field `details`, e.g. a 400 `VALIDATION_ERROR` or a 409 `EMAIL_TAKEN`. */
export function hasFieldDetails(error: unknown): error is ApiError {
  return error instanceof ApiError && !!error.details && Object.keys(error.details).length > 0;
}

/**
 * Puts the API's per-field `details` under the matching form fields and focuses the first one.
 * Returns whether any field error was set.
 */
export function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
): boolean {
  let fieldErrorSet = false;
  if (hasFieldDetails(error)) {
    for (const [field, messages] of Object.entries(error.details ?? {})) {
      const message = messages[0];
      if (!message || !fields.includes(field as Path<T>)) continue;
      setError(field as Path<T>, { type: 'server', message }, { shouldFocus: !fieldErrorSet });
      fieldErrorSet = true;
    }
  }
  return fieldErrorSet;
}

/**
 * Like `applyFieldErrors`, but anything that can't be shown on a field becomes a form-level
 * `root` error.
 */
export function applyApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
): void {
  if (!applyFieldErrors(error, setError, fields)) {
    setError('root', { type: 'server', message: getErrorMessage(error) });
  }
}
