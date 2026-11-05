import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { refreshSessionThunk } from '../redux/authSlice';

export const SessionRecoveryState: React.FC = () => {
  const dispatch = useAppDispatch();
  const loading = useAppSelector((state) => state.auth.loading);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <section className="w-full max-w-md rounded-2xl border border-amber-400/25 bg-slate-900 p-6 text-center shadow-2xl">
        <h1 className="text-xl font-bold">Session check interrupted</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          We could not reach the authentication service. Your session was not signed out.
        </p>
        <button
          type="button"
          disabled={loading}
          onClick={() => void dispatch(refreshSessionThunk())}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          {loading ? 'Checking session…' : 'Retry session check'}
        </button>
      </section>
    </main>
  );
};
