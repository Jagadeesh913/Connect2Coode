import React from 'react';

export const DsaSheetHeroBanner: React.FC = () => (
  <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-6">
    <div className="w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800/80 bg-slate-100 dark:bg-[#050D1D]">
      <img
        src="/dsa_sheet_banner_light.png?v=2"
        alt="DSA Sheet. Build Your Skills."
        className="w-full h-auto block dark:hidden object-cover select-none pointer-events-none"
      />
      <img
        src="/dsa_sheet_banner_dark.png?v=2"
        alt="DSA Sheet. Build Your Skills."
        className="w-full h-auto hidden dark:block object-cover select-none pointer-events-none"
      />
    </div>
  </section>
);
