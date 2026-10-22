import React from 'react';

/** A reserved status line keeps refreshes and recoverable failures beside existing data. */
export const RequestStatus: React.FC<{
  pending?: boolean;
  error?: string | null;
  onRetry?: () => void;
  label?: string;
}> = ({ pending = false, error, onRetry, label = 'Updating results…' }) => {
  if (!pending && !error) {
    return null;
  }

  return (
    <div className="py-1 text-sm text-slate-600 dark:text-slate-300">
      <span role="status" aria-live="polite" aria-atomic="true">
        {pending ? <span className="loading-status">{label}</span> : error || ''}
      </span>
      {error && onRetry && (
        <button
          type="button"
          disabled={pending}
          onClick={onRetry}
          className="ml-3 rounded px-2 py-0.5 font-semibold text-blue-600 dark:text-blue-400 underline disabled:opacity-50 hover:text-blue-700"
        >
          Retry
        </button>
      )}
    </div>
  );
};
