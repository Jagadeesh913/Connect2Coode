import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { logoutUser, openAuthModal } from '../../../features/auth/redux/authSlice';
import { useTheme } from '../../context/ThemeContext';
import { tokenStorage } from '../../../core/security/tokenStorage';
import { isJwtAdmin } from '../../../core/security/jwt';
import { BrandLogo } from './BrandLogo';

export interface NavbarProps {
  user?: any;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
}) => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { isAuthenticated, user: reduxUser } = useAppSelector((state) => state.auth);
  const { theme, toggleTheme } = useTheme();

  const isLoggedIn = user !== undefined ? user !== null : (isAuthenticated && reduxUser !== null);
  const currentUser = user || reduxUser || null;
  const userDisplayName = currentUser?.fullName || currentUser?.firstName || currentUser?.name || currentUser?.email?.split('@')[0] || 'User';
  const userDisplayEmail = currentUser?.email || '';
  const userInitials = userDisplayName.slice(0, 2).toUpperCase();

  const token = tokenStorage.getAccessToken();
  const userRole = String(currentUser?.role || reduxUser?.role || '').toUpperCase();
  const isAdmin = isLoggedIn && (userRole === 'ADMIN' || userRole === 'ROLE_ADMIN' || userRole.includes('ADMIN') || isJwtAdmin(token));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu whenever route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    setIsProfileDropdownOpen(false);
    setIsMobileMenuOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      dispatch(logoutUser());
    }
  };

  const navItems = [
    { to: '/', label: 'Home', exact: true },
    { to: '/practice', label: 'Problems' },
    { to: '/companies', label: 'Company Prep' },
    { to: '/aptitude', label: 'Aptitude' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 dark:bg-[#070A13]/90 border-b border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md transition-colors duration-200 font-sans">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between gap-4">
          
          {/* BRAND LOGO */}
          <BrandLogo size="md" />

          {/* DESKTOP NAVIGATION LINKS */}
          <nav className="hidden md:flex items-center gap-7 lg:gap-9">
            {navItems.map((item) => {
              const isActive = item.exact 
                ? location.pathname === '/' 
                : location.pathname.startsWith(item.to);
              
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="group relative flex flex-col items-center py-2 text-sm font-semibold transition-colors no-underline"
                >
                  <span
                    className={`transition-colors ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    {item.label}
                  </span>
                  {/* Reference Image Iconic Active Dot */}
                  {isActive && (
                    <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* RIGHT SIDE: SEARCH + THEME + AUTH BUTTONS */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Search Icon Button */}
            <button
              type="button"
              onClick={() => navigate('/practice')}
              className="p-2 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              aria-label="Search problems"
              title="Search problems"
            >
              <i className="fa-solid fa-magnifying-glass text-sm"></i>
            </button>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle theme"
            >
              <i className={`fa-solid ${theme === 'dark' ? 'fa-sun text-amber-400' : 'fa-moon text-indigo-500'} text-sm`}></i>
            </button>

            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors text-xs font-bold shadow-xs"
                title="Switch to Admin Dashboard"
              >
                <i className="fa-solid fa-shield-halved text-purple-600 dark:text-purple-400 text-xs"></i>
                <span>Admin</span>
              </Link>
            )}

            {isLoggedIn ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsProfileDropdownOpen((prev) => !prev);
                  }}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="User menu"
                >
                  <div className="relative">
                    {currentUser?.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt={userDisplayName}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700 shadow-xs"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center ring-2 ring-slate-200 dark:ring-slate-700 shadow-xs">
                        {userInitials}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-[#0B0F19]"></span>
                  </div>
                  <i className={`fa-solid fa-chevron-down text-[10px] text-slate-400 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`}></i>
                </button>

                {/* Profile Dropdown */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2.5 w-56 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 flex flex-col p-2 gap-1 font-sans">
                    <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 rounded-xl flex items-center gap-2.5">
                      {currentUser?.avatarUrl ? (
                        <img
                          src={currentUser.avatarUrl}
                          alt={userDisplayName}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {userInitials}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {userDisplayName}
                        </span>
                        {userDisplayEmail && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {userDisplayEmail}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-0.5 pt-1">
                      <Link
                        to="/profile"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <i className="fa-regular fa-user text-xs text-slate-500 w-4 text-center"></i>
                        <span>User Profile</span>
                      </Link>

                      <Link
                        to="/bookmarks"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <i className="fa-regular fa-bookmark text-xs text-amber-500 w-4 text-center"></i>
                        <span>My Bookmarks</span>
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
                        >
                          <i className="fa-solid fa-shield-halved text-xs text-purple-600 dark:text-purple-400 w-4 text-center"></i>
                          <span>Admin Portal</span>
                        </Link>
                      )}

                      <div className="my-1 border-t border-slate-100 dark:border-slate-800"></div>

                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors w-full text-left cursor-pointer"
                      >
                        <i className="fa-solid fa-right-from-bracket text-xs text-rose-500 w-4 text-center"></i>
                        <span>Log out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-2.5">
                {/* Login Pill Button */}
                <button
                  type="button"
                  onClick={() => dispatch(openAuthModal({ mode: 'login' }))}
                  className="rounded-full border border-slate-200 dark:border-slate-700 px-4 sm:px-5 py-1.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs"
                >
                  Login
                </button>

                {/* Sign Up Pill Button */}
                <button
                  type="button"
                  onClick={() => dispatch(openAuthModal({ mode: 'signup' }))}
                  className="rounded-full px-4 sm:px-5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-[#0B0F19] hover:bg-slate-800 dark:bg-gradient-to-r dark:from-[#6366F1] dark:to-[#8B5CF6] dark:hover:opacity-90 shadow-sm transition-all cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="md:hidden p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <i className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-sm`}></i>
            </button>
          </div>

        </div>
      </div>

      {/* MOBILE NAVIGATION DRAWER */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/98 dark:bg-[#0B0F19]/98 backdrop-blur-xl px-4 py-3 shadow-xl animate-fade-in font-sans">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = item.exact 
                ? location.pathname === '/' 
                : location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></span>}
                </NavLink>
              );
            })}
            {isAdmin && (
              <Link
                to="/admin/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 mt-1"
              >
                <i className="fa-solid fa-shield-halved text-xs text-purple-600 dark:text-purple-400"></i>
                <span>Admin Portal</span>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

