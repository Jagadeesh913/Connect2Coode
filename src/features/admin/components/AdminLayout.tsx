import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminContent } from './AdminContent';

/**
 * AdminLayout Shell
 * Master layout container for the entire Admin Frontend section (/admin/*).
 * Fully redesigned to match Connect2Code's enterprise visual standards with light/dark theme support.
 */
export const AdminLayout: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FFFFFF] dark:bg-[#070A13] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 relative overflow-x-hidden">
      {/* Ambient background glows matching Connect2Code User pages */}
      <div className="fixed top-20 -left-48 w-96 h-[400px] bg-purple-600/5 dark:bg-purple-600/15 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed top-40 -right-48 w-96 h-[500px] bg-blue-600/5 dark:bg-blue-600/15 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="flex flex-1 relative min-h-screen">
        {/* Modern Admin Navigation Sidebar */}
        <AdminSidebar
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Column */}
        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)} />
          <AdminContent>
            <Outlet />
          </AdminContent>
        </div>
      </div>
    </div>
  );
};
