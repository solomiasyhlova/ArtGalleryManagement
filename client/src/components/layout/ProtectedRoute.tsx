import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { FullPageSpinner } from './FullPageSpinner';

/** Renders its child routes for signed-in users. Everyone else goes to the login page. */
export function ProtectedRoute() {
  const { user, isPending } = useAuth();
  const { pathname, search } = useLocation();

  if (isPending) return <FullPageSpinner />;
  if (!user) {
    const params = new URLSearchParams({ redirect: pathname + search });
    return <Navigate to={`/login?${params}`} replace />;
  }
  return <Outlet />;
}
