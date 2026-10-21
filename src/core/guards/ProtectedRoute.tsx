import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { tokenStorage } from '../security/tokenStorage';
import { isTokenValid } from '../security/jwt';
import { PageLoading } from '../../shared/components/ui/PageLoading';

const GuardLoader = PageLoading;

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
