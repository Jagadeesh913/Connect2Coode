import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'An unexpected application error occurred.',
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo): void {
    // Keep the boundary side-effect free: production logging can be connected here
    // without exposing stack traces or user data in the UI.
    void error;
    void info;
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen w-full bg-[var(--bg-page)] text-[var(--text-primary)] flex flex-col justify-between font-sans relative overflow-hidden transition-colors duration-200">
        {/* Ambient background glows */}
        <div className="fixed top-12 -left-48 w-96 h-[400px] bg-rose-500/10 dark:bg-rose-600/15 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="fixed bottom-12 -right-48 w-96 h-[400px] bg-indigo-600/10 dark:bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-[160px] pointer-events-none -z-10" />

        {/* Top Header */}
        <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between shrink-0 relative z-10">
          <BrandLogo size="md" />
          <button
            type="button"
            onClick={this.handleGoHome}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-neutral-800/60 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
        </header>

        {/* Main Error Hero Card */}
        <main className="w-full max-w-xl mx-auto px-4 py-8 sm:py-12 my-auto relative z-10 flex flex-col items-center">
          <section
            role="alert"
            className="w-full rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-[#0D1322]/95 backdrop-blur-xl p-8 sm:p-10 text-center shadow-2xl shadow-slate-900/5 dark:shadow-black/50 relative overflow-hidden"
          >
            {/* Hairline Accent */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-indigo-500 opacity-90" />

            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold mb-6 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <span className="font-mono tracking-wide">APPLICATION RECOVERY SHIELD</span>
            </div>

            {/* Alert Icon Badge */}
            <div
              aria-hidden="true"
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500/10 via-amber-500/10 to-indigo-500/10 border border-rose-200/80 dark:border-rose-900/60 text-rose-500 dark:text-rose-400 shadow-md ring-8 ring-rose-500/5 dark:ring-rose-500/10"
            >
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
              Something went wrong
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed mb-8">
              The page encountered an unexpected issue and could not be rendered safely. Please reload to resume your session.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-blue-600/25 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reload application</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-neutral-800/80 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Return Home</span>
              </button>
            </div>

            {import.meta.env.DEV && this.state.message ? (
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-left">
                <span className="text-[10px] uppercase font-bold tracking-wider text-rose-500 block mb-1">
                  Developer Diagnostics:
                </span>
                <p
                  className="break-words text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800"
                  data-testid="error-boundary-message"
                >
                  {this.state.message}
                </p>
              </div>
            ) : null}
          </section>
        </main>

        {/* Footer */}
        <footer className="w-full py-6 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/80 shrink-0 relative z-10">
          © 2026 Connect 2 Code. Code Together, Connect Forever.
        </footer>
      </div>
    );
  }
}

export default AppErrorBoundary;
