import type { LoginInput, RegisterInput, User } from '@art-gallery/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { AuthActionsContext, currentUserQuery, type AuthActions } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { AUTH_ME_KEY } from '@/lib/query-client';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  // Starts the session check (`GET /auth/me`) as soon as the app mounts.
  useQuery(currentUserQuery);

  const setUser = useCallback(
    (user: User) => queryClient.setQueryData(AUTH_ME_KEY, user),
    [queryClient],
  );
  const { mutateAsync: login } = useMutation({
    mutationFn: (input: LoginInput) => api.post<User>('/auth/login', input),
    onSuccess: setUser,
  });
  const { mutateAsync: register } = useMutation({
    mutationFn: (input: RegisterInput) => api.post<User>('/auth/register', input),
    onSuccess: setUser,
  });
  const { mutateAsync: logoutRequest } = useMutation({
    mutationFn: () => api.post<undefined>('/auth/logout'),
  });

  const logout = useCallback(async () => {
    await logoutRequest();
    // Drop every cached response so the next user never sees this one's data.
    queryClient.clear();
    queryClient.setQueryData(AUTH_ME_KEY, null);
    // flushSync commits the route change before the cache update re-renders the current
    // page, so ProtectedRoute doesn't redirect to `/login?redirect=<this page>` first.
    await navigate('/login', { replace: true, flushSync: true });
  }, [logoutRequest, navigate, queryClient]);

  const actions = useMemo<AuthActions>(
    () => ({ login, register, logout }),
    [login, register, logout],
  );

  return <AuthActionsContext value={actions}>{children}</AuthActionsContext>;
}
