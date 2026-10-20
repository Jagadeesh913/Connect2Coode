import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { examPatternsData } from '../data/examPatternsData';

export const CompanyPatterns: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredPatterns = useMemo(() => {
    return examPatternsData.filter((pattern) => {
      const q = searchQuery.toLowerCase();
      const cleanRoles = pattern.roles;
      return (
        pattern.name.toLowerCase().includes(q) ||
        pattern.fullName.toLowerCase().includes(q) ||
        cleanRoles.toLowerCase().includes(q) ||
        pattern.logoTag.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  return (
    <div className="w-full flex flex-col items-center font-sans pb-20">
      
      {/* 1. HERO HEADER SECTION - DSA Sheet Page Theme */}
      <section id="patternsHero" className="relative mx-auto mt-16 max-w-7xl px-6 text-center md:px-8 flex flex-col items-center w-full">
        <h1 className="animate-fade-in -translate-y-4 text-balance break-words sm:whitespace-nowrap bg-gradient-to-br from-white from-30% to-white/40 bg-clip-text py-6 text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-medium leading-none tracking-tighter text-transparent opacity-100 font-heading">
          Company Placement Exam Patterns
        </h1>
        <p className="animate-fade-in mb-6 -translate-y-4 text-balance text-lg tracking-tight text-gray-400 opacity-100 md:text-xl font-sans">
          Official recruitment exam patterns, section timing breakdowns &amp; complete syllabus
        </p>

        {/* DSA Sheet Page Gradient Divider */}
        <div className="flex justify-center mb-4">
          <div className="shrink-0 bg-white/10 h-0.5 rounded-lg w-60 bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#C084FC]"></div>
        </div>
      </section>

      {/* 2. SEARCH BAR - DSA Sheet Theme */}
      <div className="w-full max-w-5xl px-4 mt-6 mb-8 flex flex-col items-center">
        <div className="relative w-full sm:w-96">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs"></i>
          <input
            type="text"
            placeholder="Search company or exam pattern..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-800 border border-white/10 text-xs text-gray-200 placeholder-gray-500 rounded-xl pl-10 pr-10 py-2.5 outline-none focus:border-white/30 transition-colors shadow-md"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>
      </div>

      {/* 3. CLEAN COMPANY PATTERNS GRID - DSA Sheet Theme */}
      {filteredPatterns.length === 0 ? (
        <div className="w-full max-w-md my-12 p-8 text-center bg-neutral-800 border border-white/10 rounded-lg flex flex-col items-center gap-3">
          <i className="fa-solid fa-building-circle-xmark text-3xl text-gray-500"></i>
          <h3 className="text-base font-bold text-white font-heading">No company patterns found</h3>
          <p className="text-xs text-gray-400 font-sans">Try adjusting your search query.</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-2 text-xs font-bold text-[#38BDF8] underline cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="w-full max-w-5xl px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatterns.map((comp) => {
            // Clean roles string by stripping LPA package numbers
            const cleanRoles = comp.roles;

            return (
              <div
                key={comp.id}
                className="p-5 transition-all duration-200 bg-neutral-800 hover:bg-neutral-800 border border-white/10 hover:border-white/30 rounded-lg shadow-md flex flex-col justify-between group relative overflow-hidden"
              >
                <div>
                  {/* Brand Logo ICON/IMAGE + Title */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-white/10 p-1.5 flex items-center justify-center shrink-0 shadow-sm group-hover:border-white/30 transition-colors">
                      <img
                        src={comp.logoUrl}
                        alt={comp.name}
                        className="w-full h-full object-contain rounded"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                          const parent = (e.target as HTMLElement).parentElement;
                          if (parent) {
                            const fallback = parent.querySelector('.logo-fallback') as HTMLElement;
                            if (fallback) fallback.style.display = 'grid';
                          }
                        }}
                      />
                      <span className="logo-fallback hidden w-full h-full place-items-center text-xs font-black text-white font-mono">
                        {comp.logoTag}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white font-heading group-hover:text-gray-200 transition-colors truncate">
                      {comp.name}
                    </h3>
                  </div>

                  {/* Role Subtitle Text - WITHOUT LPA PACKAGE AMOUNT */}
                  <p className="text-xs text-gray-400 line-clamp-2 mb-4 font-sans leading-relaxed">
                    {cleanRoles}
                  </p>

                  {/* Quick Info Stat Chips */}
                  <div className="grid grid-cols-2 gap-2 mb-4 text-xs font-mono text-gray-300">
                    <div className="bg-neutral-900 border border-white/10 p-2 rounded-lg flex items-center gap-2">
                      <i className="fa-regular fa-clock text-[#38BDF8] text-xs"></i>
                      <span className="truncate">{comp.duration}</span>
                    </div>
                    <div className="bg-neutral-900 border border-white/10 p-2 rounded-lg flex items-center gap-2">
                      <i className="fa-solid fa-list-check text-[#818CF8] text-xs"></i>
                      <span className="truncate">{comp.questionsCount.split(' ')[0]} Qs</span>
                    </div>
                  </div>

                  {/* Section Tag Chips */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {comp.quickSections.map((sec, idx) => (
                      <span key={idx} className="text-[10px] font-mono text-gray-400 bg-neutral-900 border border-white/10 px-2 py-0.5 rounded">
                        {sec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* TWO BUTTONS SIDE-BY-SIDE: Explore Exam Pattern | Practice */}
                <div className="pt-3.5 border-t border-white/10 flex items-center gap-2">
                  <Link
                    to={`/company-patterns/${comp.slug}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-neutral-900 border border-white/10 hover:border-white/30 hover:bg-white/10 py-2 px-3 text-xs font-semibold text-white transition-all font-sans shadow-xs"
                  >
                    <span>Explore Exam Pattern</span>
                    <i className="fa-solid fa-arrow-right text-[10px] text-gray-400"></i>
                  </Link>

                  <Link
                    to={`/companies/${comp.companySlug || comp.slug}`} state={{ from: 'company-patterns' }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-neutral-100 text-neutral-900 hover:bg-neutral-200 py-2 px-3.5 text-xs font-bold text-black transition-all font-sans shadow-xs shrink-0"
                  >
                    <i className="fa-solid fa-code text-[10px] text-black"></i>
                    <span>Practice</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
