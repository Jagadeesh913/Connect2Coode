import React from 'react';
import { Link } from 'react-router-dom';

interface ProfileActivityCardProps {
  problemsSolved?: number;
  problemsAttempted?: number;
  bookmarksCount?: number;
  collegeName?: string;
}

export const ProfileActivityCard: React.FC<ProfileActivityCardProps> = ({
  problemsSolved = 0,
  problemsAttempted = 0,
  bookmarksCount = 0,
  collegeName,
}) => {
  return (
    <div className="bg-white dark:bg-neutral-900/90 rounded-2xl border border-gray-200 dark:border-white/10 p-5 shadow-sm font-sans space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">
            <i className="fa-solid fa-chart-line"></i>
          </div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Your Activity & Progress
          </h2>
        </div>
        <Link
          to="/practice"
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          <span>Practice</span>
          <i className="fa-solid fa-arrow-right text-[10px]"></i>
        </Link>
      </div>

      {/* 2x2 Activity Tiles - Driven exclusively by real user progress & bookmarks APIs */}
      <div className="grid grid-cols-2 gap-3">
        {/* Problems Solved */}
        <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100/80 dark:border-emerald-500/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm shrink-0">
            <i className="fa-solid fa-circle-check"></i>
          </div>
          <div>
            <p className="text-base font-extrabold text-gray-900 dark:text-white leading-tight">
              {problemsSolved}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
              Solved
            </p>
          </div>
        </div>

        {/* Problems Attempted */}
        <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100/80 dark:border-blue-500/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm shrink-0">
            <i className="fa-solid fa-code"></i>
          </div>
          <div>
            <p className="text-base font-extrabold text-gray-900 dark:text-white leading-tight">
              {problemsAttempted}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
              Attempted
            </p>
          </div>
        </div>

        {/* Bookmarks */}
        <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-100/80 dark:border-amber-500/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm shrink-0">
            <i className="fa-solid fa-bookmark"></i>
          </div>
          <div>
            <p className="text-base font-extrabold text-gray-900 dark:text-white leading-tight">
              {bookmarksCount}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
              Bookmarks
            </p>
          </div>
        </div>

        {/* College Affiliation */}
        <div className="p-3.5 rounded-xl bg-purple-50/50 dark:bg-purple-500/5 border border-purple-100/80 dark:border-purple-500/10 flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-sm shrink-0">
            <i className="fa-solid fa-graduation-cap"></i>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight truncate">
              {collegeName || 'Affiliated'}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
              Institution
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
