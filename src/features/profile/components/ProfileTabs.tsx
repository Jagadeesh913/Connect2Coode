import React from 'react';

export type ProfileTabType =
  | 'overview'
  | 'personal'
  | 'institution'
  | 'academic'
  | 'security';

interface ProfileTabsProps {
  activeTab: ProfileTabType;
  onTabChange: (tab: ProfileTabType) => void;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs: Array<{ id: ProfileTabType; label: string; icon: string }> = [
    { id: 'overview', label: 'Overview', icon: 'fa-solid fa-table-cells-large' },
    { id: 'personal', label: 'Personal Information', icon: 'fa-regular fa-user' },
    { id: 'institution', label: 'Institution', icon: 'fa-solid fa-graduation-cap' },
    { id: 'academic', label: 'Academic Details', icon: 'fa-solid fa-book-open' },
    { id: 'security', label: 'Security', icon: 'fa-solid fa-shield-halved' },
  ];

  return (
    <div className="w-full border-b border-gray-200 dark:border-white/10 overflow-x-auto scrollbar-none font-sans">
      <div className="flex items-center gap-1 sm:gap-2 min-w-max py-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all relative ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50/70 dark:bg-blue-500/10'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
              }`}
            >
              <i className={`${tab.icon} text-xs`}></i>
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
