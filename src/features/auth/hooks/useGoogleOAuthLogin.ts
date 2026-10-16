import { useCallback } from 'react';
import { getGoogleOAuthUrl } from '../../../core/api/apiClient';

/**
 * Initiates the Google OAuth flow via direct browser navigation.
 * Leaves the frontend and delegates OAuth negotiation completely to backend Spring Security.
 */
export function useGoogleOAuthLogin() {
  const initiateGoogleLogin = useCallback(() => {
    // Preserve current internal route for post-auth navigation if safe
    try {
      const currentPath = window.location.pathname + window.location.search;
      if (
        currentPath &&
        currentPath !== '/login' &&
        currentPath !== '/signup' &&
        !currentPath.startsWith('/oauth')
      ) {
        sessionStorage.setItem('post_auth_redirect', currentPath);
      }
    } catch {}

    const authUrl = getGoogleOAuthUrl();
    window.location.href = authUrl;
  }, []);

  return { initiateGoogleLogin };
}
