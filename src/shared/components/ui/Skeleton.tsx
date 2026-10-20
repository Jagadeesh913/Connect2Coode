import React from 'react';

export interface SkeletonProps {
  className?: string;
  count?: number;
}

/**
 * Base Shimmer Skeleton Element
 * Uses GPU-accelerated theme-adaptive shimmer sweep (slate-200 in light, slate-800 in dark)
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '', count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={`skeleton-${idx}`}
          className={`shimmer-wave rounded-md ${className}`}
        />
      ))}
    </>
  );
};

export interface TableRowSkeletonProps {
  rows?: number;
  showExamPlatform?: boolean;
  showCompanies?: boolean;
  showTopic?: boolean;
  showDifficulty?: boolean;
}

/**
 * Realistic Table Row Skeleton for Problem and Company Question Tables
 */
export const TableRowSkeleton: React.FC<TableRowSkeletonProps> = ({
  rows = 6,
  showExamPlatform = true,
  showCompanies = true,
  showTopic = true,
  showDifficulty = true,
}) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr
          key={`table-skeleton-row-${i}`}
          className="border-b border-slate-100 dark:border-slate-800/60"
        >
          {/* Row # */}
          <td className="py-3.5 px-4 text-center">
            <Skeleton className="h-4 w-5 mx-auto rounded" />
          </td>

          {/* Title */}
          <td className="py-3.5 px-4 min-w-[200px]">
            <div className="flex flex-col gap-1.5">
              <Skeleton className={`h-4 ${i % 3 === 0 ? 'w-72' : i % 3 === 1 ? 'w-96' : 'w-80'} rounded-md`} />
              <Skeleton className="h-2.5 w-32 rounded-sm opacity-60" />
            </div>
          </td>

          {/* Topic */}
          {showTopic && (
            <td className="py-3.5 px-4">
              <Skeleton className="h-5 w-20 rounded-full" />
            </td>
          )}

          {/* Difficulty Badge */}
          {showDifficulty && (
            <td className="py-3.5 px-4 text-center">
              <Skeleton className="h-5 w-16 mx-auto rounded-full" />
            </td>
          )}

          {/* Exam Platform / Acceptance */}
          {showExamPlatform && (
            <td className="py-3.5 px-4">
              <Skeleton className="h-4 w-20 rounded-md" />
            </td>
          )}

          {/* Companies / Status */}
          {showCompanies && (
            <td className="py-3.5 px-4 whitespace-nowrap">
              <div className="flex items-center gap-1.5">
                <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                <Skeleton className="w-7 h-7 rounded-full shrink-0" />
              </div>
            </td>
          )}

          {/* Bookmark */}
          <td className="py-3.5 px-2 text-center">
            <Skeleton className="h-6 w-6 mx-auto rounded-full" />
          </td>

          {/* Action Button */}
          <td className="py-3.5 px-4 text-right">
            <Skeleton className="h-7 w-16 ml-auto rounded-lg" />
          </td>
        </tr>
      ))}
    </>
  );
};

export interface CompanyCardSkeletonProps {
  count?: number;
}

/**
 * Realistic Company Card Skeleton matching CompanyList grid cards
 */
export const CompanyCardSkeleton: React.FC<CompanyCardSkeletonProps> = ({ count = 8 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`company-card-skeleton-${i}`}
          className="bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-[230px]"
        >
          <div>
            {/* Top row: Logo Box + Bookmark */}
            <div className="flex items-center justify-between">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <Skeleton className="w-8 h-8 rounded-xl" />
            </div>

            {/* Name & Questions count */}
            <div className="mt-4 flex flex-col gap-2">
              <Skeleton className={`h-5 ${i % 2 === 0 ? 'w-36' : 'w-28'} rounded-lg`} />
              <Skeleton className="h-3.5 w-20 rounded-md" />
            </div>

            {/* Tags row */}
            <div className="mt-3 flex items-center gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>

          {/* Bottom explore button */}
          <Skeleton className="h-9 w-full rounded-xl mt-3" />
        </div>
      ))}
    </>
  );
};

/**
 * Realistic Company Details Page Skeleton
 */
