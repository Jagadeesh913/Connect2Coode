import React from 'react';
import type { UserProfile, UserInfoData, Institution } from '../../../core/types/domain';

interface ProfileCompletionCardProps {
  percentage?: number;
  profile?: UserProfile | null;
  userInfo?: UserInfoData | null;
  institution?: Institution | null;
  onEditSection?: (section: string) => void;
}

export const ProfileCompletionCard: React.FC<ProfileCompletionCardProps> = ({
  percentage: percentageProp,
  profile,
  userInfo,
  institution,
  onEditSection,
}) => {
  const hasPersonal = Boolean(profile?.fullName || profile?.firstName || profile?.email);
  const hasAcademic = Boolean(userInfo?.regNumber || userInfo?.college || institution?.name || profile?.degree || profile?.collegeName);
  const hasPhoto = Boolean(profile?.avatarUrl);

  const items = [
    { id: 'personal', label: 'Personal Information', completed: hasPersonal, actionLabel: 'Edit' },
    { id: 'academic', label: 'Academic Details', completed: hasAcademic, actionLabel: hasAcademic ? 'Edit' : 'Add' },
    { id: 'photo', label: 'Profile Photo', completed: hasPhoto, actionLabel: hasPhoto ? 'Edit' : 'Add' },
  ];

  const completedCount = items.filter((i) => i.completed).length;
  const calculatedPercentage = Math.round((completedCount / items.length) * 100);
  const percentage = percentageProp !== undefined ? percentageProp : calculatedPercentage;

  // SVG circle calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white dark:bg-neutral-900/90 rounded-2xl border border-gray-200 dark:border-white/10 p-5 shadow-sm font-sans space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/5">
        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">
          <i className="fa-solid fa-chart-pie"></i>
        </div>
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">
          Profile Status
        </h2>
      </div>

      {/* Donut & Motivation */}
      <div className="flex items-center gap-4">
        {/* Circular Donut Ring */}
        <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="currentColor"
              strokeWidth="7"
              fill="transparent"
              className="text-gray-100 dark:text-neutral-800"
            />
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="url(#completionGradient)"
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="completionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-base font-extrabold text-gray-900 dark:text-white">
              {percentage}%
            </span>
          </div>
        </div>

        <div>
          <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white">
            {percentage === 100 ? 'All Set!' : percentage >= 50 ? 'Almost there!' : 'Get Started'}
          </h3>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-snug">
            {percentage === 100
              ? 'Your profile is completely verified and up to date.'
              : 'Add your academic and personal details to personalize your platform experience.'}
          </p>
        </div>
      </div>

      {/* Checklist items */}
      <div className="space-y-2 pt-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between py-1 px-1 text-xs"
          >
            <div className="flex items-center gap-2.5">
              {item.completed ? (
                <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                  <i className="fa-solid fa-check"></i>
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border border-gray-300 dark:border-neutral-700 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-neutral-600"></span>
                </div>
              )}
              <span
                className={
                  item.completed
                    ? 'text-gray-700 dark:text-gray-300 font-medium'
                    : 'text-gray-400 dark:text-gray-500'
                }
              >
                {item.label}
              </span>
            </div>

            <button
              onClick={() => onEditSection?.(item.id)}
              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              {item.actionLabel}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
