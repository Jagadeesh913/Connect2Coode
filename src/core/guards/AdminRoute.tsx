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
 * derived strictly from active JWT payload claims rather than mutable cached
 * profile metadata. The backend remains authoritative for real authorization.
 */
export const AdminRoute: React.FC = () => {
  const location = useLocation();
  const status = useAppSelector((state) => state.auth.status);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const token = useAppSelector((state) => state.auth.token) || tokenStorage.getAccessToken();

  // 1. Prevent premature redirect during asynchronous startup session restoration
  if (status === 'LOADING') {
    return <GuardLoader />;
  }

  // 2. Check Authentication Status
  const isAuthed = isAuthenticated && isTokenValid(token);
  if (!isAuthed) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Client-side admin routing is derived only from the active token claims.
  // The cached user profile is browser-mutable metadata and must never grant access.
  if (!isJwtAdmin(token)) {
    return <Navigate to="/practice" replace />;
  }

  return <Outlet />;
};
