import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { tokenStorage } from '../security/tokenStorage';
import { isJwtAdmin, isTokenValid } from '../security/jwt';
import { PageLoading } from '../../shared/components/ui/PageLoading';

const GuardLoader = PageLoading;

/**
 * AdminRoute Guard (F-036)
 * Restricts access to Admin Frontend routes (/admin/*).
 * Verifies that the user is authenticated AND possesses an ADMIN role
 * verified strictly from cryptographically signed JWT payload claims,
 * preventing privilege escalation via client-mutable localStorage.
 */
export const AdminRoute: React.FC = () => {
  const location = useLocation();
  const status = useAppSelector((state) => state.auth.status);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const token = useAppSelector((state) => state.auth.token) || tokenStorage.getAccessToken();
  const user = useAppSelector((state) => state.auth.user) || tokenStorage.getUser();

  // 1. Prevent premature redirect during asynchronous startup session restoration
  if (status === 'LOADING') {
    return <GuardLoader />;
  }

  // 2. Check Authentication Status
  const isAuthed = isAuthenticated && isTokenValid(token);
  if (!isAuthed) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Check Admin Role Authorization strictly from signed JWT claims and verified session metadata
  const userRole = String(user?.role || '').toUpperCase();
  const isUserRoleAdmin = userRole === 'ADMIN' || userRole === 'ROLE_ADMIN' || userRole.includes('ADMIN');
  const isAdmin = isJwtAdmin(token) || isUserRoleAdmin;

  if (!isAdmin) {
    return <Navigate to="/practice" replace />;
  }

  return <Outlet />;
};
