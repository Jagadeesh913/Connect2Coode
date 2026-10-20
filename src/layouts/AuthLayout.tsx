import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { BrandLogo } from '../shared/components/ui/BrandLogo';

/** Authentication-only layout with Connect 2 Code branding and ambient background. */
export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-[#070A13] flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="fixed top-12 -left-48 w-96 h-[400px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed top-36 -right-48 w-96 h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 flex items-center justify-between z-10">
        <Link to="/" className="inline-block" title="Back to Home">
          <BrandLogo />
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 bg-white/5"
        >
          <i className="fa-solid fa-arrow-left text-xs text-slate-400"></i>
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Auth Content */}
      <main className="flex-1 flex items-center justify-center p-4 z-10">
        <Outlet />
      </main>

      {/* Footer copyright */}
      <footer className="w-full text-center py-5 text-xs text-slate-500 z-10">
        © {new Date().getFullYear()} Connect 2 Code. All rights reserved.
      </footer>
    </div>
  );
};
