import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  Home,
  ArrowLeft,
  Code2,
  Building2,
  BookOpen,
  Sparkles,
  LogIn,
  Terminal,
} from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';
import { useAppSelector } from '../../../app/hooks';

interface NotFoundProps {
  embedded?: boolean;
  title?: string;
  description?: string;
}

export const NotFound: React.FC<NotFoundProps> = ({
  embedded = false,
  title = 'Page Not Found',
  description,
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const defaultDescription =
    description ||
    "The problem route, company pattern, or placement resource you are looking for doesn't exist, has been relocated, or is temporarily unavailable.";

  const content = (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 flex flex-col items-center text-center relative z-10 animate-fade-in">
      {/* Animated Status Pill */}
      <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/80 text-blue-600 dark:text-blue-400 text-[10px] sm:text-xs font-semibold tracking-wide mb-6 shadow-xs backdrop-blur-xs max-w-full">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping shrink-0"></span>
        <span className="font-mono truncate">HTTP 404 · ERROR_ROUTE_UNRESOLVED</span>
      </div>

      {/* Hero 404 Display with Holographic Glowing Background */}
      <div className="relative mb-6 select-none flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 blur-3xl rounded-full scale-110 pointer-events-none" />
        <h1 className="text-6xl sm:text-9xl md:text-[13rem] font-black tracking-tighter bg-gradient-to-b from-slate-900 via-indigo-700 to-blue-600 dark:from-white dark:via-slate-200 dark:to-indigo-500 bg-clip-text text-transparent drop-shadow-sm font-mono leading-none">
          404
        </h1>
        <div className="absolute -bottom-2 sm:-bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-lg bg-white/90 dark:bg-[#0F172A]/90 border border-slate-200 dark:border-slate-800 shadow-md backdrop-blur-md whitespace-nowrap">
          <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 animate-spin shrink-0" style={{ animationDuration: '8s' }} />
          <span className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300">Target Disconnected</span>
        </div>
      </div>

      {/* Headline & Description */}
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
        {title === 'Page Not Found' ? 'Lost In Code Space?' : title}
      </h2>
      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed">
        {defaultDescription}
      </p>

      {/* Futuristic Mini Terminal Mockup */}
      <div className="w-full max-w-lg mb-10 text-left bg-slate-900/95 dark:bg-[#0B1120]/95 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-mono text-xs">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
          </div>
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Terminal className="w-3 h-3 text-indigo-400" />
            <span>c2c-route-resolver.ts</span>
          </span>
          <span className="text-[10px] text-slate-500">utf-8</span>
        </div>
        {/* Terminal Code Body */}
        <div className="p-4 space-y-1.5 text-slate-300 overflow-x-auto leading-relaxed">
          <div className="text-slate-500 italic">// Querying routing registry...</div>
          <div>
            <span className="text-purple-400">const</span>{' '}
            <span className="text-blue-300">target</span> ={' '}
            <span className="text-emerald-400">Router</span>.
            <span className="text-amber-300">matchRoute</span>(
            <span className="text-rose-300">&quot;{typeof window !== 'undefined' ? window.location.pathname : '/unknown'}&quot;</span>);
          </div>
          <div className="text-rose-400">
            <span className="text-purple-400">throw new</span>{' '}
            <span className="text-amber-400">RouteNotFoundException</span>(
            <span className="text-emerald-300">&apos;Destination unindexed&apos;</span>);
          </div>
          <div className="text-indigo-400/90 flex items-center gap-1 pt-1">
            <span className="text-emerald-400 font-bold">➜</span>
            <span className="animate-pulse">Solution: Select an active track below</span>
          </div>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto mb-12">
        <Link
          to="/"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Return to Safety</span>
        </Link>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white dark:bg-[#111A2E] hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span>Go Back</span>
        </button>

        {!isAuthenticated && (
          <Link
            to="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-sm transition-all cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </Link>
        )}
      </div>

      {/* Quick Explore Destination Cards */}
      <div className="w-full">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
          Popular Coding &amp; Placement Tracks
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left">
          <Link
            to="/practice"
            className="group p-4 rounded-2xl bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 hover:border-blue-500/60 dark:hover:border-blue-500/60 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Practice Problems
                </h3>
                <span className="text-[11px] text-slate-500">DSA &amp; Core Coding</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Solve algorithmic problems with real-time browser execution.
            </p>
          </Link>

          <Link
            to="/companies"
            className="group p-4 rounded-2xl bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500/60 dark:hover:border-indigo-500/60 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Company Catalog
                </h3>
                <span className="text-[11px] text-slate-500">50+ Top Recruiters</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Explore recruitment patterns for Google, Amazon, TCS &amp; more.
            </p>
          </Link>

          <Link
            to="/dsa-sheet"
            className="group p-4 rounded-2xl bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 hover:border-purple-500/60 dark:hover:border-purple-500/60 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  DSA Sheets
                </h3>
                <span className="text-[11px] text-slate-500">Topic-wise Roadmaps</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Step-by-step topic guides covering Arrays to Dynamic Programming.
            </p>
          </Link>

          <Link
            to="/aptitude"
            className="group p-4 rounded-2xl bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 hover:border-teal-500/60 dark:hover:border-teal-500/60 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  Aptitude Prep
                </h3>
                <span className="text-[11px] text-slate-500">Quantitative &amp; Logic</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Practice timed placement tests, reasoning, and verbal skills.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );

  // If embedded in a layout that already supplies navigation header and footer
  if (embedded) {
    return content;
  }

  // Full-page standalone 404
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-between font-sans bg-[#FBFBFD] dark:bg-[#070A13] text-slate-900 dark:text-slate-100 transition-colors duration-200 overflow-x-hidden relative">
      {/* Ambient background glows matching Platform Design */}
      <div className="fixed top-12 -left-48 w-96 h-[450px] bg-purple-600/15 dark:bg-purple-600/25 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed top-24 -right-48 w-96 h-[500px] bg-indigo-600/15 dark:bg-indigo-600/25 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed -bottom-20 left-1/3 w-96 h-[400px] bg-blue-600/10 dark:bg-blue-600/15 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Sleek Top Brand Bar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between z-20">
        <BrandLogo size="md" />
        <Link
          to="/"
          className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main Center Area */}
      <main className="w-full my-auto flex items-center justify-center">
        {content}
      </main>

      {/* Polished Footer */}
      <footer className="w-full py-6 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/80 z-20">
        © {new Date().getFullYear()} Connect 2 Code. Code Together, Connect Forever.
      </footer>
    </div>
  );
};

export default NotFound;
