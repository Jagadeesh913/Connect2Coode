import React from 'react';
import { Link } from 'react-router-dom';
import { AdminCard } from '../AdminCard';
import { ADMIN_NAV_ITEMS } from '../AdminSidebar';

export const DashboardQuickActions: React.FC = () => {
  return (
    <AdminCard title="Quick Actions" subtitle="Fast access to admin modules">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-sans">
        {ADMIN_NAV_ITEMS.filter((item) => item.to !== '/admin/dashboard').map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="p-3.5 rounded-xl bg-neutral-950 border border-white/10 hover:border-neutral-700 hover:bg-neutral-900 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-lg bg-white/5 group-hover:bg-neutral-800 text-gray-300 group-hover:text-white transition-colors shrink-0">
                <i className={`${item.icon} text-sm w-4 text-center`}></i>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white group-hover:text-white transition-colors truncate font-heading">
                  {item.label}
                </span>
                <span className="text-[10px] text-gray-500 font-mono truncate">{item.to}</span>
              </div>
            </div>
            <i className="fa-solid fa-chevron-right text-xs text-gray-600 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0"></i>
          </Link>
        ))}
      </div>
    </AdminCard>
  );
};
