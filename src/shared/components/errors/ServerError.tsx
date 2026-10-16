import React from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../ui/BrandLogo';

export const ServerError: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-between font-sans bg-[#FBFBFD] dark:bg-[#070A13] text-slate-900 dark:text-slate-100 transition-colors duration-200 overflow-x-hidden relative">
      
      {/* Ambient background glows */}
      <div className="fixed top-12 -left-48 w-96 h-[400px] bg-amber-500/10 dark:bg-amber-600/15 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed top-24 -right-48 w-96 h-[400px] bg-rose-600/10 dark:bg-rose-600/15 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Top Bar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <BrandLogo size="md" />
        <Link
          to="/"
          className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5 transition-colors"
        >
          <i className="fa-solid fa-arrow-left text-xs"></i>
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Center 500 Hero Card */}
      <main className="w-full max-w-lg mx-auto px-4 py-12 flex flex-col items-center text-center my-auto">
        
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold mb-6 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          <span>HTTP 500 · SERVER EXCEPTION</span>
        </div>

        {/* Big 500 Display */}
        <div className="relative mb-4 select-none">
          <h1 className="text-7xl sm:text-9xl font-extrabold tracking-tight bg-gradient-to-r from-rose-600 via-amber-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-sm font-heading">
            500
          </h1>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
          Internal Server Error
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
          An unhandled error occurred while processing your request. Please try reloading the page or head back to safety.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            <i className="fa-solid fa-rotate-right text-xs"></i>
            <span>Reload Page</span>
          </button>

          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all cursor-pointer"
          >
            <i className="fa-solid fa-house text-xs"></i>
            <span>Return to Home</span>
          </Link>
        </div>

      </main>

      {/* Footer text */}
      <footer className="w-full py-6 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/80">
        © 2025 Connect 2 Code. Code Together, Connect Forever.
      </footer>

    </div>
  );
};

export default ServerError;
