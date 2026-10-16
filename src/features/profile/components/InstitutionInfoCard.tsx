import React from 'react';
import type { UserProfile, Institution } from '../../../core/types/domain';

interface InstitutionInfoCardProps {
  profile: UserProfile | null;
  institution?: Institution | null;
  onEdit: () => void;
}

export const InstitutionInfoCard: React.FC<InstitutionInfoCardProps> = ({
  profile,
  institution,
  onEdit,
}) => {
  const name =
    institution?.name ||
    profile?.institution?.name ||
    profile?.collegeName ||
    '';

  const aisheCode = institution?.aisheCode || profile?.institution?.aisheCode || '';
  const type = institution?.institutionType || profile?.institution?.institutionType || '';
  const state = institution?.state || profile?.institution?.state || '';
  const district = institution?.district || profile?.institution?.district || '';
  const year = institution?.yearOfEstablishment || profile?.institution?.yearOfEstablishment;
  const website = institution?.website || profile?.institution?.website || '';
  const isActive = institution?.isActive ?? profile?.institution?.isActive ?? true;

  const hasInstitution = Boolean(name || aisheCode);

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
              Your college or university details help us provide relevant content and opportunities.
            </p>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:border-blue-500/50 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 bg-gray-50/50 dark:bg-white/5 transition-all shrink-0 cursor-pointer"
        >
          <i className="fa-solid fa-pen text-[10px]"></i>
          <span>{hasInstitution ? 'Edit' : 'Add Institution'}</span>
        </button>
      </div>

      {!hasInstitution ? (
        <div className="flex flex-col items-center justify-center p-6 text-center rounded-xl bg-gray-50/70 dark:bg-neutral-950/60 border border-gray-200/70 dark:border-white/5">
          <i className="fa-solid fa-building-columns text-3xl text-gray-400 dark:text-gray-600 mb-2"></i>
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300">No institution details linked yet</p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 max-w-sm mt-0.5 mb-3">
            Search and link your registered college or university to verify your academic affiliation.
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
                {isActive && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                {[aisheCode, type, [district, state].filter(Boolean).join(', ')].filter(Boolean).join(' • ') || '—'}
              </p>
            </div>
          </div>

          {/* Detail Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                AISHE Code
              </p>
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100 font-mono mt-0.5">
                {aisheCode || '—'}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                Institution Type
              </p>
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                {type || '—'}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                State
              </p>
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                {state || '—'}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                District
              </p>
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                {district || '—'}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                Year of Establishment
              </p>
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                {year || '—'}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                Website
              </p>
              {website ? (
                <a
                  href={website.startsWith('http') ? website : `https://${website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline mt-0.5 inline-flex items-center gap-1 truncate max-w-full"
                >
                  <span className="truncate">{website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                  <i className="fa-solid fa-arrow-up-right-from-square text-[9px] shrink-0"></i>
                </a>
              ) : (
                <p className="text-xs text-gray-400 mt-0.5">—</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
