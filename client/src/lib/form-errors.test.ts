import { describe, expect, it, vi } from 'vitest';
import type { UseFormSetError } from 'react-hook-form';
import { ApiError } from './api';
import { applyApiError, applyFieldErrors, getErrorMessage, hasFieldDetails } from './form-errors';

interface Form {
  name: string;
  email: string;
}

const FIELDS = ['name', 'email'] as const;

function setup() {
  const setError = vi.fn<UseFormSetError<Form>>();
  return { setError };
}

describe('getErrorMessage', () => {
  it('keeps the message of a 4xx and of a network failure', () => {
    expect(getErrorMessage(new ApiError(409, 'EMAIL_TAKEN', 'Email is already registered'))).toBe(
      'Email is already registered',
    );
    expect(getErrorMessage(new ApiError(0, 'NETWORK_ERROR', 'Unable to reach the server'))).toBe(
      'Unable to reach the server',
    );
  });

  it('hides 5xx and unexpected errors behind a generic message', () => {
    const generic = 'Something went wrong. Please try again.';
    expect(getErrorMessage(new ApiError(500, 'INTERNAL_ERROR', 'Internal server error'))).toBe(
      generic,
    );
    expect(getErrorMessage(new TypeError('x is undefined'))).toBe(generic);
  });
});

describe('hasFieldDetails', () => {
  it('is true only for an API error with at least one field', () => {
    const details = { price: ['Price must be greater than 0'] };
    expect(hasFieldDetails(new ApiError(400, 'VALIDATION_ERROR', 'Invalid', details))).toBe(true);
    expect(hasFieldDetails(new ApiError(400, 'VALIDATION_ERROR', 'Invalid', {}))).toBe(false);
    expect(hasFieldDetails(new ApiError(400, 'VALIDATION_ERROR', 'Malformed JSON'))).toBe(false);
    expect(hasFieldDetails(new ApiError(403, 'FORBIDDEN', 'Forbidden'))).toBe(false);
    expect(hasFieldDetails(new Error('boom'))).toBe(false);
  });
});

describe('applyFieldErrors', () => {
  it('sets the known fields and reports that it did', () => {
    const { setError } = setup();
    const error = new ApiError(400, 'VALIDATION_ERROR', 'Invalid request body', {
      name: ['Name is required'],
    });

    expect(applyFieldErrors<Form>(error, setError, FIELDS)).toBe(true);
    expect(setError).toHaveBeenCalledExactlyOnceWith(
      'name',
      { type: 'server', message: 'Name is required' },
      { shouldFocus: true },
    );
  });

  it('sets nothing, not even a root error, when no field matches', () => {
    const { setError } = setup();
    const unknownField = new ApiError(400, 'VALIDATION_ERROR', 'Invalid request body', {
      role: ['Not allowed'],
    });

    expect(applyFieldErrors<Form>(unknownField, setError, FIELDS)).toBe(false);
    expect(
      applyFieldErrors<Form>(new ApiError(500, 'INTERNAL_ERROR', 'Boom'), setError, FIELDS),
    ).toBe(false);
    expect(setError).not.toHaveBeenCalled();
  });
});

describe('applyApiError', () => {
  it('sets the first message of each known field and focuses only the first', () => {
    const { setError } = setup();
    const error = new ApiError(400, 'VALIDATION_ERROR', 'Invalid request body', {
      email: ['Enter a valid email address', 'Second message'],
      name: ['Name is required'],
    });

    applyApiError<Form>(error, setError, FIELDS);

    expect(setError).toHaveBeenCalledTimes(2);
    expect(setError).toHaveBeenNthCalledWith(
      1,
      'email',
      { type: 'server', message: 'Enter a valid email address' },
      { shouldFocus: true },
    );
    expect(setError).toHaveBeenNthCalledWith(
      2,
      'name',
      { type: 'server', message: 'Name is required' },
      { shouldFocus: false },
    );
  });

  it('maps a 409 with email details under the email field', () => {
    const { setError } = setup();
    const error = new ApiError(409, 'EMAIL_TAKEN', 'Email is already registered', {
      email: ['An account with this email already exists'],
    });

    applyApiError<Form>(error, setError, FIELDS);

    expect(setError).toHaveBeenCalledOnce();
    expect(setError).toHaveBeenCalledWith(
      'email',
      { type: 'server', message: 'An account with this email already exists' },
      { shouldFocus: true },
    );
  });

  it('ignores unknown fields and empty message lists', () => {
    const { setError } = setup();
    const error = new ApiError(400, 'VALIDATION_ERROR', 'Invalid request body', {
      role: ['Not allowed'],
      email: [],
    });

    applyApiError<Form>(error, setError, FIELDS);

    expect(setError).toHaveBeenCalledOnce();
    expect(setError).toHaveBeenCalledWith('root', {
      type: 'server',
      message: 'Invalid request body',
    });
  });

  it('sets a root error when there are no details', () => {
    const { setError } = setup();

    applyApiError<Form>(
      new ApiError(0, 'NETWORK_ERROR', 'Unable to reach the server'),
      setError,
      FIELDS,
    );

    expect(setError).toHaveBeenCalledWith('root', {
      type: 'server',
      message: 'Unable to reach the server',
    });
  });

  it('sets a generic root error for a 500', () => {
    const { setError } = setup();

    applyApiError<Form>(
      new ApiError(500, 'INTERNAL_ERROR', 'Internal server error'),
      setError,
      FIELDS,
    );

    expect(setError).toHaveBeenCalledWith('root', {
      type: 'server',
      message: 'Something went wrong. Please try again.',
    });
  });
});
