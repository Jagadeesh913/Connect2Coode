import React from 'react';
import type { UserProfile, UserInfoData } from '../../../core/types/domain';

interface AcademicDetailsCardProps {
  profile: UserProfile | null;
  userInfo?: UserInfoData | null;
  onEdit: () => void;
}

export const AcademicDetailsCard: React.FC<AcademicDetailsCardProps> = ({
  profile,
  userInfo,
  onEdit,
}) => {
  const degree = profile?.degree || '';
  const branch = profile?.branch || '';
  const regNumber = userInfo?.regNumber || profile?.regNumber || '';
  const joinedYear = userInfo?.joinedYear || profile?.joinedYear;
  const passedOutYear = userInfo?.passedOutYear || profile?.graduationYear || profile?.passedOutYear;
  const bio = userInfo?.bio || profile?.bio || '';
  const college = userInfo?.college || profile?.collegeName || '';

  const hasAcademicDetails = Boolean(regNumber || joinedYear || passedOutYear || degree || branch || college);

  // Compute current year descriptor
  const nowYear = new Date().getFullYear();
  let currentYearLabel = '—';
  if (typeof passedOutYear === 'number' && passedOutYear > 0) {
    const diff = passedOutYear - nowYear;
    if (diff === 0) currentYearLabel = 'Final Year';
    else if (diff === 1) currentYearLabel = '3rd Year';
    else if (diff === 2) currentYearLabel = '2nd Year';
    else if (diff > 2) currentYearLabel = '1st Year';
    else currentYearLabel = 'Alumni / Graduated';
  }

  return (
    <div className="bg-white dark:bg-neutral-900/90 rounded-2xl border border-gray-200 dark:border-white/10 p-5 shadow-sm font-sans space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">
            <i className="fa-solid fa-book-open"></i>
          </div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Academic Details
          </h2>
        </div>
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:border-blue-500/50 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 bg-gray-50/50 dark:bg-white/5 transition-all cursor-pointer"
        >
          <i className="fa-solid fa-pen text-[10px]"></i>
          <span>{hasAcademicDetails ? 'Edit' : 'Add Academic Details'}</span>
        </button>
      </div>

      {!hasAcademicDetails ? (
        <div className="flex flex-col items-center justify-center p-6 text-center rounded-xl bg-gray-50/70 dark:bg-neutral-950/60 border border-gray-200/70 dark:border-white/5">
          <i className="fa-solid fa-graduation-cap text-3xl text-gray-400 dark:text-gray-600 mb-2"></i>
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300">No academic information added</p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 max-w-sm mt-0.5 mb-3">
            Add your registration number, graduation year, degree, and coding bio to complete your profile.
          </p>
          <button
            onClick={onEdit}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
          >
            Add Academic Details
          </button>
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Degree */}
            <div>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                Degree / Reg No.
              </p>
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                {degree || '—'}
              </p>
              {regNumber && (
                <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400">
                  #{regNumber}
                </span>
              )}
            </div>

            {/* Branch / Major */}
            <div>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                Branch / Major
              </p>
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-0.5 truncate">
                {branch || '—'}
              </p>
            </div>

            {/* Current Year */}
            <div>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                Current Year (Joined)
              </p>
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                {currentYearLabel}
              </p>
              {joinedYear && (
                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                  Joined: {joinedYear}
                </span>
              )}
            </div>

            {/* Graduation Year */}
            <div>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                Graduation Year
              </p>
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                {passedOutYear || '—'}
              </p>
            </div>
          </div>

          {/* College Name if provided */}
          {college && (
            <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex items-center gap-2 text-xs">
              <span className="text-gray-400 font-semibold shrink-0">College:</span>
              <p className="text-gray-700 dark:text-gray-200 font-medium">{college}</p>
            </div>
          )}

          {/* Bio / Summary */}
          {bio && (
            <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex items-start gap-2 text-xs">
              <span className="text-gray-400 font-semibold shrink-0">Bio:</span>
              <p className="text-gray-600 dark:text-gray-300 italic">{bio}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
