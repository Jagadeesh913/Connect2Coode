import React from 'react';
import { Skeleton } from '../../../shared/components/ui/Skeleton';

interface AdminLoadingProps {
  message?: string;
}

export const AdminLoading: React.FC<AdminLoadingProps> = ({
  message = 'Loading Admin data...',
}) => {
  return (
    <div className="w-full flex flex-col gap-4 p-6 font-sans">
      <div className="flex items-center gap-3">
        <i className="fa-solid fa-circle-notch animate-spin text-neutral-300 text-xl"></i>
        <span className="text-sm font-semibold text-gray-300">{message}</span>
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
};
