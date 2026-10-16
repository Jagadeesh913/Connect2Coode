import React from 'react';
import { Skeleton } from '../../../../shared/components/ui/Skeleton';

interface DashboardMetricsGridProps {
  stats: {
    totalProblems: number;
    easyCount: number;
    mediumCount: number;
    hardCount: number;
    totalCompanies: number;
  } | null;
  loading: boolean;
}

export const DashboardMetricsGrid: React.FC<DashboardMetricsGridProps> = ({
  stats,
  loading,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 font-sans">
      {/* Card 1: Total Problems */}
      <div className="p-5 rounded-2xl bg-neutral-900 border border-white/10 space-y-3 shadow-xl text-left">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Total Question Bank
          </span>
          <div className="w-9 h-9 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-300 flex items-center justify-center">
            <i className="fa-solid fa-code text-sm" />
          </div>
        </div>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-3xl font-extrabold text-white font-heading">
            {stats?.totalProblems ?? 0}
          </div>
        )}
        <div className="text-[11px] text-gray-500">Live indexed DSA problems</div>
      </div>

      {/* Card 2: Easy Difficulty */}
      <div className="p-5 rounded-2xl bg-neutral-900 border border-white/10 space-y-3 shadow-xl text-left">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Easy Tier Problems
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <i className="fa-solid fa-shield-halved text-sm" />
          </div>
        </div>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-3xl font-extrabold text-emerald-400 font-heading">
            {stats?.easyCount ?? 0}
          </div>
        )}
        <div className="text-[11px] text-gray-500">Basic &amp; Easy tier problems</div>
      </div>

      {/* Card 3: Medium Difficulty */}
      <div className="p-5 rounded-2xl bg-neutral-900 border border-white/10 space-y-3 shadow-xl text-left">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Medium Tier Problems
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <i className="fa-solid fa-bolt text-sm" />
          </div>
        </div>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-3xl font-extrabold text-amber-400 font-heading">
            {stats?.mediumCount ?? 0}
          </div>
        )}
        <div className="text-[11px] text-gray-500">Medium difficulty tier</div>
      </div>

      {/* Card 4: Target Companies */}
      <div className="p-5 rounded-2xl bg-neutral-900 border border-white/10 space-y-3 shadow-xl text-left">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Target Companies
          </span>
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <i className="fa-solid fa-building text-sm" />
          </div>
        </div>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-3xl font-extrabold text-indigo-400 font-heading">
            {stats?.totalCompanies ?? 0}
          </div>
        )}
        <div className="text-[11px] text-gray-500">Configured hiring partners</div>
      </div>
    </div>
  );
};
