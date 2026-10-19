import React from 'react';
import { Link } from 'react-router-dom';
import { AdminCard } from '../AdminCard';
import { ADMIN_NAV_ITEMS } from '../AdminSidebar';
import { Compass, ChevronRight } from 'lucide-react';

export const DashboardQuickActions: React.FC = () => {
  const quickItems = ADMIN_NAV_ITEMS.filter((item) => item.to !== '/admin/dashboard');

  return (
    <AdminCard
      title="Quick Navigation & Management"
      subtitle="Direct shortcuts to platform administration modules"
      icon={<Compass className="w-5 h-5" />}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 font-sans">
        {quickItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all flex items-center justify-between group shadow-2xs"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 flex items-center justify-center transition-all shrink-0 shadow-xs">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                    {item.label}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                    {item.description || item.to}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all shrink-0" />
            </Link>
          );
        })}
      </div>
    </AdminCard>
  );
};
