import React, { useEffect, useRef } from 'react';
import { Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  initializeAuth,
  refreshSessionThunk,
  setAuthenticatedSession,
  setUnauthenticatedSession,
  closeAuthModal,
} from '../features/auth/redux/authSlice';
import { fetchBookmarks } from '../features/bookmarks/redux/bookmarkSlice';
import { registerAuthListener, registerAuthFailureListener } from '../core/api/apiClient';
import { tokenStorage } from '../core/security/tokenStorage';
import { decodeJwtPayload, isJwtExpired } from '../core/security/jwt';
import { subscribeToAuthSessionEvents } from '../core/security/authSessionSync';
import { toast } from 'react-hot-toast';
import { RouteMetadata } from '../core/metadata/RouteMetadata';
import { useAssessmentIntegrity } from '../shared/hooks/useAssessmentIntegrity';

/**
 * Root route shell (F-010, F-039):
 * Initializes Redux store authentication state and bookmarks globally on app bootstrap
 * for ALL routes (Landing, Login, Practice, Admin, 404, 500).
 * Coordinates single canonical session restoration and OAuth parameter forwarding.
 */
export const AppRouterLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const userId = useAppSelector((state) => state.auth?.user?.id);
  const hasInitializedRef = useRef(false);
  const lastIntegrityNoticeAt = useRef(0);
  const { bindTarget: bindProtectedSurface } = useAssessmentIntegrity<HTMLDivElement>({
    onViolation: (violation) => {
      const now = Date.now();
      if (now - lastIntegrityNoticeAt.current < 1500) return;
      lastIntegrityNoticeAt.current = now;
      toast.error(
        violation === 'print-screen'
          ? 'Screen capture shortcuts are disabled on this site.'
          : 'Copy, paste, export, and inspection shortcuts are restricted.',
        { id: 'global-integrity-warning' }
      );
    },
  });

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

  // Cookies are shared by tabs, but Redux and the access-token cache are not.
  // Reconcile both immediately when another tab signs in, refreshes, or logs out.
  useEffect(() => subscribeToAuthSessionEvents((event) => {
    if (event.type === 'session-cleared') {
      tokenStorage.clearTokens({ broadcast: false });
      dispatch(setUnauthenticatedSession());
      return;
    }

    tokenStorage.discardInMemorySession();
    dispatch(initializeAuth());
    const token = tokenStorage.getAccessToken();
    const hasValidToken = Boolean(token && !isJwtExpired(decodeJwtPayload(token)));
    if (!hasValidToken && (tokenStorage.getRefreshToken() || tokenStorage.getUser())) {
      dispatch(refreshSessionThunk());
    }
  }), [dispatch]);

  // Intercept popup OAuth completion messages
  useEffect(() => {
    const handleOAuthMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'C2C_GOOGLE_OAUTH_SUCCESS') {
        const token = event.data.refreshToken || event.data.token;
        if (token) {
          const res = await dispatch(refreshSessionThunk(token));
          if (refreshSessionThunk.fulfilled.match(res)) {
            dispatch(closeAuthModal());
            toast.success('Signed in with Google!');
            navigate('/practice', { replace: true });
          }
        }
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => {
      window.removeEventListener('message', handleOAuthMessage);
    };
  }, [dispatch, navigate]);

  // App Bootstrap: Restore session once from backend refresh cookie
  useEffect(() => {
    // Intercept OAuth parameters if redirected to root or any non-callback route
    if (!location.pathname.startsWith('/oauth')) {
      const searchParams = new URLSearchParams(location.search);
      const hasOAuthParams =
        searchParams.has('refreshToken') ||
        searchParams.has('refresh_token') ||
        searchParams.has('token') ||
        searchParams.has('accessToken') ||
        searchParams.has('access_token');

      if (hasOAuthParams) {
        navigate(`/oauth/callback${location.search}${location.hash}`, { replace: true });
        return;
      }
    }

    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    dispatch(initializeAuth());

    // /oauth/callback route coordinates its own refresh lifecycle
    if (!location.pathname.startsWith('/oauth')) {
      const token = tokenStorage.getAccessToken();
      const hasValidToken = Boolean(token && !isJwtExpired(decodeJwtPayload(token)));
      const hasRefreshToken = Boolean(tokenStorage.getRefreshToken());
      const hasUser = Boolean(tokenStorage.getUser());
      // Refresh proactively if no active valid access token exists and a refresh token or user profile is stored
      if (!hasValidToken && (hasRefreshToken || hasUser)) {
        dispatch(refreshSessionThunk());
      }
    }
  }, [dispatch, location.pathname, location.search, location.hash, navigate]);

  // Fetch bookmarks only after identity restoration completes. Progress hydration
  // is owned by App's ProgressHydrator, keyed to the authenticated user scope.
  useEffect(() => {
    if (userId) {
      dispatch(fetchBookmarks());
    }
  }, [dispatch, userId]);

  return (
    <div ref={bindProtectedSurface} className="c2c-protected-surface contents">
      <RouteMetadata>
        <ScrollRestoration />
        <Outlet />
      </RouteMetadata>
    </div>
  );
};
