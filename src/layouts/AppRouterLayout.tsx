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
import { isAdminRole } from '../core/security/jwt';
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
  const isAdminRoute = location.pathname === '/admin' || location.pathname.startsWith('/admin/');
  const {
    bindTarget: bindProtectedSurface,
    enterSecureMode,
    isContentObscured,
    isSecureModeActive,
    secureModeSupported,
  } = useAssessmentIntegrity<HTMLDivElement>({
    enabled: !isAdminRoute,
    obscureOnFocusLoss: !isAdminRoute,
  });
  const isProblemWorkspace = !isAdminRoute && /^\/problems\/[^/]+$/.test(location.pathname);

  // Secure mode is learner-only. Do not carry its document fullscreen state
  // into the unrestricted administrator workspace after client navigation.
  useEffect(() => {
    if (!isAdminRoute || !document.fullscreenElement) return;
    void document.exitFullscreen().catch(() => undefined);
  }, [isAdminRoute]);

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
    dispatch(refreshSessionThunk());
  }), [dispatch]);

  // Intercept popup OAuth completion messages
  useEffect(() => {
    const handleOAuthMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.source === window) return;
      if (event.data?.type === 'C2C_GOOGLE_OAUTH_SUCCESS') {
        tokenStorage.discardInMemorySession();
        const res = await dispatch(refreshSessionThunk());
        if (refreshSessionThunk.fulfilled.match(res)) {
          dispatch(closeAuthModal());
          toast.success('Signed in with Google!');
          const refreshedUser = res.payload?.user || res.payload;
          navigate(isAdminRole(refreshedUser?.role) ? '/admin/dashboard' : '/practice', { replace: true });
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
      let hasOAuthParams =
        searchParams.has('refreshToken') ||
        searchParams.has('refresh_token') ||
        searchParams.has('token') ||
        searchParams.has('accessToken') ||
        searchParams.has('access_token');

      if (!hasOAuthParams && location.hash) {
        try {
          const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));
          hasOAuthParams =
            hashParams.has('refreshToken') ||
            hashParams.has('refresh_token') ||
            hashParams.has('token') ||
            hashParams.has('accessToken') ||
            hashParams.has('access_token');
        } catch {}
      }

      if (hasOAuthParams) {
        navigate(`/oauth/callback${location.search}${location.hash}`, { replace: true });
        return;
      }
    }

    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    // /oauth/callback route coordinates its own refresh lifecycle
    if (!location.pathname.startsWith('/oauth')) {
      dispatch(initializeAuth());
      dispatch(refreshSessionThunk());
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
    <div
      ref={bindProtectedSurface}
      className={isAdminRoute ? 'contents' : 'c2c-protected-surface contents'}
    >
      <RouteMetadata>
        <ScrollRestoration />
        <Outlet />
      </RouteMetadata>
      {isProblemWorkspace && secureModeSupported && (
        <button
          type="button"
          onClick={() => void enterSecureMode()}
          disabled={isSecureModeActive}
          className="fixed bottom-4 right-4 z-[60] inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-slate-950/90 px-3 py-2 text-xs font-extrabold text-blue-100 shadow-xl shadow-slate-950/20 backdrop-blur transition hover:border-blue-300/60 hover:bg-slate-900 disabled:cursor-default disabled:border-emerald-400/30 disabled:text-emerald-200"
          aria-pressed={isSecureModeActive}
          title="Use fullscreen and browser keyboard lock where supported"
        >
          <i className={`fa-solid ${isSecureModeActive ? 'fa-shield-circle-check' : 'fa-expand'}`} aria-hidden="true"></i>
          {isSecureModeActive ? 'Secure mode on' : 'Enter secure mode'}
        </button>
      )}
      {!isAdminRoute && isContentObscured && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#070A13] p-6 text-center text-white" role="alert" aria-live="assertive">
          <div className="max-w-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-400/30 bg-blue-500/15 text-2xl text-blue-300">
              <i className="fa-solid fa-shield-halved" aria-hidden="true"></i>
            </div>
            <h2 className="text-xl font-extrabold">Assessment content protected</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">Return focus to this window to continue. Content is hidden while the page is inactive.</p>
          </div>
        </div>
      )}
    </div>
  );
};
