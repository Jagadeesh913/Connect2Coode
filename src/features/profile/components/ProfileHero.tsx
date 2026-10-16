import React from 'react';
import type { UserProfile, UserInfoData } from '../../../core/types/domain';

interface ProfileHeroProps {
  profile: UserProfile | null;
  userInfo?: UserInfoData | null;
  problemsSolved?: number;
  onEditName?: () => void;
  onUploadPhoto?: () => void;
}

export const ProfileHero: React.FC<ProfileHeroProps> = ({
  profile,
  userInfo,
  problemsSolved = 0,
  onEditName,
  onUploadPhoto,
}) => {
  const name =
    profile?.fullName ||
    (profile?.firstName
      ? `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim()
      : profile?.email?.split('@')[0] || 'User');

  const email = profile?.email || '';
  const role = profile?.role || 'Student';
  const college = userInfo?.college || profile?.collegeName || '';
  const regNumber = userInfo?.regNumber || profile?.regNumber || '';

  // Compute initials
  const initials =
    name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-gray-200/80 dark:border-white/10 bg-gradient-to-r from-blue-50 via-indigo-50/70 to-purple-50/90 dark:from-neutral-900 dark:via-indigo-950/20 dark:to-purple-950/30 p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 relative z-10">
        {/* Avatar with Camera badge */}
        <div className="relative group shrink-0">
          {profile?.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-white dark:ring-neutral-800 shadow-md"
            />
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center text-2xl sm:text-3xl font-extrabold tracking-wider ring-4 ring-white dark:ring-neutral-800 shadow-md">
              {initials}
            </div>
          )}

          <button
            onClick={onUploadPhoto}
            className="absolute bottom-0 right-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg border-2 border-white dark:border-neutral-900 transition-transform active:scale-95 cursor-pointer"
            title="Update Profile Photo"
            aria-label="Update profile photo"
          >
            <i className="fa-solid fa-camera text-xs"></i>
          </button>
        </div>

        {/* User text metadata */}
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight truncate font-heading">
              {name}
            </h1>
            <button
              onClick={onEditName}
              className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded-md transition-colors cursor-pointer"
              title="Edit Personal Information"
              aria-label="Edit personal information"
            >
              <i className="fa-solid fa-pen text-xs"></i>
            </button>
          </div>

          {email && (
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
              {email}
            </p>
          )}

          {/* Real Backend Badges Row */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            {/* Role Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
              <i className="fa-solid fa-shield text-[10px]"></i>
              <span>{role}</span>
            </span>

            {/* Solved Problems from API */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
              <i className="fa-solid fa-code text-[10px]"></i>
              <span>{problemsSolved} Solved</span>
            </span>

            {/* College from API if available */}
            {college && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30 max-w-[260px] truncate">
                <i className="fa-solid fa-graduation-cap text-[10px] shrink-0"></i>
                <span className="truncate">{college}</span>
              </span>
            )}

            {/* Reg Number from API if available */}
            {regNumber && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <span>#{regNumber}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
