import React from 'react';
import { CompanyBrandLogo } from './CompanyBrandLogo';

export const CompanyHeroIllustration: React.FC = () => {
  return (
    <div className="relative w-full max-w-[340px] sm:max-w-[440px] lg:max-w-[480px] h-[210px] sm:h-[240px] flex items-center justify-center select-none pointer-events-none scale-[0.88] xs:scale-[0.95] sm:scale-100 origin-center transition-transform">
      {/* Soft Ambient Radial Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-200/40 via-blue-200/30 to-pink-200/25 dark:from-purple-900/25 dark:via-blue-900/20 dark:to-pink-900/15 rounded-full blur-2xl transform scale-95"></div>

      {/* Radiating 3 Burst Lines Doodle on Left (next to Google) \ | / */}
      <div className="absolute top-10 left-2 sm:left-4 z-20">
        <svg
          className="w-7 h-7 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M12 2v6" />
          <path d="M4 6l4.5 4.5" />
          <path d="M20 6l-4.5 4.5" />
        </svg>
      </div>

      {/* Radiating 3 Burst Lines Doodle on Right (next to Apple) / | \ */}
      <div className="absolute top-10 right-0 sm:right-2 z-20">
        <svg
          className="w-7 h-7 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M12 2v6" />
          <path d="M4 6l4.5 4.5" />
          <path d="M20 6l-4.5 4.5" />
        </svg>
      </div>

      {/* 1. Google Tile (Center-Left) */}
      <div
        className="absolute top-12 left-8 sm:left-12 w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 shadow-xl dark:shadow-blue-500/10 flex items-center justify-center p-3 transform -rotate-6 hover:scale-105 transition-transform"
        style={{ zIndex: 12 }}
      >
        <CompanyBrandLogo name="Google" className="w-9 h-9" />
      </div>

      {/* 2. Amazon Tile (Top-Center) */}
      <div
        className="absolute top-2 left-[125px] sm:left-[145px] w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 shadow-xl dark:shadow-amber-500/10 flex items-center justify-center p-3 transform rotate-6 hover:scale-105 transition-transform"
        style={{ zIndex: 11 }}
      >
        <CompanyBrandLogo name="Amazon" className="w-9 h-9 text-slate-900 dark:text-white" />
      </div>

      {/* 3. Microsoft Tile (Top-Right) */}
      <div
        className="absolute top-6 right-20 sm:right-24 w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 shadow-xl dark:shadow-emerald-500/10 flex items-center justify-center p-3 transform -rotate-3 hover:scale-105 transition-transform"
        style={{ zIndex: 10 }}
      >
        <CompanyBrandLogo name="Microsoft" className="w-8 h-8" />
      </div>

      {/* 4. Meta Tile (Bottom-Center) */}
      <div
        className="absolute bottom-2 left-[155px] sm:left-[180px] w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 shadow-xl dark:shadow-blue-600/15 flex items-center justify-center p-3 transform -rotate-6 hover:scale-105 transition-transform"
        style={{ zIndex: 14 }}
      >
        <CompanyBrandLogo name="Meta" className="w-9 h-9" />
      </div>

      {/* 5. Apple Tile (Far-Right) */}
      <div
        className="absolute top-12 right-2 sm:right-5 w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 shadow-xl dark:shadow-purple-500/10 flex items-center justify-center p-3 transform rotate-12 hover:scale-105 transition-transform"
        style={{ zIndex: 13 }}
      >
        <CompanyBrandLogo name="Apple" className="w-8 h-8 text-slate-900 dark:text-white" />
      </div>
    </div>
  );
};
