import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { logoutUser } from '../../../features/auth/redux/authSlice';
import { useTheme } from '../../../shared/context/ThemeContext';
import { tokenStorage } from '../../../core/security/tokenStorage';
import { AdminBadge } from './AdminBadge';

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

  return (
    <header className="h-16 bg-neutral-900 backdrop-blur-xl border-b border-white/10 px-8 flex items-center justify-between sticky top-0 z-10 font-sans">
      {/* Left Engine Indicator */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl bg-neutral-950 border border-white/10 text-gray-300 hover:text-white"
          aria-label="Toggle Mobile Menu"
        >
          <i className="fa-solid fa-bars text-sm"></i>
        </button>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          <span className="text-xs font-semibold text-gray-400">REST API Client</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Switch to User Portal (Practice) */}
        <Link
          to="/practice"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 border border-neutral-700 hover:border-neutral-600 text-neutral-300 hover:bg-neutral-200 hover:text-black text-xs font-bold transition-all shadow-sm group"
          title="Switch to User Portal (Practice)"
        >
          <i className="fa-solid fa-code text-xs group-hover:scale-110 transition-transform"></i>
          <span className="hidden sm:inline">User Portal</span>
        </Link>

        {/* Theme Switcher */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-950 border border-white/10 hover:border-neutral-700 text-gray-300 text-xs font-semibold transition-all cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
        >
          <i className={`fa-solid ${theme === 'dark' ? 'fa-sun text-[#EAB308]' : 'fa-moon text-sky-400'}`}></i>
          <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen((prev) => !prev)}
            className="flex items-center gap-3 p-1 rounded-xl hover:bg-white/5 transition-all cursor-pointer"
          >
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-white leading-tight">
                {user?.firstName || 'Admin'} {user?.lastName || 'Administrator'}
              </div>
              <div className="text-[10px] text-neutral-300 font-semibold leading-tight mt-0.5">
                {user?.email || 'admin@connect2code.io'}
              </div>
            </div>

            <div className="w-9 h-9 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-300 flex items-center justify-center font-bold text-xs font-heading">
              {user?.firstName ? user.firstName.charAt(0) : 'A'}
            </div>
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-neutral-900 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-2 flex flex-col gap-1 z-50 animate-fade-in font-sans">
              <div className="p-3 bg-neutral-950 border border-white/10 rounded-xl flex flex-col gap-1">
                <span className="text-xs font-bold text-white truncate">
                  {user?.firstName || 'Admin User'} {user?.lastName || ''}
                </span>
                <AdminBadge variant="primary" className="w-fit">
                  {user?.role || 'ADMIN'}
                </AdminBadge>
              </div>
              <div className="my-1 border-t border-white/10"></div>
              <Link
                to="/practice"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors w-full text-left"
              >
                <i className="fa-solid fa-code text-xs text-neutral-300"></i>
                <span>Switch to User Portal</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors w-full text-left cursor-pointer"
              >
                <i className="fa-solid fa-right-from-bracket text-xs"></i>
                <span>Sign Out Session</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
