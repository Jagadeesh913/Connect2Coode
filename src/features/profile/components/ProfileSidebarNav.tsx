import React from 'react';
import { Link } from 'react-router-dom';

interface ProfileSidebarNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const ProfileSidebarNav: React.FC<ProfileSidebarNavProps> = ({
  activeTab = 'overview',
  onTabChange,
}) => {
  const navItems = [
    { id: 'overview', label: 'User Profile', icon: 'fa-regular fa-user', path: '/profile' },
    { id: 'bookmarks', label: 'My Bookmarks', icon: 'fa-regular fa-bookmark', path: '/bookmarks' },
    { id: 'practice', label: 'Practice Problems', icon: 'fa-solid fa-code', path: '/practice' },
    { id: 'companies', label: 'Company Prep', icon: 'fa-regular fa-building', path: '/companies' },
    { id: 'settings', label: 'Settings', icon: 'fa-solid fa-gear', path: '/settings' },
  ];

  return (
    <aside className="w-full lg:w-60 shrink-0 font-sans">
      <div className="bg-white dark:bg-neutral-900/90 rounded-2xl border border-gray-200 dark:border-white/10 p-3 shadow-sm backdrop-blur-xl space-y-1">
        {navItems.map((item) => {
          const isCurrent = item.id === 'overview' && activeTab === 'overview';

          if (item.path && item.id !== 'overview') {
            return (
              <Link
                key={item.id}
                to={item.path}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all text-left"
              >
                <i className={`${item.icon} text-sm w-4 text-center`}></i>
                <span>{item.label}</span>
              </Link>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange?.('overview');
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                isCurrent
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 font-bold'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
              }`}
            >
              <i className={`${item.icon} text-sm w-4 text-center`}></i>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
