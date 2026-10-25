import React from 'react';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { RequestStatus } from '../../../shared/components/ui/RequestStatus';
import { AdminEmptyState } from './AdminEmptyState';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface AdminTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  onRowClick?: (row: T) => void;
  keyExtractor: (row: T) => string | number;
  className?: string;
}

export function AdminTable<T>({
  columns,
  data,
  loading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no entries available to display in this table.',
  emptyAction,
  onRowClick,
  keyExtractor,
  className = '',
}: AdminTableProps<T>) {
  if (!loading && (!data || data.length === 0)) {
    return (
      <AdminEmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div
      aria-busy={loading}
      className={`w-full overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0D1322] shadow-xs font-sans transition-colors ${className}`}
    >
      <RequestStatus pending={loading} label={data.length ? 'Updating records…' : 'Loading records…'} />
      <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#070A13]/70">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`py-3.5 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${
                    col.headerClassName || col.className || ''
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60">
            {loading ? Array.from({ length: 10 }, (_, row) => (
              <tr key={row} aria-hidden="true">
                {columns.map((col, index) => <td key={index} className={`px-4 py-3.5 ${col.className || ''}`}><Skeleton className="h-7 w-full" /></td>)}
              </tr>
            )) : data.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick && onRowClick(row)}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={(event) => {
                  if (onRowClick && event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    onRowClick(row);
                  }
                }}
                className={`hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors group text-slate-700 dark:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
              >
                {columns.map((col, i) => (
                  <td key={i} className={`py-3.5 px-4 text-xs sm:text-sm ${col.className || ''}`}>
                    {col.cell
                      ? col.cell(row)
                      : col.accessorKey
                      ? (row[col.accessorKey] as React.ReactNode)
                      : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
