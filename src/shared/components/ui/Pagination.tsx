import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalElements?: number;
  pageSize?: number;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalElements,
  pageSize,
  className = '',
}) => {
  const safeTotalPages = Math.max(1, totalPages || 1);
  const safeCurrentPage = Math.min(Math.max(1, currentPage || 1), safeTotalPages);

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (safeTotalPages <= 7) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
    }
    const pages: (number | 'ellipsis')[] = [1];
    let start = Math.max(2, safeCurrentPage - 1);
    let end = Math.min(safeTotalPages - 1, safeCurrentPage + 1);

    if (safeCurrentPage <= 3) {
      start = 2;
      end = 4;
    } else if (safeCurrentPage >= safeTotalPages - 2) {
      start = safeTotalPages - 3;
      end = safeTotalPages - 1;
    }

    if (start > 2) {
      pages.push('ellipsis');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < safeTotalPages - 1) {
      pages.push('ellipsis');
    }

    pages.push(safeTotalPages);
    return pages;
  };

  const pageNumbers = getPageNumbers();

  const startItem = totalElements !== undefined && pageSize
    ? totalElements === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1
    : null;
  const endItem = totalElements !== undefined && pageSize
    ? Math.min(safeCurrentPage * pageSize, totalElements)
    : null;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-500 dark:text-slate-400 font-sans shadow-xs transition-colors ${className}`}
    >
      {/* Item Counts and Page Info */}
      <div className="flex items-center gap-2">
        {totalElements !== undefined && startItem !== null && endItem !== null ? (
          <span>
            Showing <strong className="text-slate-900 dark:text-white font-semibold">{startItem}</strong> to{' '}
            <strong className="text-slate-900 dark:text-white font-semibold">{endItem}</strong> of{' '}
            <strong className="text-slate-900 dark:text-white font-semibold">{totalElements}</strong> problems
          </span>
        ) : (
          <span>
            Page <strong className="text-slate-900 dark:text-white font-semibold">{safeCurrentPage}</strong> of{' '}
            <strong className="text-slate-900 dark:text-white font-semibold">{safeTotalPages}</strong>
          </span>
        )}
      </div>

      {/* Pagination Controls matching reference images */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center">
        {/* First Page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={safeCurrentPage === 1}
          aria-label="First page"
          title="First Page"
          className="hidden sm:flex p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer items-center justify-center min-w-[36px] min-h-[36px]"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
          disabled={safeCurrentPage === 1}
          aria-label="Previous page"
          title="Previous Page"
          className="p-1.5 sm:p-2 px-2.5 sm:px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1 cursor-pointer font-semibold text-xs min-h-[36px]"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Numbered Page Buttons */}
        <div className="flex items-center gap-1 flex-wrap justify-center">
          {pageNumbers.map((p, idx) => {
            if (p === 'ellipsis') {
              return (
                <span key={`ellipsis-${idx}`} className="px-1.5 text-slate-400 font-bold select-none text-xs">
                  •••
                </span>
              );
            }
            const isActive = p === safeCurrentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-label={`Page ${p}`}
                aria-current={isActive ? 'page' : undefined}
                className={`min-w-8 h-8 sm:min-w-9 sm:h-9 px-2 sm:px-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-extrabold ring-2 ring-blue-600/30'
                    : 'border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(safeTotalPages, safeCurrentPage + 1))}
          disabled={safeCurrentPage >= safeTotalPages}
          aria-label="Next page"
          title="Next Page"
          className="p-1.5 sm:p-2 px-2.5 sm:px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1 cursor-pointer font-semibold text-xs min-h-[36px]"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => onPageChange(safeTotalPages)}
          disabled={safeCurrentPage >= safeTotalPages}
          aria-label="Last page"
          title="Last Page"
          className="hidden sm:flex p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer items-center justify-center min-w-[36px] min-h-[36px]"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};


