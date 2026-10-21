import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { logoutUser } from '../../../features/auth/redux/authSlice';
import { useTheme } from '../../../shared/context/ThemeContext';
import { tokenStorage } from '../../../core/security/tokenStorage';
import { AdminBadge } from './AdminBadge';
import {
  Menu,
  Sun,
  Moon,
  ExternalLink,
  LogOut,
  ChevronDown,
} from 'lucide-react';

interface AdminHeaderProps {
  onToggleMobileSidebar: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onToggleMobileSidebar }) => {
  const dispatch = useAppDispatch();
  const reduxUser = useAppSelector((state) => state.auth.user);
  const user = reduxUser || tokenStorage.getUser();
  const { theme, toggleTheme } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsProfileOpen(false);
    dispatch(logoutUser());
  };

  const displayName =
    user?.fullName || user?.firstName || user?.email?.split('@')[0] || 'Administrator';
  const roleName = user?.role || 'ROLE_ADMIN';

  return (
    <header className="h-16 sm:h-20 bg-white/80 dark:bg-[#070A13]/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 font-sans transition-colors duration-200">
      {/* Left Engine Indicator & Mobile Menu Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle Mobile Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Live Backend Connection Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-[11px]">Backend API Live</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Switch to User Portal (Practice) */}
        <Link
          to="/practice"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all shadow-xs group"
          title="Switch to User Problem Practice"
        >
          <ExternalLink className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">User Portal</span>
        </Link>

        {/* Theme Switcher */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center justify-center p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer shadow-xs"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-90 duration-200" />
          ) : (
            <Moon className="w-4 h-4 text-blue-600 animate-in spin-in-90 duration-200" />
          )}
          <span className="hidden md:inline ml-1.5">
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen((prev) => !prev)}
            className="flex items-center gap-2.5 p-1 sm:px-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <div className="text-right hidden md:block">
              <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                {displayName}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">
                {user?.email || 'admin@connect2code.io'}
              </div>
            </div>

            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 hidden sm:block" />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95 duration-100 font-sans">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-xl flex flex-col gap-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {displayName}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {user?.email || 'admin@connect2code.io'}
                </span>
                <AdminBadge variant="primary" className="w-fit mt-1">
                  {roleName}
                </AdminBadge>
              </div>

              <div className="my-1 border-t border-slate-200 dark:border-slate-800"></div>

              <Link
                to="/practice"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-slate-400" />
                <span>Go to Practice Problems</span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors w-full text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
