import React from 'react';
import { AdminLoading } from './AdminLoading';
import { AdminEmptyState } from './AdminEmptyState';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  className?: string;
}

interface AdminTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  keyExtractor: (row: T) => string | number;
}

export function AdminTable<T>({
  columns,
  data,
  loading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no entries available to display in this table.',
  onRowClick,
  keyExtractor,
}: AdminTableProps<T>) {
  if (loading) {
    return <AdminLoading message="Fetching table data..." />;
  }

  if (!data || data.length === 0) {
    return <AdminEmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-white/10 bg-neutral-900 backdrop-blur-xl shadow-2xl font-sans">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-white/10 bg-neutral-950">
            {columns.map((col, i) => (
              <th key={i} className={`py-3.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              onClick={() => onRowClick && onRowClick(row)}
              className={`hover:bg-white/5 transition-colors group text-gray-200 ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
            >
              {columns.map((col, i) => (
                <td key={i} className={`py-3.5 px-4 text-xs ${col.className || ''}`}>
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
  );
}
