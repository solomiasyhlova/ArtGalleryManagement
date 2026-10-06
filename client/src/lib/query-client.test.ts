import { MutationObserver } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { ApiError } from './api';
import { AUTH_ME_KEY, createQueryClient, shouldRetry } from './query-client';

const SIGNED_IN_USER = { id: '1', name: 'Gallery Admin' };

function signedInClient() {
  const client = createQueryClient();
  client.setQueryData(AUTH_ME_KEY, SIGNED_IN_USER);
  return client;
}

function failingQuery(error: Error) {
  return { queryKey: ['artworks'], queryFn: () => Promise.reject(error), retry: false };
}

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

describe('global 401 handling', () => {
  it('signs the user out when a query fails with 401', async () => {
    const client = signedInClient();

    await expect(
      client.fetchQuery(failingQuery(new ApiError(401, 'UNAUTHENTICATED', 'Not signed in'))),
    ).rejects.toThrow();

    expect(client.getQueryData(AUTH_ME_KEY)).toBeNull();
  });

  it('signs the user out when a mutation fails with 401', async () => {
    const client = signedInClient();
    const mutation = new MutationObserver(client, {
      mutationFn: () => Promise.reject(new ApiError(401, 'UNAUTHENTICATED', 'Not signed in')),
    });

    await expect(mutation.mutate()).rejects.toThrow();

    expect(client.getQueryData(AUTH_ME_KEY)).toBeNull();
  });

  it.each([
    new ApiError(403, 'FORBIDDEN', 'Admins only'),
    new ApiError(500, 'INTERNAL_ERROR', 'Boom'),
    new ApiError(0, 'NETWORK_ERROR', 'Offline'),
    new Error('Unexpected'),
  ])('keeps the user signed in on %s', async (error) => {
    const client = signedInClient();

    await expect(client.fetchQuery(failingQuery(error))).rejects.toThrow();

    expect(client.getQueryData(AUTH_ME_KEY)).toEqual(SIGNED_IN_USER);
  });
});
