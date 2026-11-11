import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { closeAuthModal } from '../features/auth/redux/authSlice';
import { executeAppLogout } from '../features/auth/utils/logoutHelper';
import { Navbar } from '../shared/components/ui/Navbar';
import { Footer } from '../shared/components/ui/Footer';
import { Login } from '../features/auth/pages/Login';

export const MainLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();

  const { user, isAuthModalOpen } = useAppSelector((state) => state.auth);
  const isProblemWorkspace = location.pathname.startsWith('/problems/');
  const showModal = isAuthModalOpen;

  const handleLogout = () => {
    void executeAppLogout(dispatch);
  };

  // Preserve user navigation context on modal close
  const handleCloseModal = () => {
    dispatch(closeAuthModal());
  };

  const isFullWidthPage =
    location.pathname === '/practice' ||
    location.pathname === '/problems' ||
    location.pathname.startsWith('/problems/') ||
    location.pathname === '/dsa-sheet' ||
    location.pathname.startsWith('/companies') ||
    location.pathname.startsWith('/aptitude') ||
    location.pathname.startsWith('/progress') ||
    location.pathname.startsWith('/roadmaps') ||
    location.pathname.startsWith('/company-patterns') ||
    location.pathname.startsWith('/logical') ||
    location.pathname.startsWith('/verbal') ||
    location.pathname.startsWith('/interviews') ||
    location.pathname.startsWith('/bookmarks') ||
    location.pathname.startsWith('/profile') ||
    location.pathname.startsWith('/settings');

  return (
    <div className={`${isProblemWorkspace ? 'h-screen overflow-hidden' : 'min-h-screen overflow-x-hidden'} flex flex-col relative m-0 p-0 bg-[#FFFFFF] dark:bg-[#070A13] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200`}>
      {/* Top Navbar */}
      <Navbar user={user} onLogout={handleLogout} />

      {/* Main Content View (Full-width clean layout container) */}
      <main
        className={`flex-1 min-h-0 mx-auto w-full ${
          isProblemWorkspace
            ? 'h-[calc(100dvh-var(--c2c-navbar-height,64px))] p-0 overflow-hidden'
            : isFullWidthPage
            ? 'w-full p-0'
            : 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'
        }`}
      >
        <Outlet />
      </main>

      {/* Shared Footer */}
      {!isProblemWorkspace && <Footer />}

      {/* Global Floating GFG Auth Modal Overlay */}
      {showModal && (
        <Login onCloseModal={handleCloseModal} />
      )}
    </div>
  );
};
