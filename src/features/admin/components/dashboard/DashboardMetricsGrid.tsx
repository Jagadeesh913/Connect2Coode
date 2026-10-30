import React from 'react';
import { Skeleton } from '../../../../shared/components/ui/Skeleton';
import {
  Code2,
  ShieldCheck,
  Zap,
  Flame,
  Building2,
  GraduationCap,
  ListChecks,
  BookOpen,
} from 'lucide-react';

export interface DashboardStats {
  totalProblems: number | null;
  easyCount: number | null;
  mediumCount: number | null;
  hardCount: number | null;
  totalCompanies: number | null;
  totalInstitutions?: number | null;
  totalMcqs?: number | null;
  totalSheets?: number | null;
}

interface DashboardMetricsGridProps {
  stats: DashboardStats | null;
  loading: boolean;
}

export const DashboardMetricsGrid: React.FC<DashboardMetricsGridProps> = ({
  stats,
  loading,
}) => {
  const metricCards = [
    {
      label: 'DSA Problem Bank',
      value: stats?.totalProblems ?? null,
      description: 'Total indexed challenges',
      icon: Code2,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/50',
    },
    {
      label: 'Easy Tier',
      value: stats?.easyCount ?? null,
      description: 'Foundational problems',
      icon: ShieldCheck,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/50',
    },
    {
      label: 'Medium Tier',
      value: stats?.mediumCount ?? null,
      description: 'Intermediate challenges',
      icon: Zap,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/50',
    },
    {
      label: 'Hard Tier',
      value: stats?.hardCount ?? null,
      description: 'Advanced algorithms',
      icon: Flame,
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/50',
    },
    {
      label: 'Target Companies',
      value: stats?.totalCompanies ?? null,
      description: 'Active hiring partners',
      icon: Building2,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/50',
    },
    {
      label: 'Institutions',
      value: stats?.totalInstitutions ?? null,
      description: 'Colleges & Universities',
      icon: GraduationCap,
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-100 dark:border-cyan-900/50',
    },
    {
      label: 'MCQs & Aptitude',
      value: stats?.totalMcqs ?? null,
      description: 'Interview assessments',
      icon: ListChecks,
      color: 'text-violet-600 dark:text-violet-400',
      bgColor: 'bg-violet-50 dark:bg-violet-950/40 border-violet-100 dark:border-violet-900/50',
    },
    {
      label: 'DSA Sheets',
      value: stats?.totalSheets ?? null,
      description: 'Structured curricula',
      icon: BookOpen,
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-50 dark:bg-teal-950/40 border-teal-100 dark:border-teal-900/50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
      {metricCards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800/80 space-y-3 shadow-xs hover:shadow-md transition-all duration-200 text-left"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {card.label}
              </span>
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${card.bgColor} ${card.color}`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-20 rounded-lg" />
            ) : (
              <div className={`text-3xl font-extrabold tracking-tight ${card.color}`}>
                {card.value === null ? 'Unavailable' : card.value.toLocaleString()}
              </div>
            )}
            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              {card.description}
            </div>
          </div>
        );
      })}
    </div>
  );
};
