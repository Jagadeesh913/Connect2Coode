import React from 'react';
import { Inbox } from 'lucide-react';

interface AdminEmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const AdminEmptyState: React.FC<AdminEmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = '',
}) => {
  return (
    <div
      className={`w-full flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-slate-50/70 dark:bg-[#0D1322]/60 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl my-4 font-sans transition-colors ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 shadow-xs">
        {icon || <Inbox className="w-7 h-7" />}
      </div>
      <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-1">
        {title}
      </h4>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
};
