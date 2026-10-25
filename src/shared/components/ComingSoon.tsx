import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

export interface ComingSoonHighlight {
  title: string;
  description: string;
  icon: string;
}

export interface ComingSoonProps {
  featureName?: string;
  category?: string;
  tagline?: string;
  icon?: string;
  highlights?: ComingSoonHighlight[];
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ featureName }) => {
  const { theme } = useTheme();
  const location = useLocation();
  const [emailInput, setEmailInput] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Determine current feature title
  const activeTitle = (() => {
    if (featureName) return featureName;
    const path = location.pathname.toLowerCase();
    if (path.includes('aptitude')) return 'Aptitude';
    if (path.includes('progress')) return 'Progress';
    if (path.includes('roadmap')) return 'Progress';
    if (path.includes('company-patterns')) return 'Company Patterns';
    return 'Feature';
  })();

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setIsSubscribed(true);
    toast.success(`You're on the early list! We'll notify you when ${activeTitle} launches.`);
    setEmailInput('');
  };

  const isDark = theme === 'dark';

  return (
    <div className="w-full flex flex-col items-center pb-20 font-sans bg-[#FFFFFF] dark:bg-[#070A13] text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-200 overflow-x-hidden">
      
      {/* Ambient glowing blobs on Left & Right Edges (Matching Home & Practice page) */}
      <div className="fixed top-24 -left-48 w-96 h-[400px] bg-purple-600/10 dark:bg-purple-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed top-40 -right-48 w-96 h-[500px] bg-indigo-600/10 dark:bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Main Container matching exact max-w-7xl width from Home and Practice page */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 pb-16">
        
        {/* Exact Match Artwork Container */}
        <div className="w-full relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0D1322] shadow-xs">
          
          {/* Hero Artwork Image matching attached reference image */}
          <div className="w-full flex items-center justify-center">
            <img
              src={isDark ? '/coming_soon_dark.jpg' : '/coming_soon_full.jpg'}
              alt={`${activeTitle} Coming Soon`}
              className="w-full h-auto object-contain select-none"
              loading="eager"
            />
          </div>
        </div>

        {/* Interactive Quick Access Bar & Early Access Signup at Bottom */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          
          {/* Notification Signup Card */}
          <div className="bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <i className="fa-regular fa-bell text-blue-600 dark:text-blue-400 text-sm"></i>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-heading">
                  Get notified when {activeTitle} launches
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Be the first to know when our new {activeTitle.toLowerCase()} feature is ready for practice.
              </p>
            </div>

            {isSubscribed ? (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                <i className="fa-solid fa-circle-check text-sm text-emerald-500"></i>
                <span>You're on the early access notification list!</span>
              </div>
            ) : (
              <form onSubmit={handleNotifySubmit} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 bg-slate-50 dark:bg-[#111A2E] border border-slate-200 dark:border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
                >
                  Notify Me
                </button>
              </form>
            )}
          </div>

          {/* Quick Links Card */}
          <div className="bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <i className="fa-solid fa-compass text-blue-600 dark:text-blue-400 text-sm"></i>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-heading">
                  In the meantime, start practicing
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Explore hundreds of curated DSA problems and previous-year company interview questions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                to="/practice"
                className="inline-flex items-center gap-2 bg-[#0B0F19] text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 font-semibold text-xs px-4.5 py-2.5 rounded-xl transition-all shadow-xs"
              >
                <i className="fa-solid fa-code text-xs"></i>
                <span>Solve DSA Problems</span>
              </Link>
              <Link
                to="/companies"
                className="inline-flex items-center gap-2 bg-slate-100 dark:bg-[#111A2E] text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-800 text-xs font-semibold px-4.5 py-2.5 rounded-xl transition-all"
              >
                <i className="fa-solid fa-building text-xs"></i>
                <span>Company Prep</span>
              </Link>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default ComingSoon;
