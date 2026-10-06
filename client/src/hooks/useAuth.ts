import type { LoginInput, RegisterInput, User } from '@art-gallery/shared';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { createContext, use } from 'react';
import { api } from '@/lib/api';
import { AUTH_ME_KEY, isUnauthenticated } from '@/lib/query-client';

export interface AuthActions {
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
}

export interface AuthState extends AuthActions {
  /** `null` when signed out, also while `isPending`. */
  user: User | null;
  isAdmin: boolean;
  /** True until the first `GET /auth/me` settles. The guards wait for it. */
  isPending: boolean;
}

/** Provided by `AuthProvider` (`components/auth/AuthProvider.tsx`). */
export const AuthActionsContext = createContext<AuthActions | null>(null);

/** A 401 is the normal signed-out state, not an error. */
export async function fetchCurrentUser(): Promise<User | null> {
  try {
    return await api.get<User>('/auth/me');
  } catch (error) {
    if (isUnauthenticated(error)) return null;
    throw error;
  }
}

export const currentUserQuery = queryOptions({ queryKey: AUTH_ME_KEY, queryFn: fetchCurrentUser });

/**
 * The user is read from the query cache in every caller (not passed down through context), so
 * a component always renders with the latest value, even when it re-renders because of a
 * navigation before the cache change has been broadcast.
 */
export function useAuth(): AuthState {
  const actions = use(AuthActionsContext);
  if (!actions) throw new Error('useAuth must be used inside <AuthProvider>');
  const { data, isPending } = useQuery(currentUserQuery);
  const user = data ?? null;
  return { ...actions, user, isAdmin: user?.role === 'admin', isPending };
}
