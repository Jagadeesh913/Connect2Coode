import React from 'react';
import { User, Contact, GraduationCap, Lock, Bell } from 'lucide-react';

export type ProfileNavId =
  | 'overview'
  | 'personal'
  | 'academic'
  | 'security'
  | 'notifications';

interface ProfileSidebarNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const ProfileSidebarNav: React.FC<ProfileSidebarNavProps> = ({
  activeTab = 'overview',
  onTabChange,
}) => {
  const navItems = [
    { id: 'overview', label: 'Profile Overview', icon: User },
    { id: 'personal', label: 'Personal Information', icon: Contact },
    { id: 'academic', label: 'Academic Details', icon: GraduationCap },
    { id: 'security', label: 'Change Password', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <aside className="w-full lg:w-64 shrink-0 font-sans">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/80 dark:border-white/10 p-3 shadow-xs space-y-1">
        {navItems.map((item) => {
          const isCurrent = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange?.(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all text-left cursor-pointer ${
                isCurrent
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isCurrent
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

