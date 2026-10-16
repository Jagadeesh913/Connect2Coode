import React from 'react';
import type { UserProfile, UserInfoData } from '../../../core/types/domain';

interface PersonalInfoCardProps {
  profile: UserProfile | null;
  userInfo?: UserInfoData | null;
  onEdit: () => void;
}

export const PersonalInfoCard: React.FC<PersonalInfoCardProps> = ({
  profile,
  userInfo,
  onEdit,
}) => {
  const fullName =
    profile?.fullName ||
    (profile?.firstName
      ? `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim()
      : '');

  const email = profile?.email || '';
  const role = profile?.role || 'Student';
  const userId = profile?.id ?? userInfo?.userId ?? '';
  const bio = userInfo?.bio || profile?.bio || '';

  return (
    <div className="bg-white dark:bg-neutral-900/90 rounded-2xl border border-gray-200 dark:border-white/10 p-5 shadow-sm font-sans flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">
            <i className="fa-regular fa-user"></i>
          </div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Personal Information
          </h2>
        </div>
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:border-blue-500/50 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 bg-gray-50/50 dark:bg-white/5 transition-all cursor-pointer"
        >
          <i className="fa-solid fa-pen text-[10px]"></i>
          <span>Edit</span>
        </button>
      </div>

      {/* Grid of Real Verified User Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full Name */}
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-400 flex items-center justify-center shrink-0 mt-0.5 text-xs">
            <i className="fa-regular fa-id-badge"></i>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
              Full Name
            </p>
            <p className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-0.5">
              {fullName || '—'}
            </p>
          </div>
        </div>

        {/* Email Address */}
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-400 flex items-center justify-center shrink-0 mt-0.5 text-xs">
            <i className="fa-regular fa-envelope"></i>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
              Email Address
            </p>
            <p className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-0.5 truncate">
              {email || '—'}
            </p>
          </div>
        </div>

        {/* Account Role */}
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-400 flex items-center justify-center shrink-0 mt-0.5 text-xs">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
              Platform Role
            </p>
            <p className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-0.5">
              {role}
            </p>
          </div>
        </div>

        {/* User Account ID */}
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-400 flex items-center justify-center shrink-0 mt-0.5 text-xs">
            <i className="fa-solid fa-hashtag"></i>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
              Account ID
            </p>
            <p className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-0.5 font-mono">
              #{userId || '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Bio / About */}
      {bio && (
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5">
          <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-0.5">
            About / Bio
          </p>
          <p className="text-xs text-gray-700 dark:text-gray-300 italic">
            {bio}
          </p>
        </div>
      )}
    </div>
  );
};
