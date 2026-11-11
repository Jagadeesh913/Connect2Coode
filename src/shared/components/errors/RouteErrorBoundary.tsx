import React from 'react';
import {
  AlertTriangle,
  Compass,
  Home,
  RotateCcw,
  Code2,
  Layers,
  Building2,
  BookOpen,
} from 'lucide-react';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { BrandLogo } from '../ui/BrandLogo';

/**
 * React Router owns errors raised while matching or rendering routes, so those
 * errors bypass a conventional component error boundary. This route-level
 * boundary delivers a high-craft recovery screen aligned with Connect 2 Code's
 * design system, colors, and typography, while deliberately keeping raw
 * implementation details out of the UI.
 *
 * Recovery actions use hard window navigation (window.location.href) so stuck
 * router error states, failed chunk downloads, and corrupted memory caches
 * are completely flushed on return to Home.
 */
export const RouteErrorBoundary: React.FC = () => {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  const handleGoHome = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    window.location.href = '/';
  };

  const handleNavigate = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = path;
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg-page)] text-[var(--text-primary)] flex flex-col justify-between font-sans relative overflow-hidden transition-colors duration-200">
      {/* Ambient background glows */}
      <div className="fixed top-12 -left-48 w-96 h-[400px] bg-rose-500/10 dark:bg-rose-600/15 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-12 -right-48 w-96 h-[400px] bg-indigo-600/10 dark:bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-[160px] pointer-events-none -z-10" />

      {/* Top Header */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between shrink-0 relative z-10">
        <BrandLogo size="md" />
        <a
          href="/"
          onClick={handleGoHome}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-neutral-800/60 transition-all cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Back to Home</span>
        </a>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-xl mx-auto px-4 py-8 sm:py-12 my-auto relative z-10 flex flex-col items-center">
        <section
          role="alert"
          className="w-full rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-[#0D1322]/95 backdrop-blur-xl p-8 sm:p-10 text-center shadow-2xl shadow-slate-900/5 dark:shadow-black/50 relative overflow-hidden"
        >
          {/* Subtle gradient hairline top accent */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-indigo-500 opacity-90" />

          {/* Animated Status Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold mb-6 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
            <span className="font-mono tracking-wide">
              {notFound ? 'HTTP 404 · PAGE NOT FOUND' : 'HTTP 500 · TEMPORARY APPLICATION ISSUE'}
            </span>
          </div>

          {/* Hero Icon Badge */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500/10 via-amber-500/10 to-indigo-500/10 border border-rose-200/80 dark:border-rose-900/60 text-rose-500 dark:text-rose-400 shadow-md ring-8 ring-rose-500/5 dark:ring-rose-500/10">
            {notFound ? (
              <Compass className="w-8 h-8 text-indigo-500 animate-spin" style={{ animationDuration: '10s' }} />
            ) : (
              <AlertTriangle className="w-8 h-8" />
            )}
          </div>

          {/* Title & Description */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
            {notFound ? 'This page could not be found.' : 'We could not load this page.'}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed mb-8">
            {notFound
              ? 'The address may be incorrect, or the page may have been moved to a new route.'
              : 'Your data is safe. Please retry, or return to the platform dashboard and continue working.'}
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-blue-600/25 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Try again</span>
            </button>
            <a
              href="/"
              onClick={handleGoHome}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-neutral-800/80 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Return home</span>
            </a>
          </div>

          {/* Quick Navigation Strip */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-neutral-800/80">
            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
              Explore Available Tracks
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
              <a
                href="/practice"
                onClick={handleNavigate('/practice')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-neutral-800/60 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 text-slate-600 dark:text-slate-400 font-medium transition-colors"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Practice Arena</span>
              </a>
              <a
                href="/dsa-sheet"
                onClick={handleNavigate('/dsa-sheet')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-neutral-800/60 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 text-slate-600 dark:text-slate-400 font-medium transition-colors"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>DSA Sheets</span>
              </a>
              <a
                href="/companies"
                onClick={handleNavigate('/companies')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-neutral-800/60 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 text-slate-600 dark:text-slate-400 font-medium transition-colors"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Companies</span>
              </a>
              <a
                href="/aptitude"
                onClick={handleNavigate('/aptitude')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-neutral-800/60 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 text-slate-600 dark:text-slate-400 font-medium transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Aptitude</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/80 shrink-0 relative z-10">
        © 2026 Connect 2 Code. Code Together, Connect Forever.
      </footer>
    </div>
  );
};

export default RouteErrorBoundary;
