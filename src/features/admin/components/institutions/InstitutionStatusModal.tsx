import React from 'react';
import { AdminModal } from '../AdminModal';
import type { Institution } from '../../../../core/types/domain';

interface InstitutionStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  institution: Institution | null;
  submitting?: boolean;
}

export const InstitutionStatusModal: React.FC<InstitutionStatusModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  institution,
  submitting = false,
}) => {
  if (!isOpen || !institution) return null;

  const nextStatus = !institution.isActive;
  const isDeactivating = !nextStatus;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isDeactivating ? 'Deactivate Institution' : 'Activate Institution'}
      subtitle={`Institution #${institution.id} • ${institution.name}`}
      maxWidth="md"
    >
      <div className="space-y-4 font-sans text-left">
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            isDeactivating
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
          }`}
        >
          <i
            className={`fa-solid ${
              isDeactivating ? 'fa-triangle-exclamation text-rose-400' : 'fa-circle-check text-emerald-400'
            } text-base mt-0.5 shrink-0`}
          ></i>
          <div className="text-xs">
            <p className="font-semibold text-white">
              {isDeactivating
                ? 'Are you sure you want to deactivate this institution?'
                : 'Confirm institution reactivation'}
            </p>
            <p className="mt-1 text-gray-300 leading-relaxed">
              {isDeactivating
                ? 'Deactivating will immediately hide this institution from public student searches and registration autocomplete. Historical records will be preserved.'
                : 'Activating will immediately make this institution visible in student registration searches and dropdowns.'}
            </p>
          </div>
        </div>

        <div className="p-3 bg-neutral-950 rounded-xl border border-white/5 text-xs text-gray-300">
          <div className="flex justify-between py-1">
            <span className="text-gray-500">Institution:</span>
            <span className="font-medium text-white text-right">{institution.name}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-500">AISHE Code:</span>
            <span className="font-mono text-gray-300">{institution.aisheCode}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-500">New Status:</span>
            <span
              className={`font-bold ${
                nextStatus ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {nextStatus ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className={`flex items-center gap-2 px-5 py-2 text-white text-xs font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 ${
              isDeactivating
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
            }`}
          >
            {submitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                <span>Updating status...</span>
              </>
            ) : (
              <>
                <i
                  className={`fa-solid ${
                    isDeactivating ? 'fa-ban' : 'fa-check'
                  } text-xs`}
                ></i>
                <span>{isDeactivating ? 'Deactivate Institution' : 'Activate Institution'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </AdminModal>
  );
};
