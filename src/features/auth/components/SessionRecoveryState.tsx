import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { tokenStorage } from '../../../core/security/tokenStorage';
import { refreshSessionThunk, setUnauthenticatedSession } from '../redux/authSlice';

interface SessionRecoveryStateProps {
  allowSignIn?: boolean;
}

export const SessionRecoveryState: React.FC<SessionRecoveryStateProps> = ({ allowSignIn = false }) => {
  const dispatch = useAppDispatch();
  const loading = useAppSelector((state) => state.auth.loading);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg-page)] px-4 text-[var(--text-primary)]">
      <section className="w-full max-w-md rounded-2xl border border-amber-400/35 bg-[var(--bg-surface)] p-6 text-center shadow-2xl shadow-slate-950/10">
        <h1 className="text-xl font-bold">Can’t reach the server</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          We couldn’t verify your session. Try again when the service is back.
        </p>
        <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            disabled={loading}
            onClick={() => void dispatch(refreshSessionThunk())}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            {loading ? 'Checking session…' : 'Try again'}
          </button>
          {allowSignIn && !loading && (
            <button
              type="button"
              onClick={() => {
                // This is an explicit account-replacement choice. Clear only
                // client memory; the backend-owned HttpOnly cookie remains
                // untouched until login replaces it or logout revokes it.
                tokenStorage.clearTokens();
                dispatch(setUnauthenticatedSession());
              }}
              className="rounded-lg border border-[var(--border-strong)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface-muted)]"
            >
              Sign in instead
            </button>
          )}
        </div>
      </section>
    </main>
  );
};
