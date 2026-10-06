import { createBrowserRouter } from 'react-router';
import { AppLayout } from '@/components/layout/AppLayout';
import { GalleryPage } from '@/pages/GalleryPage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RegisterPage } from '@/pages/RegisterPage';

export const router = createBrowserRouter([
  {
    Component: AppLayout,
    children: [
      { index: true, Component: GalleryPage },
      { path: 'login', Component: LoginPage },
      { path: 'register', Component: RegisterPage },
      { path: '*', Component: NotFoundPage },
    ],
  },
]);
