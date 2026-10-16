import React from 'react';

export const PracticeHeroBanner: React.FC = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-4 sm:pb-6">
      <div className="w-full relative rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-r from-[#EEF4FF] via-[#F8FAFF] to-[#F2F4FE] dark:from-[#060A14] dark:via-[#090F22] dark:to-[#12132C] shadow-sm transition-colors duration-200">
        
        {/* Soft Ambient Light/Dark Glows */}
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-blue-300/25 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-16 -translate-y-1/2 w-80 h-80 bg-purple-300/25 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-64 h-64 bg-indigo-300/20 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Content Grid */}
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 px-6 sm:px-10 lg:px-14 py-8 sm:py-10 md:py-12">
          
          {/* Left Column: Typography */}
          <div className="flex-1 max-w-xl text-left select-none">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3 sm:mb-4">
              Aptitude{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                Practice
              </span>
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-300/90 leading-relaxed font-normal">
              Choose a section and practice aptitude questions with real exam patterns to sharpen your speed, accuracy and problem solving skills.
            </p>
          </div>

          {/* Right Column: 3D Illustration with Floating Badges */}
          <div className="relative shrink-0 flex items-center justify-center select-none pointer-events-none min-w-[280px] sm:min-w-[340px] md:min-w-[400px] h-36 sm:h-44 md:h-52">
            
            {/* 1. Cyan-Blue Calculator Badge (Top-Left) */}
            <div className="absolute top-2 left-6 sm:left-10 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-500/90 dark:bg-blue-500/20 dark:border dark:border-blue-400/60 text-white dark:text-blue-300 flex items-center justify-center shadow-md dark:shadow-[0_0_15px_rgba(59,130,246,0.6)] transform -rotate-6 animate-pulse">
              <i className="fa-solid fa-calculator text-xs sm:text-sm"></i>
            </div>

            {/* 2. Neon Purple Bar Chart Badge (Top-Center-Left) */}
            <div className="absolute -top-1 left-32 sm:left-40 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-600/90 dark:bg-purple-500/20 dark:border dark:border-purple-400/60 text-white dark:text-purple-300 flex items-center justify-center shadow-md dark:shadow-[0_0_15px_rgba(168,85,247,0.6)] transform rotate-3">
              <i className="fa-solid fa-chart-simple text-xs sm:text-sm"></i>
            </div>

            {/* 3. Golden Amber Lightbulb Badge (Top-Center-Right) */}
            <div className="absolute top-0 right-20 sm:right-28 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-400/90 dark:bg-amber-500/20 dark:border dark:border-amber-400/60 text-slate-900 dark:text-amber-300 flex items-center justify-center shadow-md dark:shadow-[0_0_15px_rgba(245,158,11,0.6)] transform rotate-6">
              <i className="fa-solid fa-lightbulb text-xs sm:text-sm"></i>
            </div>

            {/* 4. Neon Pink Target/Sparkle Badge (Top-Right) */}
            <div className="absolute top-4 right-6 sm:right-10 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-500/90 dark:bg-rose-500/20 dark:border dark:border-rose-400/60 text-white dark:text-rose-300 flex items-center justify-center shadow-md dark:shadow-[0_0_15px_rgba(244,63,94,0.6)] transform -rotate-3">
              <i className="fa-solid fa-bullseye text-xs sm:text-sm"></i>
            </div>

            {/* Burst Sparks above the Easel */}
            <div className="absolute top-3 left-[52%] -translate-x-1/2 z-10 text-slate-400 dark:text-indigo-400/70 text-xs sm:text-sm">
              <i className="fa-solid fa-wand-magic-sparkles"></i>
            </div>

            {/* 3D Desk Notes Illustration */}
            <img
              src="/aptitude_hero_illustration.png"
              alt="Aptitude Practice"
              className="h-28 sm:h-36 md:h-44 w-auto object-contain drop-shadow-md z-10 transition-transform duration-300"
            />
          </div>

        </div>

      </div>
    </section>
  );
};
