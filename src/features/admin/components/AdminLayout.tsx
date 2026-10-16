import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminContent } from './AdminContent';

/**
 * AdminLayout Shell
 * Master layout container for the entire Admin Frontend section (/admin/*).
 * Combines AdminSidebar, AdminHeader, and AdminContent holding nested routes (<Outlet />).
 */
export const AdminLayout: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col font-sans admin-layout-container">
      <div className="flex flex-1 relative overflow-hidden">
        {/* Admin Navigation Sidebar */}
        <AdminSidebar
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Column */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <AdminHeader onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)} />
          <AdminContent>
            <Outlet />
          </AdminContent>
        </div>
      </div>
    </div>
  );
};
