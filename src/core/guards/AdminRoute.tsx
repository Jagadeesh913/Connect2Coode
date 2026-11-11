import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { isAdminRole } from '../security/jwt';
import { PageLoading } from '../../shared/components/ui/PageLoading';
import { SessionRecoveryState } from '../../features/auth/components/SessionRecoveryState';

const GuardLoader = PageLoading;

/**
 * AdminRoute Guard (F-036)
 * Restricts access to Admin Frontend routes (/admin/*).
 * Verifies that the user is authenticated and that the latest backend auth
 * response supplied an ADMIN role. The backend remains authoritative.
 */
export const AdminRoute: React.FC = () => {
  const location = useLocation();
  const status = useAppSelector((state) => state.auth.status);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const role = useAppSelector((state) => state.auth.user?.role);

  // 1. Prevent premature redirect during asynchronous startup session restoration
  if (status === 'LOADING') {
    return <GuardLoader />;
  }

  if (status === 'RECOVERY_REQUIRED') return <SessionRecoveryState />;

  // 2. Check Authentication Status
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // 3. Route presentation follows the role returned by login/refresh.
  if (!isAdminRole(role)) {
    return <Navigate to="/practice" replace />;
  }

  return <Outlet />;
};
