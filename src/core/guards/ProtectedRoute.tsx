import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { tokenStorage } from '../security/tokenStorage';
import { isTokenValid } from '../security/jwt';
import { Skeleton } from '../../shared/components/ui/Skeleton';

const GuardLoader: React.FC = () => (
  <div className="p-8 flex flex-col gap-4 max-w-5xl mx-auto font-sans">
    <Skeleton className="h-10 w-64" />
    <Skeleton className="h-48 w-full" />
    <Skeleton className="h-64 w-full" />
  </div>
);

export const ProtectedRoute: React.FC = () => {
  const location = useLocation();
  const status = useAppSelector((state) => state.auth.status);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const token = useAppSelector((state) => state.auth.token) || tokenStorage.getAccessToken();

  // Prevent premature redirect during asynchronous startup session restoration
  if (status === 'LOADING') {
    return <GuardLoader />;
  }

  const hasValidAuth = isAuthenticated && isTokenValid(token);

  if (!hasValidAuth) {
    try {
      const fullPath = location.pathname + location.search + location.hash;
      if (
        fullPath &&
        fullPath !== '/' &&
        fullPath !== '/login' &&
        fullPath !== '/signup' &&
        !fullPath.startsWith('/oauth')
      ) {
        sessionStorage.setItem('post_auth_redirect', fullPath);
      }
    } catch {}
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
