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
  const token = useAppSelector((state) => state.auth.token) || tokenStorage.getAccessToken();

  // Prevent flashing login/signup views while verifying existing session
  if (status === 'LOADING') {
    return <GuardLoader />;
  }

  const isAuthed = isAuthenticated && isTokenValid(token);

  if (isAuthed) {
    if (isJwtAdmin(token)) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/practice" replace />;
  }

  return <Outlet />;
};
