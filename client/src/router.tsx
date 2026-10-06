import { createBrowserRouter, Outlet } from 'react-router';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { AppLayout } from '@/components/layout/AppLayout';
import { GuestOnlyRoute } from '@/components/layout/GuestOnlyRoute';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { GalleryPage } from '@/pages/GalleryPage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RegisterPage } from '@/pages/RegisterPage';

export const router = createBrowserRouter([
  {
    // Inside the router, because logging out navigates to /login.
    element: (
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    ),
    children: [
      {
        Component: GuestOnlyRoute,
        children: [
          { path: 'login', Component: LoginPage },
          { path: 'register', Component: RegisterPage },
        ],
      },
      {
        Component: ProtectedRoute,
        children: [
          {
            Component: AppLayout,
            children: [
              { index: true, Component: GalleryPage },
              { path: '*', Component: NotFoundPage },
            ],
          },
        ],
      },
    ],
  },
]);