export const CompanyDetailsSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 flex flex-col gap-6 animate-fade-in">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-12 rounded" />
        <span className="text-slate-300 dark:text-slate-700">&gt;</span>
        <Skeleton className="h-4 w-24 rounded" />
        <span className="text-slate-300 dark:text-slate-700">&gt;</span>
        <Skeleton className="h-4 w-28 rounded" />
      </div>

      {/* Hero Header Card Skeleton */}
      <div className="bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full">
          <Skeleton className="w-20 h-20 rounded-2xl shrink-0" />
          <div className="flex flex-col gap-2.5 w-full max-w-xl">
            <Skeleton className="h-8 sm:h-9 w-56 rounded-xl" />
            <Skeleton className="h-4 w-full max-w-md rounded-md" />
            <div className="flex items-center gap-2.5 mt-2">
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        </div>
        <div className="hidden lg:flex shrink-0">
          <Skeleton className="w-48 h-32 rounded-2xl" />
        </div>
      </div>

      {/* Tabs Row Skeleton */}
      <div className="border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-8 pb-3">
        <Skeleton className="h-7 w-24 rounded-lg" />
        <Skeleton className="h-7 w-28 rounded-lg" />
        <Skeleton className="h-7 w-36 rounded-lg" />
        <Skeleton className="h-7 w-24 rounded-lg" />
      </div>

      {/* Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Search Bar + Table Skeleton */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <div className="flex items-center gap-2 overflow-x-hidden">
            <Skeleton className="h-8 w-20 rounded-full shrink-0" />
            <Skeleton className="h-8 w-24 rounded-full shrink-0" />
            <Skeleton className="h-8 w-28 rounded-full shrink-0" />
            <Skeleton className="h-8 w-20 rounded-full shrink-0" />
          </div>

          <div className="bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
                  <th className="py-3 px-4 w-12"><Skeleton className="h-3 w-4 mx-auto rounded" /></th>
                  <th className="py-3 px-4"><Skeleton className="h-3 w-16 rounded" /></th>
                  <th className="py-3 px-4"><Skeleton className="h-3 w-12 rounded" /></th>
                  <th className="py-3 px-4 text-center"><Skeleton className="h-3 w-16 mx-auto rounded" /></th>
                  <th className="py-3 px-4 text-center"><Skeleton className="h-3 w-20 mx-auto rounded" /></th>
                  <th className="py-3 px-4 text-center"><Skeleton className="h-3 w-14 mx-auto rounded" /></th>
                  <th className="py-3 px-2 w-10"></th>
                  <th className="py-3 px-4 w-24 text-right"><Skeleton className="h-3 w-12 ml-auto rounded" /></th>
                </tr>
              </thead>
              <tbody>
                <TableRowSkeleton rows={6} showExamPlatform={false} showCompanies={false} />
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: About Card + Popular Topics Skeleton */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-xl" />
              <Skeleton className="h-5 w-32 rounded-lg" />
            </div>
            <Skeleton className="h-16 w-full rounded-xl" />
            <div className="flex flex-col gap-3 pt-2">
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col gap-4">
            <Skeleton className="h-5 w-32 rounded-lg" />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-6 w-full rounded-lg" />
              <Skeleton className="h-6 w-full rounded-lg" />
              <Skeleton className="h-6 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export interface AptitudeQuestionSkeletonProps {
  count?: number;
}

/**
 * Realistic Aptitude / MCQ Card Skeleton matching AptitudePrep layout
 */
export const AptitudeQuestionSkeleton: React.FC<AptitudeQuestionSkeletonProps> = ({ count = 5 }) => {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`aptitude-skeleton-${i}`}
          className="bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col gap-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-24 rounded-md" />
              <Skeleton className="h-5 w-20 rounded-md" />
            </div>
            <Skeleton className="h-4 w-16 rounded-md" />
          </div>

          {/* Question Text */}
          <div className="flex flex-col gap-2">
            <Skeleton className={`h-5 ${i % 2 === 0 ? 'w-full' : 'w-4/5'} rounded-lg`} />
            <Skeleton className="h-5 w-2/3 rounded-lg" />
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-8 w-28 rounded-xl" />
              <Skeleton className="h-8 w-24 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export interface BookmarkItemSkeletonProps {
  count?: number;
}

/**
 * Realistic Bookmark Item Skeleton matching BookmarksList cards
 */
export const BookmarkItemSkeleton: React.FC<BookmarkItemSkeletonProps> = ({ count = 4 }) => {
  return (
    <div className="flex flex-col gap-3.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`bookmark-skeleton-${i}`}
          className="p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0D1322] rounded-2xl flex items-center justify-between gap-4 shadow-xs"
        >
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <Skeleton className={`h-4 ${i % 2 === 0 ? 'w-64' : 'w-48'} rounded-md`} />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-16 rounded-full" />
                <Skeleton className="h-4 w-20 rounded-md" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Skeleton className="h-8 w-16 rounded-xl" />
            <Skeleton className="w-8 h-8 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Realistic Profile Page Skeleton matching ProfileSettings
 */
export const ProfilePageSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-12 rounded" />
        <span className="text-slate-300 dark:text-slate-700">&gt;</span>
        <Skeleton className="h-4 w-20 rounded" />
      </div>

      {/* Hero Banner Skeleton */}
      <div className="bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Skeleton className="w-20 h-20 rounded-2xl shrink-0" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-48 rounded-xl" />
            <Skeleton className="h-4 w-36 rounded-md" />
            <Skeleton className="h-4 w-28 rounded-md mt-1" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-28 rounded-2xl" />
          <Skeleton className="h-16 w-28 rounded-2xl" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-28 rounded-xl" />
        <Skeleton className="h-10 w-28 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Grid Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 flex flex-col gap-4">
            <Skeleton className="h-6 w-40 rounded-lg" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
        </div>
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Skeleton className="h-48 w-full rounded-3xl" />
        </div>
      </div>
    </div>
  );
};

