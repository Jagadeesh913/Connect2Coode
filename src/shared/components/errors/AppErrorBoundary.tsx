import React from 'react';

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
      <main
        role="alert"
        className="min-h-screen w-full bg-[#FBFBFD] dark:bg-[#070A13] text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans transition-colors duration-200"
      >
        {/* Ambient background glows */}
        <div className="fixed top-12 -left-48 w-96 h-[400px] bg-rose-500/10 dark:bg-rose-600/15 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="fixed bottom-12 -right-48 w-96 h-[400px] bg-indigo-600/10 dark:bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none -z-10" />

        <section className="w-full max-w-lg rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-[#0D1322]/95 backdrop-blur-md p-8 sm:p-10 text-center shadow-xl relative z-10">
          
          {/* Brand Logo Header */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <img src="/logo-mark.png" alt="Connect to Code" className="w-8 h-8 rounded-lg" />
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
              connect<span className="text-blue-600">2</span>code
            </span>
          </div>

          {/* Alert Icon Badge */}
          <div
            aria-hidden="true"
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-900/60 text-rose-500 dark:text-rose-400 shadow-2xs"
          >
            <i className="fa-solid fa-triangle-exclamation text-xl" />
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
            Something went wrong
          </h1>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            The page encountered an unexpected issue and could not be rendered safely. Please reload to resume your session.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={this.handleReload}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              <i className="fa-solid fa-rotate-right text-xs"></i>
              <span>Reload application</span>
            </button>
            <button
              type="button"
              onClick={this.handleGoHome}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all cursor-pointer"
            >
              <span>Return Home</span>
            </button>
          </div>

          {import.meta.env.DEV && this.state.message ? (
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-left">
              <span className="text-[10px] uppercase font-bold tracking-wider text-rose-500 block mb-1">
                Developer Diagnostics:
              </span>
              <p className="break-words text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800" data-testid="error-boundary-message">
                {this.state.message}
              </p>
            </div>
          ) : null}
        </section>
      </main>
    );
  }
}

export default AppErrorBoundary;
