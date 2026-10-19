import React from 'react';
import { AdminCard } from '../AdminCard';
import { AdminBadge } from '../AdminBadge';
import { BASE_URL } from '../../../../core/api/apiClient';
import { Server, KeyRound, ShieldCheck, Database } from 'lucide-react';

export const DashboardSystemInfo: React.FC = () => {
  const getBaseUrl = () => BASE_URL;

  return (
    <AdminCard
      title="System Architecture & Runtimes"
      subtitle="Active backend environments and authentication endpoints"
      icon={<Server className="w-5 h-5" />}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-sans text-xs">
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-[10px] uppercase tracking-wider font-mono font-bold">
              API Base Gateway
            </span>
          </div>
          <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold truncate text-xs">
            {getBaseUrl()}
          </span>
          <AdminBadge variant="info" className="w-fit mt-1">
            Spring Boot REST
          </AdminBadge>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[10px] uppercase tracking-wider font-mono font-bold">
              Authentication
            </span>
          </div>
          <span className="text-slate-800 dark:text-slate-200 font-semibold truncate text-xs">
            Cryptographic Bearer JWT
          </span>
          <AdminBadge variant="success" dot className="w-fit mt-1">
            Validated Token
          </AdminBadge>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-[10px] uppercase tracking-wider font-mono font-bold">
              Access Governance
            </span>
          </div>
          <span className="text-slate-800 dark:text-slate-200 font-bold truncate text-xs">
            ROLE_ADMIN Active
          </span>
          <AdminBadge variant="warning" className="w-fit mt-1">
            RBAC Protected
          </AdminBadge>
        </div>
      </div>
    </AdminCard>
  );
};
