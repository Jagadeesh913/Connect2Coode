import React from 'react';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '../../../shared/components/ui/Skeleton';

interface AdminLoadingProps {
  message?: string;
  rows?: number;
}

export const AdminLoading: React.FC<AdminLoadingProps> = ({
  message = 'Loading platform data...',
  rows = 5,
}) => {
  return (
    <div role="status" aria-label={message} aria-busy="true" className="w-full flex flex-col gap-4 p-6 bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs font-sans">
      <div className="flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
        <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
          {message}
        </span>
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="space-y-2 mt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
};
