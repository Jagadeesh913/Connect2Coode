import React from 'react';
import type { UserProfile, Institution, UserInfoData } from '../../../core/types/domain';

interface InstitutionInfoCardProps {
  profile: UserProfile | null;
  institution?: Institution | null;
  userInfo?: UserInfoData | null;
  onEdit: () => void;
}

export const InstitutionInfoCard: React.FC<InstitutionInfoCardProps> = ({
  profile,
  institution,
  userInfo,
  onEdit,
}) => {
  const name =
    institution?.name ||
    userInfo?.college ||
    profile?.collegeName ||
    profile?.institution?.name ||
    '';

  const regNumber = userInfo?.regNumber || profile?.regNumber || '';
  const joinedYear = userInfo?.joinedYear || profile?.joinedYear;
  const passedOutYear = userInfo?.passedOutYear || profile?.graduationYear || profile?.passedOutYear;
  const bio = userInfo?.bio || profile?.bio || '';

  const hasInstitution = Boolean(name.trim());

  return (
    <div className="bg-white dark:bg-neutral-900/90 rounded-2xl border border-gray-200 dark:border-white/10 p-5 shadow-sm font-sans space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-2 border-b border-gray-100 dark:border-white/5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 text-xs">
            <i className="fa-solid fa-graduation-cap"></i>
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Institution Information
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Your college or university affiliation linked with your student profile.
            </p>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:border-blue-500/50 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 bg-gray-50/50 dark:bg-white/5 transition-all shrink-0 cursor-pointer"
        >
          <i className="fa-solid fa-pen text-[10px]"></i>
          <span>{hasInstitution ? 'Update Institution' : 'Link Institution'}</span>
        </button>
      </div>

      {!hasInstitution ? (
        <div className="flex flex-col items-center justify-center p-6 text-center rounded-xl bg-gray-50/70 dark:bg-neutral-950/60 border border-gray-200/70 dark:border-white/5">
          <i className="fa-solid fa-building-columns text-3xl text-gray-400 dark:text-gray-600 mb-2"></i>
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300">No institution details linked yet</p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 max-w-sm mt-0.5 mb-3">
            Link your registered college or university to verify your academic affiliation.
          </p>
          <button
            onClick={onEdit}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
          >
            Link Institution
          </button>
        </div>
      ) : (
        <>
          {/* Featured Institution Card Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3.5 rounded-xl bg-gray-50/70 dark:bg-neutral-950/60 border border-gray-200/70 dark:border-white/5">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <i className="fa-solid fa-building-columns text-xl"></i>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white truncate">
                  {name}
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                  Affiliated
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                {[regNumber ? `Reg: #${regNumber}` : '', joinedYear && passedOutYear ? `Batch: ${joinedYear}-${passedOutYear}` : ''].filter(Boolean).join(' • ') || 'Verified Student Member'}
              </p>
            </div>
          </div>

          {/* Real Detail Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                Institution Name
              </p>
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-0.5 truncate">
                {name}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                Registration / Student ID
              </p>
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100 font-mono mt-0.5">
                {regNumber || '—'}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                Graduation Year
              </p>
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                {passedOutYear || '—'}
              </p>
            </div>
          </div>

          {bio && (
            <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex items-start gap-2 text-xs">
              <span className="text-gray-400 font-semibold shrink-0">Academic Note:</span>
              <p className="text-gray-600 dark:text-gray-300 italic">{bio}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
