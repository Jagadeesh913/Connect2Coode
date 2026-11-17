import React from 'react';
import { CheckCircle2, Trash2 } from 'lucide-react';
import { useAppSelector } from '../../../app/hooks';
import { userScopedStorage } from '../../../core/storage/userScopedStorage';

export const LocalDataControls: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const [confirming, setConfirming] = React.useState(false);
  const [cleared, setCleared] = React.useState(false);

  const clearLocalData = () => {
    if (!isAuthenticated || !user) return;
    userScopedStorage.clearForUser(user);
    setConfirming(false);
    setCleared(true);
  };

  return (
    <section
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0D1322] sm:p-6"
      aria-labelledby="local-data-controls-title"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-2.5 text-rose-600 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300">
          <Trash2 aria-hidden="true" size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="local-data-controls-title" className="text-lg font-bold text-slate-950 dark:text-white">
            Clear this account’s data from this browser
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Removes Connect2Code drafts, cached progress, and theme preference for the active account on this device. It does not delete your account, bookmarks, submissions, profile, or other server records.
          </p>

          {!isAuthenticated || !user ? (
            <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
              Sign in to target an account-specific browser scope. Guest browser storage can be removed through your browser’s site-data controls.
            </p>
          ) : cleared ? (
            <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300" role="status">
              <CheckCircle2 aria-hidden="true" size={18} />
              Local data for this account was cleared from this browser.
            </p>
          ) : confirming ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-900/70 dark:bg-rose-950/30">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Clear local drafts, progress cache, and theme preference for {user.email || 'this account'}?
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={clearLocalData}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-rose-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0D1322]"
                >
                  Clear local data
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-[#0D1322]"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-rose-300 bg-white px-5 py-2.5 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-rose-950/40 dark:focus-visible:ring-offset-[#0D1322]"
            >
              <Trash2 aria-hidden="true" size={17} />
              Review and clear local data
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

