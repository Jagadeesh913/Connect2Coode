import React from 'react';
import { AdminModal } from '../AdminModal';
import { AdminBadge } from '../AdminBadge';
import type { Institution } from '../../../../core/types/domain';
import { Skeleton } from '../../../../shared/components/ui/Skeleton';
import {
  GraduationCap,
  Building2,
  Globe,
  MapPin,
  Calendar,
  ExternalLink,
} from 'lucide-react';

interface InstitutionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  institution: Institution | null;
  loading?: boolean;
}

export const InstitutionDetailsModal: React.FC<InstitutionDetailsModalProps> = ({
  isOpen,
  onClose,
  institution,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={institution ? institution.name : 'Institution Profile'}
      subtitle={
        institution
          ? `AISHE: ${institution.aisheCode} • Database ID: #${institution.id}`
          : 'Institution information'
      }
      icon={<GraduationCap className="w-5 h-5" />}
      maxWidth="lg"
      footer={
        <button
          onClick={onClose}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer font-sans shadow-xs"
        >
          Close Profile
        </button>
      }
    >
      {loading ? (
        <div role="status" aria-label="Loading institution details" className="space-y-4 py-2">
          <div className="flex gap-2"><Skeleton className="h-6 w-24 rounded-full" /><Skeleton className="h-6 w-20 rounded-full" /></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
          <Skeleton className="h-14 w-full" />
        </div>
      ) : !institution ? (
        <div className="py-8 text-center text-xs text-slate-500">
          No details found for this institution.
        </div>
      ) : (
        <div className="space-y-5 font-sans text-xs">
          {/* Status Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <AdminBadge
              variant={institution.institutionType === 'UNIVERSITY' ? 'purple' : 'primary'}
            >
              {institution.institutionType}
            </AdminBadge>

            <AdminBadge
              variant={institution.isActive ? 'success' : 'neutral'}
              dot
            >
              {institution.isActive ? 'Active Platform' : 'Inactive'}
            </AdminBadge>

            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              AISHE: {institution.aisheCode}
            </span>
          </div>

          {/* Core Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3 h-3 text-rose-500" /> State &amp; District
              </span>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                {institution.district ? `${institution.district}, ` : ''}{institution.state}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-500" /> Established Year
              </span>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                {institution.yearOfEstablishment || 'Not Specified'}
              </p>
            </div>

            {institution.website && (
              <div className="sm:col-span-2 space-y-1 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Globe className="w-3 h-3 text-blue-500" /> Web Portal
                </span>
                <a
                  href={institution.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1.5 font-mono truncate"
                >
                  <span className="truncate">{institution.website}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
            )}
          </div>

          {/* Affiliated University section if COLLEGE */}
          {institution.institutionType === 'COLLEGE' && (
            <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 rounded-2xl space-y-1.5">
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> Affiliated University
              </span>
              {institution.universityName || institution.university?.name ? (
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {institution.universityName || institution.university?.name}
                </p>
              ) : institution.universityId ? (
                <p className="text-xs font-mono text-slate-700 dark:text-slate-300">
                  Affiliated University ID: #{institution.universityId}
                </p>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Autonomous / No parent university affiliated.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </AdminModal>
  );
};
