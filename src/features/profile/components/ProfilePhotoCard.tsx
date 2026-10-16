import React from 'react';
import type { UserProfile } from '../../../core/types/domain';

interface ProfilePhotoCardProps {
  profile: UserProfile | null;
  onUpload: () => void;
}

export const ProfilePhotoCard: React.FC<ProfilePhotoCardProps> = ({ profile, onUpload }) => {
  const name = profile?.fullName || (profile?.firstName
    ? `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim()
    : profile?.email?.split('@')[0] || 'User');

  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  return (
    <div className="bg-white dark:bg-neutral-900/90 rounded-2xl border border-gray-200 dark:border-white/10 p-5 shadow-sm font-sans flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">
            <i className="fa-solid fa-shapes"></i>
          </div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Profile Photo
          </h2>
        </div>
        <button
          onClick={onUpload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:border-blue-500/50 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 bg-gray-50/50 dark:bg-white/5 transition-all"
        >
          <i className="fa-solid fa-pen text-[10px]"></i>
          <span>Edit</span>
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col items-center justify-center text-center py-2">
        <div className="relative mb-3">
          {profile?.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={name}
              className="w-20 h-20 rounded-full object-cover ring-2 ring-gray-200 dark:ring-neutral-700 shadow-sm"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 flex items-center justify-center text-xl font-bold tracking-wider ring-2 ring-gray-100 dark:ring-white/10">
              {initials}
            </div>
          )}
          <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] shadow border-2 border-white dark:border-neutral-900">
            <i className="fa-solid fa-camera"></i>
          </span>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[200px] mb-3">
          Add a clear photo to personalize your profile.
        </p>

        <button
          onClick={onUpload}
          className="px-4 py-1.5 rounded-xl border border-blue-600/40 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-xs font-bold transition-all"
        >
          Upload Photo
        </button>
      </div>
    </div>
  );
};
