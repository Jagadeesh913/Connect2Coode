import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { BrandLogo } from '../ui/BrandLogo';

/**
 * React Router owns errors raised while matching or rendering routes, so those
 * errors bypass a conventional component error boundary. This route-level
 * boundary deliberately keeps implementation details out of the UI.
 */
export const RouteErrorBoundary = () => {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <main className="min-h-screen bg-[var(--bg-page)] px-4 py-8 text-[var(--text-primary)] sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl flex-col justify-center">
        <BrandLogo size="md" className="mb-10" />
        <section
          role="alert"
          className="rounded-3xl border border-[var(--border-primary)] bg-[var(--bg-surface)] p-6 shadow-xl shadow-slate-950/5 sm:p-8 dark:shadow-black/20"
        >
          <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
            <AlertTriangle aria-hidden="true" className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
            {notFound ? 'Page unavailable' : 'Temporary application issue'}
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            {notFound ? 'This page could not be found.' : 'We could not load this page.'}
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
            {notFound
              ? 'The address may be incorrect, or the page may have moved.'
              : 'Your data is safe. Please retry, or return to the dashboard and continue working.'}
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              Try again
            </button>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] px-4 py-2.5 text-sm font-bold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <Home aria-hidden="true" className="h-4 w-4" />
              Return home
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
};
