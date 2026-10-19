import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { BrandLogo } from '../../../shared/components/ui/BrandLogo';
import {
  LayoutDashboard,
  Code2,
  ListChecks,
  Building2,
  Languages,
  GraduationCap,
  ArrowLeft,
  X,
  ShieldCheck,
  LucideIcon,
} from 'lucide-react';

interface AdminSidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export interface AdminNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  description?: string;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    to: '/admin/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'System metrics & overview',
  },
  {
    to: '/admin/questions',
    label: 'Problem Bank',
    icon: Code2,
    description: 'DSA coding challenges',
  },
  {
    to: '/admin/mcqs',
    label: 'MCQs & Aptitude',
    icon: ListChecks,
    description: 'Multiple choice questions',
  },
  {
    to: '/admin/companies',
    label: 'Target Companies',
    icon: Building2,
    description: 'Company tags & profiles',
  },
  {
    to: '/admin/languages',
    label: 'Languages',
    icon: Languages,
    description: 'Judge0 compiler runtimes',
  },
  {
    to: '/admin/institutions',
    label: 'Institutions',
    icon: GraduationCap,
    description: 'Colleges & Universities',
  },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isMobileOpen,
  onCloseMobile,
}) => {
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm lg:hidden animate-fade-in"
        />
      )}

      {/* Modern Sidebar Panel */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-white/95 dark:bg-[#0D1322]/95 border-r border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl flex flex-col justify-between transition-transform duration-300 font-sans shadow-lg lg:shadow-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header & Navigation */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="h-20 px-5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between shrink-0">
            <div className="flex flex-col justify-center">
              <BrandLogo size="md" to="/admin/dashboard" showTagline={false} />
              <div className="flex items-center gap-1 mt-1 pl-11">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-[9px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  Admin Console
                </span>
              </div>
            </div>

            <button
              onClick={onCloseMobile}
              className="lg:hidden p-2 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
              aria-label="Close mobile sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Section Label */}
          <div className="px-6 pt-6 pb-2">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Management Modules
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {ADMIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `group flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-600/15 dark:text-blue-400 dark:border-blue-500/30 font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="truncate">{item.label}</span>
                          {item.description && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal truncate">
                              {item.description}
                            </span>
                          )}
                        </div>
                      </div>
                      {isActive && (
                        <div className="w-1.5 h-6 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User View Switcher Footer */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#070A13]/50">
          <Link
            to="/practice"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Switch to User View</span>
          </Link>
        </div>
      </aside>
    </>
  );
};
