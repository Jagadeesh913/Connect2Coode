import React from 'react';
import { AdminModal } from '../AdminModal';
import { AdminBadge } from '../AdminBadge';
import type { Institution } from '../../../../core/types/domain';

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
      title={institution ? institution.name : 'Institution Details'}
      subtitle={institution ? `AISHE: ${institution.aisheCode} • ID: #${institution.id}` : 'Loading...'}
      maxWidth="lg"
    >
      {loading ? (
        <div className="py-12 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-3">
          <i className="fa-solid fa-spinner fa-spin text-lg text-blue-400"></i>
          <span>Retrieving full institution record...</span>
        </div>
      ) : !institution ? (
        <div className="py-8 text-center text-xs text-gray-400">
          No details found for this institution.
        </div>
      ) : (
        <div className="space-y-6 font-sans text-left">
          {/* Top badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide uppercase border ${
                institution.institutionType === 'UNIVERSITY'
                  ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              }`}
            >
              <i
                className={`fa-solid ${
                  institution.institutionType === 'UNIVERSITY' ? 'fa-building-columns' : 'fa-graduation-cap'
                } mr-1.5`}
              ></i>
              {institution.institutionType}
            </span>

            <AdminBadge variant={institution.isActive ? 'success' : 'neutral'}>
              {institution.isActive ? 'Active' : 'Inactive'}
            </AdminBadge>

            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-white/5 border border-white/10 text-gray-300">
              AISHE: {institution.aisheCode}
            </span>
          </div>

          {/* Core Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/[0.02] p-4 rounded-xl border border-white/5">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                State & District
              </p>
              <p className="text-xs font-medium text-white mt-1">
                {institution.district ? `${institution.district}, ` : ''}{institution.state}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Established Year
              </p>
              <p className="text-xs font-medium text-white mt-1">
                {institution.yearOfEstablishment || 'Not Specified'}
              </p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Official Website
              </p>
              {institution.website ? (
                <a
                  href={institution.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 hover:underline mt-1 inline-flex items-center gap-1.5 break-all"
                >
                  <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                  {institution.website}
                </a>
              ) : (
                <p className="text-xs text-gray-500 mt-1">No website provided</p>
              )}
            </div>

            {/* University affiliation if college */}
            {institution.institutionType === 'COLLEGE' && (
              <div className="sm:col-span-2 border-t border-white/5 pt-3 mt-1">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Affiliated University
                </p>
                <p className="text-xs font-medium text-white mt-1">
                  {institution.universityName ||
                    institution.university?.name ||
                    (institution.universityId ? `University ID: #${institution.universityId}` : 'Autonomous / Independent')}
                </p>
              </div>
            )}
          </div>

          {/* Audit trail */}
          <div className="border-t border-white/10 pt-4 text-[11px] text-gray-400 grid grid-cols-2 gap-3">
            <div>
              <span className="text-gray-500">Created:</span>{' '}
              <span className="text-gray-300">
                {institution.createdAt ? new Date(institution.createdAt).toLocaleDateString() : 'N/A'}
              </span>
              {institution.createdBy && (
                <span className="block text-[10px] text-gray-500">by {institution.createdBy}</span>
              )}
            </div>
            <div>
              <span className="text-gray-500">Last Updated:</span>{' '}
              <span className="text-gray-300">
                {institution.updatedAt ? new Date(institution.updatedAt).toLocaleDateString() : 'N/A'}
              </span>
              {institution.updatedBy && (
                <span className="block text-[10px] text-gray-500">by {institution.updatedBy}</span>
              )}
            </div>
          </div>

          {/* Footer button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </AdminModal>
  );
};
