import { describe, expect, it } from 'vitest';
import { ApiError } from './api';
import { shouldRetry } from './query-client';

describe('shouldRetry', () => {
  it('retries a failed query once', () => {
    const error = new ApiError(500, 'INTERNAL_ERROR', 'Boom');

    expect(shouldRetry(0, error)).toBe(true);
    expect(shouldRetry(1, error)).toBe(false);
  });

  it('retries network failures and non-API errors once', () => {
    expect(shouldRetry(0, new ApiError(0, 'NETWORK_ERROR', 'Offline'))).toBe(true);
    expect(shouldRetry(0, new Error('Unexpected'))).toBe(true);
  });

  it.each([401, 403, 404])('never retries a %i', (status) => {
    expect(shouldRetry(0, new ApiError(status, 'ANY', 'No'))).toBe(false);
  });
});
