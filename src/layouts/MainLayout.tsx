import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { logoutUser, closeAuthModal } from '../features/auth/redux/authSlice';
import { Navbar } from '../shared/components/ui/Navbar';
import { Footer } from '../shared/components/ui/Footer';
import { Login } from '../features/auth/pages/Login';
import { toast } from 'react-hot-toast';

export const MainLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { user, isAuthModalOpen } = useAppSelector((state) => state.auth);
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/signup';
  const isProblemWorkspace = location.pathname.startsWith('/problems/');
  const showModal = isAuthModalOpen || isAuthRoute;

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Logged out successfully');
  };

  // Preserve user navigation context on modal close: return to Home if cancelled
  const handleCloseModal = () => {
    dispatch(closeAuthModal());
    if (isAuthRoute) {
      navigate('/');
    }
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
    <div className="min-h-screen flex flex-col relative m-0 p-0 overflow-x-hidden bg-[#FFFFFF] dark:bg-[#070A13] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar user={user} onLogout={handleLogout} />

      {/* Main Content View (Full-width clean layout container) */}
      <main
        className={`flex-1 mx-auto w-full ${
          isProblemWorkspace
            ? 'w-full p-0'
            : isFullWidthPage
            ? 'w-full p-0'
            : 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'
        }`}
      >
        <Outlet />
      </main>

      {/* Shared Footer */}
      <Footer />

      {/* Global Floating GFG Auth Modal Overlay */}
      {showModal && (
        <Login onCloseModal={handleCloseModal} />
      )}
    </div>
  );
};
