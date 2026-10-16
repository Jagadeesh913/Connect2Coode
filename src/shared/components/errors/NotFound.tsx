import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrandLogo } from '../ui/BrandLogo';
import { useAppSelector } from '../../../app/hooks';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-between font-sans bg-[#FBFBFD] dark:bg-[#070A13] text-slate-900 dark:text-slate-100 transition-colors duration-200 overflow-x-hidden relative">
      
      {/* Ambient background glows matching Home, Practice, and Aptitude pages */}
      <div className="fixed top-12 -left-48 w-96 h-[450px] bg-purple-600/10 dark:bg-purple-600/20 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed top-24 -right-48 w-96 h-[500px] bg-indigo-600/10 dark:bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Minimal Top Brand Bar */}
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

      {/* Center 404 Hero Card */}
      <main className="w-full max-w-xl mx-auto px-4 py-12 flex flex-col items-center text-center my-auto">
        
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800/80 text-blue-600 dark:text-blue-400 text-xs font-bold mb-6 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span>HTTP 404 · PAGE NOT FOUND</span>
        </div>

        {/* Big Gradient 404 Display */}
        <div className="relative mb-4 select-none">
          <h1 className="text-7xl sm:text-9xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm font-heading">
            404
          </h1>
        </div>

        {/* Headline & Description */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
          Lost In Code Space?
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
          The problem route, company pattern, or placement resource you are looking for doesn't exist, has moved, or requires an active login session.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            <i className="fa-solid fa-house text-xs"></i>
            <span>Return to Home</span>
          </Link>

          {!isAuthenticated && (
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white dark:bg-[#111A2E] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm shadow-xs transition-all cursor-pointer"
            >
              <i className="fa-solid fa-arrow-right-to-bracket text-xs text-blue-500"></i>
              <span>Sign In</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all cursor-pointer"
          >
            <span>Go Back</span>
          </button>
        </div>

      </main>

      {/* Footer text */}
      <footer className="w-full py-6 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/80">
        © 2025 Connect 2 Code. Code Together, Connect Forever.
      </footer>

    </div>
  );
};

export default NotFound;
