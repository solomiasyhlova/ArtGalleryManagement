import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError } from './api';

/** The signed-in user (`User`), or `null` when signed out. */
export const AUTH_ME_KEY = ['auth', 'me'] as const;

/** Retrying can't fix these: the user must log in, lacks the role, or the resource is gone. */
const NO_RETRY_STATUSES = new Set([401, 403, 404]);

export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && NO_RETRY_STATUSES.has(error.status)) return false;
  return failureCount < 1;
}

export function isUnauthenticated(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

export function createQueryClient(): QueryClient {
  // Any 401 means the session is gone: mark the user signed out so the route guards redirect.
  const onError = (error: Error) => {
    if (isUnauthenticated(error)) client.setQueryData(AUTH_ME_KEY, null);
  };

  const client = new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: shouldRetry,
      },
    },
  });
  return client;
}

export const queryClient = createQueryClient();
