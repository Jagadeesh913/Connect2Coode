import React from 'react';
import { NavLink, Link } from 'react-router-dom';

interface AdminSidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export interface AdminNavItem {
  to: string;
  label: string;
  icon: string;
  badge?: string;
  isImplemented: boolean;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: 'fa-solid fa-gauge-high', isImplemented: true },
  { to: '/admin/institutions', label: 'Institutions', icon: 'fa-solid fa-graduation-cap', isImplemented: true },
  { to: '/admin/questions', label: 'Problem Bank', icon: 'fa-solid fa-code', isImplemented: true },
  { to: '/admin/companies', label: 'Target Companies', icon: 'fa-solid fa-building', isImplemented: true },
  { to: '/admin/languages', label: 'Languages', icon: 'fa-solid fa-language', isImplemented: true },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden animate-fade-in"
        />
      )}

      {/* Sidebar Panel with Glassmorphism Design */}
      <aside
        className={`fixed lg:static top-0 left-0 z-50 h-full w-64 bg-neutral-900 backdrop-blur-xl border-r border-white/10 flex flex-col justify-between transition-transform duration-300 font-sans ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between shrink-0">
            <Link to="/admin/dashboard" className="flex items-center gap-2.5 group">
              <img src="/logo-mark.png" alt="Connect to Code" className="h-8 w-auto shrink-0 drop-shadow-[0_2px_8px_rgba(139,92,246,0.35)]" />
              <div className="flex flex-col">
                <h1 className="font-extrabold text-white tracking-tight font-heading text-sm">
                  CONNECT<span className="text-violet-400">TO</span>CODE
                </h1>
                <span className="text-[10px] text-neutral-400 font-bold tracking-wider uppercase">
                  Admin Console
                </span>
              </div>
            </Link>
            <button
              onClick={onCloseMobile}
              className="lg:hidden text-gray-400 hover:text-white text-sm"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5">
            {ADMIN_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-neutral-100 text-neutral-900 text-black shadow-md  font-extrabold'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <i className={`${item.icon} text-sm w-4 text-center`}></i>
                  <span>{item.label}</span>
                </div>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User Portal Switcher */}
        <div className="p-4 border-t border-white/10 bg-neutral-950 backdrop-blur-md">
          <Link
            to="/practice"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl border border-white/10 text-xs font-bold text-gray-300 hover:text-white hover:border-neutral-600 hover:bg-white/5 transition-all"
          >
            <i className="fa-solid fa-arrow-left text-xs text-neutral-300"></i>
            <span>Switch to User View</span>
          </Link>
        </div>
      </aside>
    </>
  );
};
