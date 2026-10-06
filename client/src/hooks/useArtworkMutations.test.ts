import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api';
import { isNotFound, mutationErrorMessage, refreshAfterError } from './useArtworkMutations';

const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

const ID = '6f1c2d3e-4a5b-4c6d-8e9f-0a1b2c3d4e5f';

/** A client holding the artwork's detail and two list pages, as after browsing the gallery. */
function cachedClient() {
  const client = new QueryClient();
  client.setQueryData(['artwork', ID], { id: ID, title: 'Tranquil Lake' });
  client.setQueryData(['artworks', { page: 1 }], { data: [] });
  client.setQueryData(['artworks', { page: 2, type: 'painting' }], { data: [] });
  return client;
}

const listsInvalidated = (client: QueryClient) =>
  client
    .getQueryCache()
    .findAll({ queryKey: ['artworks'] })
    .map((query) => query.state.isInvalidated);

beforeEach(() => {
  toast.error.mockClear();
});

describe('refreshAfterError', () => {
  it('on a 404, drops the artwork and invalidates every list', () => {
    const client = cachedClient();

    refreshAfterError(client, ID, new ApiError(404, 'NOT_FOUND', 'Artwork not found'));

    expect(toast.error).toHaveBeenCalledExactlyOnceWith('This artwork no longer exists');
    expect(client.getQueryData(['artwork', ID])).toBeUndefined();
    expect(listsInvalidated(client)).toEqual([true, true]);
  });

  it.each([
    [new ApiError(403, 'FORBIDDEN', 'Forbidden'), "You don't have permission"],
    [new ApiError(500, 'INTERNAL_ERROR', 'Boom'), 'Something went wrong. Please try again.'],
  ])('on %o, only reports it and leaves the cache alone', (error, message) => {
    const client = cachedClient();

    refreshAfterError(client, ID, error);

    expect(toast.error).toHaveBeenCalledExactlyOnceWith(message);
    expect(client.getQueryData(['artwork', ID])).toEqual({ id: ID, title: 'Tranquil Lake' });
    expect(listsInvalidated(client)).toEqual([false, false]);
  });

  it('shows nothing for a 401 (the global handler sends the user to log in)', () => {
    refreshAfterError(cachedClient(), ID, new ApiError(401, 'UNAUTHENTICATED', 'Not signed in'));

    expect(toast.error).not.toHaveBeenCalled();
  });
});

describe('mutationErrorMessage', () => {
  it('names a missing permission and a vanished artwork', () => {
    expect(mutationErrorMessage(new ApiError(403, 'FORBIDDEN', 'Forbidden'))).toBe(
      "You don't have permission",
    );
    expect(mutationErrorMessage(new ApiError(404, 'NOT_FOUND', 'Artwork not found'))).toBe(
      'This artwork no longer exists',
    );
  });

  it('stays quiet for a 401 (the user is sent to log in) and for field errors (shown in the form)', () => {
    expect(mutationErrorMessage(new ApiError(401, 'UNAUTHENTICATED', 'Not signed in'))).toBeNull();
    expect(
      mutationErrorMessage(
        new ApiError(400, 'VALIDATION_ERROR', 'Invalid request body', {
          price: ['Price must be greater than 0'],
        }),
      ),
    ).toBeNull();
  });

  it('keeps 4xx and network messages but hides 5xx and unexpected errors', () => {
    expect(mutationErrorMessage(new ApiError(400, 'VALIDATION_ERROR', 'Malformed JSON body'))).toBe(
      'Malformed JSON body',
    );
    expect(
      mutationErrorMessage(new ApiError(0, 'NETWORK_ERROR', 'Unable to reach the server')),
    ).toBe('Unable to reach the server');
    const generic = 'Something went wrong. Please try again.';
    expect(mutationErrorMessage(new ApiError(500, 'INTERNAL_ERROR', 'Internal server error'))).toBe(
      generic,
    );
    expect(mutationErrorMessage(new TypeError('x is undefined'))).toBe(generic);
  });
});

describe('isNotFound', () => {
  it('matches only an API 404', () => {
    expect(isNotFound(new ApiError(404, 'NOT_FOUND', 'Not found'))).toBe(true);
    expect(isNotFound(new ApiError(403, 'FORBIDDEN', 'Forbidden'))).toBe(false);
    expect(isNotFound(new Error('404'))).toBe(false);
  });
});
