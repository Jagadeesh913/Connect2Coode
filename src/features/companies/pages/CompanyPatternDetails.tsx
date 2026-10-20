import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { examPatternsData } from '../data/examPatternsData';
import { EmptyState } from '../../../shared/components/ui/EmptyState';

export const CompanyPatternDetails: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [activeTab, setActiveTab] = useState<'breakdown' | 'syllabus' | 'stages' | 'strategy'>('breakdown');

  const foundPattern = examPatternsData.find((p) => p.slug === slug || p.companySlug === slug);

  if (!foundPattern) {
    return (
      <div className="w-full max-w-5xl mx-auto py-16 px-4">
        <EmptyState
          title="Exam pattern not found"
          description="This company exam pattern is not available in the product data yet. No fallback pattern is shown."
          actionText="Back to Exam Patterns"
          onAction={() => window.history.back()}
        />
      </div>
    );
  }

  const pattern: any = foundPattern;
  const cleanRoles = pattern.roles || 'Software Engineer & Technical Roles';

  const safeArray = (data: any) => {
    if (Array.isArray(data)) return data;
    if (typeof data === 'string' && data.trim()) return [{ title: 'Overview', description: data }];
    return [];
  };

  const stagesList = safeArray(pattern.stages || pattern.recruitmentStages);

  return (
    <div className="w-full flex flex-col items-center font-sans pb-20">
      
      <div className="w-full max-w-5xl px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* NAV & BREADCRUMB */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/company-patterns"
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-300 hover:text-white transition-all bg-neutral-800 border border-white/10 hover:border-white/30 px-4 py-2 rounded-lg shadow-md"
          >
            <i className="fa-solid fa-arrow-left text-xs text-gray-400"></i>
            <span>Back to Exam Patterns</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-gray-300 bg-neutral-800 border border-white/10 px-3 py-1.5 rounded-lg font-bold">
              {pattern.category || 'Exam Pattern'}
            </span>
            <Link
              to={`/companies/${pattern.companySlug || pattern.slug}`} state={{ from: 'company-patterns' }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-black bg-neutral-100 text-neutral-900 hover:bg-neutral-200 px-3.5 py-1.5 rounded-lg transition-all shadow-xs"
            >
              <i className="fa-solid fa-code text-[10px] text-black"></i>
              <span>Practice Questions</span>
            </Link>
          </div>
        </div>

        {/* HERO CARD CONTAINER - DSA Sheet Aesthetics */}
        <div className="rounded-lg p-6 sm:p-8 bg-neutral-800 border border-white/10 shadow-md mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-lg bg-white p-2.5 flex items-center justify-center border border-white/10 shrink-0 overflow-hidden">
                <img
                  src={pattern.logoUrl}
                  alt={pattern.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLElement;
                    target.style.display = 'none';
                    if (target.nextElementSibling) {
                      (target.nextElementSibling as HTMLElement).style.display = 'flex';
                    }
                  }}
                />
                <span className="hidden w-full h-full place-items-center text-sm font-black text-black font-mono">
                  {pattern.logoTag || 'EXAM'}
                </span>
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white font-heading tracking-tight break-words mb-1">
                  {pattern.fullName || pattern.name}
                </h1>
                <p className="text-xs sm:text-sm text-gray-400 font-sans">
                  {cleanRoles}
                </p>
              </div>
            </div>

            {/* Quick Stat Badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="bg-neutral-900 border border-white/10 px-3.5 py-2 rounded-lg text-xs font-mono text-gray-300">
                <span className="text-gray-400 block text-[10px] uppercase">Duration</span>
                <span className="font-bold text-white">{pattern.duration || '180 Mins'}</span>
              </div>
              <div className="bg-neutral-900 border border-white/10 px-3.5 py-2 rounded-lg text-xs font-mono text-gray-300">
                <span className="text-gray-400 block text-[10px] uppercase">Total Questions</span>
                <span className="font-bold text-white">{pattern.questionsCount || '100+'}</span>
              </div>
            </div>

          </div>
        </div>

        {/* SEGMENTED TAB NAVIGATION */}
        <div className="flex items-center gap-2 bg-neutral-800 p-1.5 rounded-lg border border-white/10 shadow-md mb-8 overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-700">
          {(
            [
              { id: 'breakdown', label: 'Section Breakdown', icon: 'fa-solid fa-list-check' },
              { id: 'syllabus', label: 'Detailed Syllabus', icon: 'fa-solid fa-book-bookmark' },
              { id: 'stages', label: 'Selection Rounds', icon: 'fa-solid fa-layer-group' },
              { id: 'strategy', label: 'Preparation Strategy', icon: 'fa-solid fa-chess' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-neutral-100 text-neutral-900 text-black shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <i className={`${tab.icon} text-xs`}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB CONTENTS */}
        {activeTab === 'breakdown' && (
          <div className="bg-neutral-800 border border-white/10 rounded-lg p-6 shadow-md flex flex-col gap-4">
            <h2 className="text-lg font-bold text-white font-heading mb-2">Pattern Section Breakdown</h2>
            <div className="grid grid-cols-1 gap-3">
              {safeArray(pattern.sections).map((sec: any, idx: number) => (
                <div key={sec.num || idx} className="bg-neutral-900 border border-white/10 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-white font-heading">{sec.name || `Section ${idx + 1}`}</h4>
                    <p className="text-xs text-gray-400 font-sans mt-0.5">{sec.questions || '20 Questions'} • {sec.time || '30 Mins'} • Marking: {sec.marking || '+1 / 0'}</p>
                  </div>
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-white/5 border border-white/10 text-gray-300 self-start sm:self-auto">
                    {sec.difficulty || 'Medium'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'syllabus' && (
          <div className="bg-neutral-800 border border-white/10 rounded-lg p-6 shadow-md flex flex-col gap-4">
            <h2 className="text-lg font-bold text-white font-heading mb-2">Exam Syllabus & Topics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {safeArray(pattern.syllabus).map((cat: any, idx: number) => (
                <div key={idx} className="bg-neutral-900 border border-white/10 p-4 rounded-lg">
                  <h4 className="text-sm font-bold text-white font-heading mb-2">{cat.title || `Category ${idx + 1}`}</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {safeArray(cat.topics).map((t: any, tIdx: number) => {
                      const topicName = typeof t === 'string' ? t : (t.name || t.title || 'Topic');
                      return (
                        <span key={tIdx} className="text-xs font-sans text-gray-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                          {topicName}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'stages' && (
          <div className="bg-neutral-800 border border-white/10 rounded-lg p-6 shadow-md flex flex-col gap-4">
            <h2 className="text-lg font-bold text-white font-heading mb-2">Selection Rounds & Process</h2>
            <div className="flex flex-col gap-3">
              {stagesList.map((stage: any, idx: number) => {
                const stepNum = stage.step || (idx + 1);
                const title = stage.title || `Round ${stepNum}`;
                const roundType = stage.roundType ? ` (${stage.roundType})` : '';
                const description = stage.description || '';

                return (
                  <div key={idx} className="bg-neutral-900 border border-white/10 p-4 rounded-lg flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-white/10 flex items-center justify-center shrink-0 text-xs font-mono font-bold text-neutral-300">
                      {stepNum}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white font-heading">{title}{roundType}</h4>
                      <p className="text-xs text-gray-400 font-sans mt-1 leading-relaxed">{description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'strategy' && (
          <div className="bg-neutral-800 border border-white/10 rounded-lg p-6 shadow-md flex flex-col gap-6">
            <h2 className="text-lg font-bold text-white font-heading mb-2">Preparation Strategy & Cutoff Insights</h2>
            
            {pattern.prepStrategy && typeof pattern.prepStrategy === 'object' && !Array.isArray(pattern.prepStrategy) ? (
              <div className="flex flex-col gap-4">
                {pattern.prepStrategy.cutoffInsight && (
                  <div className="p-4 bg-neutral-900 border border-neutral-700 rounded-xl text-xs sm:text-sm text-gray-200">
                    <span className="font-bold text-neutral-300 block mb-1">Target Cutoff Insight:</span>
                    <p className="text-gray-300 leading-relaxed font-sans">{pattern.prepStrategy.cutoffInsight}</p>
                  </div>
                )}

                {pattern.prepStrategy.doList && safeArray(pattern.prepStrategy.doList).length > 0 && (
                  <div className="p-4 bg-neutral-900 border border-emerald-500/20 rounded-xl">
                    <h4 className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider mb-2">Recommended Do's</h4>
                    <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-gray-300">
                      {safeArray(pattern.prepStrategy.doList).map((item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {pattern.prepStrategy.dontList && safeArray(pattern.prepStrategy.dontList).length > 0 && (
                  <div className="p-4 bg-neutral-900 border border-rose-500/20 rounded-xl">
                    <h4 className="text-xs font-bold font-mono text-rose-400 uppercase tracking-wider mb-2">Things to Avoid</h4>
                    <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-gray-300">
                      {safeArray(pattern.prepStrategy.dontList).map((item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {safeArray(pattern.prepStrategy).map((strat: any, idx: number) => {
                  const title = typeof strat === 'string' ? `Strategy ${idx + 1}` : (strat.title || `Strategy ${idx + 1}`);
                  const description = typeof strat === 'string' ? strat : (strat.description || '');

                  return (
                    <div key={idx} className="bg-neutral-900 border border-white/10 p-4 rounded-lg">
                      <h4 className="text-sm font-bold text-white font-heading mb-1">{title}</h4>
                      <p className="text-xs text-gray-400 font-sans leading-relaxed">{description}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
