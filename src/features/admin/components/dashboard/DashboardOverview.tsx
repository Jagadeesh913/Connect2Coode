import React from 'react';
import { AdminBadge } from '../AdminBadge';
import { useAppSelector } from '../../../../app/hooks';
import { ShieldCheck } from 'lucide-react';

export const DashboardOverview: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const displayName = user?.fullName || user?.firstName || user?.email?.split('@')[0] || 'Administrator';
  const roleName = user?.role || 'ROLE_ADMIN';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600/10 via-violet-600/10 to-pink-500/10 dark:from-blue-950/40 dark:via-purple-950/30 dark:to-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-8 backdrop-blur-md shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 font-sans">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold shrink-0 shadow-md shadow-blue-500/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Welcome back, {displayName}
              </h2>
              <AdminBadge variant="primary" dot>
                {roleName}
              </AdminBadge>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              Platform management console. Monitor live indexed DSA problems, MCQs, hiring partners, institutions, and test runtime execution.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-200/80 dark:border-slate-800/80">
          <div className="flex flex-col text-left md:text-right">
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">
              API Connection
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 md:justify-end mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live REST Client
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
