import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '../../../app/hooks';
import { refreshSessionThunk, closeAuthModal } from '../redux/authSlice';
import { isJwtAdmin } from '../../../core/security/jwt';
import { tokenStorage } from '../../../core/security/tokenStorage';
import { toast } from 'react-hot-toast';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

/**
 * Sanitizes redirect destination to prevent open-redirect vulnerabilities.
 * Only allows relative internal paths within the single page application.
 */
function getSafeRedirectUrl(target: string | null | undefined): string {
  if (!target || typeof target !== 'string') return '/practice';
  const trimmed = target.trim();
  if (
    trimmed.startsWith('/') &&
    !trimmed.startsWith('//') &&
    !trimmed.startsWith('/\\') &&
    !trimmed.includes(':') &&
    trimmed !== '/login' &&
    trimmed !== '/signup' &&
    !trimmed.startsWith('/oauth')
  ) {
    return trimmed;
  }
  return '/practice';
}

export const OAuthCallback: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const executionRef = useRef(false);

  useEffect(() => {
    // Avoid double execution in React StrictMode
    if (executionRef.current) return;
    executionRef.current = true;

    // Extract any error reported in query parameters
    const errorParam = searchParams.get('error') || searchParams.get('error_description');
    if (errorParam) {
      setError(errorParam);
      return;
    }

    // Safest flow: Establish authenticated session using the backend HttpOnly refreshToken cookie
    const completeAuth = async () => {
      try {
        const result = await dispatch(refreshSessionThunk());

        if (refreshSessionThunk.fulfilled.match(result)) {
          dispatch(closeAuthModal());
          const token = tokenStorage.getAccessToken();
          const userPayload = result.payload as any;
          const user = userPayload?.user || userPayload;
          const userName = user?.firstName || user?.fullName || 'User';

          toast.success(`Welcome back, ${userName}! Signed in with Google.`);

          // If running inside a popup window, transmit success to parent window and close self
          if (window.opener && window.opener !== window) {
            try {
              window.opener.postMessage(
                { type: 'C2C_GOOGLE_OAUTH_SUCCESS' },
                window.location.origin
              );
              setTimeout(() => {
                try { window.close(); } catch {}
              }, 150);
              return;
            } catch (e) {
              console.warn('Popup postMessage warning:', e);
            }
          }

          // Determine safe destination
          let destination = '/practice';
          try {
            const savedRedirect = sessionStorage.getItem('post_auth_redirect');
            if (savedRedirect) {
              sessionStorage.removeItem('post_auth_redirect');
              destination = getSafeRedirectUrl(savedRedirect);
            }
          } catch {}

          const isAdmin = isJwtAdmin(token);
          if (destination === '/practice' && isAdmin) {
            destination = '/admin/dashboard';
          }

          navigate(destination, { replace: true });
        } else {
          const rawError = (result.payload as string) || '';
          const errMsg =
            rawError && !rawError.toLowerCase().includes('missing')
              ? rawError
              : 'Could not establish an authenticated session after Google sign-in. Please try again.';
          setError(errMsg);
        }
      } catch (err: any) {
        setError(err?.message || 'An unexpected error occurred completing authentication.');
      }
    };

    completeAuth();
  }, [dispatch, navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#131418] border border-red-500/30 rounded-xl p-6 sm:p-8 shadow-2xl text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4 text-red-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold mb-2">Authentication Failed</h2>
          <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
            {error}
          </p>
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Login</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#131418] border border-white/10 rounded-xl p-8 shadow-2xl text-center flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-4 text-indigo-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <h2 className="text-lg font-bold mb-1">Completing Authentication</h2>
        <p className="text-xs text-neutral-400">
          Verifying your Google session with the backend...
        </p>
      </div>
    </div>
  );
};
