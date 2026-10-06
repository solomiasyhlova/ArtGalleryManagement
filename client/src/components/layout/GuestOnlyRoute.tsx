import { Navigate, Outlet, useSearchParams } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { safeRedirect } from '@/lib/safe-redirect';
import { FullPageSpinner } from './FullPageSpinner';

/**
 * Renders the auth pages for signed-out users. Signed-in users go to `?redirect=` (if it is
 * internal) or `/`. This is also how a successful login or sign-up leaves the page.
 */
export function GuestOnlyRoute() {
  const { user, isPending } = useAuth();
  const [searchParams] = useSearchParams();

  if (isPending) return <FullPageSpinner />;
  if (user) return <Navigate to={safeRedirect(searchParams.get('redirect'))} replace />;
  return <Outlet />;
}
