import React, { useEffect, useRef } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  initializeAuth,
  refreshSessionThunk,
  setAuthenticatedSession,
  setUnauthenticatedSession,
} from '../features/auth/redux/authSlice';
import { fetchBookmarks } from '../features/bookmarks/redux/bookmarkSlice';
import { registerAuthListener, registerAuthFailureListener } from '../core/api/apiClient';
import { tokenStorage } from '../core/security/tokenStorage';
import { decodeJwtPayload, isJwtExpired } from '../core/security/jwt';

/**
 * Root route shell (F-010, F-039):
 * Initializes Redux store authentication state and bookmarks globally on app bootstrap
 * for ALL routes (Landing, Login, Practice, Admin, 404, 500).
 * Coordinates single canonical session restoration via HttpOnly refresh cookie.
 */
export const AppRouterLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const userId = useAppSelector((state) => state.auth?.user?.id);
  const hasInitializedRef = useRef(false);

  // Synchronize Redux store if apiClient interceptor silently refreshes in background
  useEffect(() => {
    const unregisterAuth = registerAuthListener((token, data) => {
      dispatch(setAuthenticatedSession({ token, user: data?.user || tokenStorage.getUser() }));
    });
    const unregisterFailure = registerAuthFailureListener(() => {
      dispatch(setUnauthenticatedSession());
    });
    return () => {
      unregisterAuth();
      unregisterFailure();
    };
  }, [dispatch]);

  // App Bootstrap: Restore session once from backend HttpOnly refresh cookie
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    dispatch(initializeAuth());

    // /oauth/callback route coordinates its own refresh lifecycle
    if (!location.pathname.startsWith('/oauth')) {
      const token = tokenStorage.getAccessToken();
      const hasValidToken = Boolean(token && !isJwtExpired(decodeJwtPayload(token)));
      const hasRefreshToken = Boolean(tokenStorage.getRefreshToken());
      // Only refresh proactively if no active valid access token exists and a refresh token is stored
      if (!hasValidToken && hasRefreshToken) {
        dispatch(refreshSessionThunk());
      }
    }
  }, [dispatch, location.pathname]);

  // Fetch bookmarks once user session is active
  useEffect(() => {
    if (userId) {
      dispatch(fetchBookmarks());
    }
  }, [dispatch, userId]);

  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
};
