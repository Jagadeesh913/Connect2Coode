import React from 'react';
import { AdminModal } from '../AdminModal';
import type { Institution } from '../../../../core/types/domain';
import { AlertCircle, CheckCircle2, PowerOff, Check, Loader2 } from 'lucide-react';

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
      icon={
        isDeactivating ? (
          <AlertCircle className="w-5 h-5 text-rose-500" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        )
      }
      maxWidth="md"
    >
      <div className="space-y-4 font-sans text-left">
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
            isDeactivating
              ? 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/40 text-rose-700 dark:text-rose-300'
              : 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300'
          }`}
        >
          {isDeactivating ? (
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          )}
          <div className="text-xs">
            <p className="font-bold text-slate-900 dark:text-white">
              {isDeactivating
                ? 'Are you sure you want to deactivate this institution?'
                : 'Confirm institution reactivation'}
            </p>
            <p className="mt-1 leading-relaxed opacity-90">
              {isDeactivating
                ? 'Deactivating will immediately hide this institution from public student searches and registration autocomplete. Historical records will be preserved.'
                : 'Activating will immediately make this institution visible in student registration searches and dropdowns.'}
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 space-y-2">
          <div className="flex justify-between py-0.5">
            <span className="text-slate-400 font-semibold">Institution Name:</span>
            <span className="font-bold text-slate-900 dark:text-white text-right">
              {institution.name}
            </span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-slate-400 font-semibold">AISHE Code:</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">
              {institution.aisheCode}
            </span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-slate-400 font-semibold">New Status:</span>
            <span
              className={`font-black ${
                nextStatus ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {nextStatus ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className={`flex items-center gap-2 px-5 py-2 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50 ${
              isDeactivating
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Updating status...</span>
              </>
            ) : (
              <>
                {isDeactivating ? (
                  <PowerOff className="w-3.5 h-3.5" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>{isDeactivating ? 'Deactivate Institution' : 'Activate Institution'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </AdminModal>
  );
};
