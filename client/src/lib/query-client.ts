import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api';

/** Retrying can't fix these: the user must log in, lacks the role, or the resource is gone. */
const NO_RETRY_STATUSES = new Set([401, 403, 404]);

export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && NO_RETRY_STATUSES.has(error.status)) return false;
  return failureCount < 1;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: shouldRetry,
    },
  },
});
