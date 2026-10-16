import React from 'react';
import { AdminCard } from '../AdminCard';
import { AdminBadge } from '../AdminBadge';
import { BASE_URL } from '../../../../core/api/apiClient';

export const DashboardSystemInfo: React.FC = () => {
  const getBaseUrl = () => BASE_URL;

  return (
    <AdminCard title="System Information" subtitle="Environment details">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-sans text-xs">
        <div className="p-3.5 bg-neutral-950 border border-white/10 rounded-xl flex flex-col gap-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono font-bold">
            API Base URL
          </span>
          <span className="font-mono text-gray-200 font-medium truncate">{getBaseUrl()}</span>
          <AdminBadge variant="info" className="w-fit mt-1">
            REST API
          </AdminBadge>
        </div>

        <div className="p-3.5 bg-neutral-950 border border-white/10 rounded-xl flex flex-col gap-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono font-bold">
            Authentication
          </span>
          <span className="text-gray-200 font-semibold truncate">Bearer Token</span>
          <AdminBadge variant="success" className="w-fit mt-1">
            Active
          </AdminBadge>
        </div>

        <div className="p-3.5 bg-neutral-950 border border-white/10 rounded-xl flex flex-col gap-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono font-bold">
            Access Role
          </span>
          <span className="text-white font-bold truncate font-heading">Admin Role</span>
          <AdminBadge variant="warning" className="w-fit mt-1">
            ROLE_ADMIN
          </AdminBadge>
        </div>
      </div>
    </AdminCard>
  );
};
