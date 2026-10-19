import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface AdminErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const AdminErrorState: React.FC<AdminErrorStateProps> = ({
  title = 'Failed to load Admin data',
  message = 'An unexpected server error occurred. Please verify your connection or retry.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`w-full flex flex-col items-center justify-center text-center p-8 bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl my-4 font-sans ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1 tracking-tight">
        {title}
      </h4>
      <p className="text-xs sm:text-sm text-rose-600 dark:text-rose-300/90 max-w-md mb-5 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs hover:shadow-sm transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Request</span>
        </button>
      )}
    </div>
  );
};
