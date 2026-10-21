import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { tokenStorage } from '../security/tokenStorage';
import { isJwtAdmin, isTokenValid } from '../security/jwt';
import { PageLoading } from '../../shared/components/ui/PageLoading';

const GuardLoader = PageLoading;

export const GuestRoute: React.FC = () => {
  const status = useAppSelector((state) => state.auth.status);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const currentUser = useAppSelector((state) => state.auth.user) || tokenStorage.getUser();
  const token = useAppSelector((state) => state.auth.token) || tokenStorage.getAccessToken();

  // Prevent flashing login/signup views while verifying existing session
  if (status === 'LOADING') {
    return <GuardLoader />;
  }

  const isAuthed = isAuthenticated && isTokenValid(token);

  if (isAuthed) {
    const role = String(currentUser?.role || '').toUpperCase();
    const isAdmin = role === 'ADMIN' || role === 'ROLE_ADMIN' || role.includes('ADMIN') || isJwtAdmin(token);
    if (isAdmin) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/practice" replace />;
  }

  return <Outlet />;
};
