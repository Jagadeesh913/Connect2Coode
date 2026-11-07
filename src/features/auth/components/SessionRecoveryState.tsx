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
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <section className="w-full max-w-md rounded-2xl border border-amber-400/25 bg-slate-900 p-6 text-center shadow-2xl">
        <h1 className="text-xl font-bold">Session check interrupted</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          We could not complete the session check. Your session was not signed out automatically.
        </p>
        <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            disabled={loading}
            onClick={() => void dispatch(refreshSessionThunk())}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            {loading ? 'Checking session…' : 'Retry session check'}
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
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-slate-400 hover:bg-slate-800"
            >
              Sign in instead
            </button>
          )}
        </div>
      </section>
    </main>
  );
};
