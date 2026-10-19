import React, { useState, useEffect } from 'react';
import { InstitutionAutocomplete } from '../../../institutions/components/InstitutionAutocomplete';
import type { Institution, InstitutionOptionDTO } from '../../../../core/types/domain';
import { FormFieldError } from '../../../../shared/components/ui/FormFieldError';
import { Landmark, MapPin, Building, X, Loader2, CheckCircle2 } from 'lucide-react';

interface EditInstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (institution: Partial<Institution>) => Promise<void>;
  initialData?: Institution | null;
  defaultCollegeName?: string;
  submitting?: boolean;
}

export const EditInstitutionModal: React.FC<EditInstitutionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  defaultCollegeName = '',
  submitting = false,
}) => {
  const [selectedInst, setSelectedInst] = useState<Partial<Institution>>({
    id: initialData?.id,
    name: initialData?.name || defaultCollegeName || '',
    institutionType: initialData?.institutionType || 'COLLEGE',
    state: initialData?.state || '',
    district: initialData?.district || '',
    isActive: initialData?.isActive ?? true,
  });

  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setSelectedInst({
        id: initialData?.id,
        name: initialData?.name || defaultCollegeName || '',
        institutionType: initialData?.institutionType || 'COLLEGE',
        state: initialData?.state || '',
        district: initialData?.district || '',
        isActive: initialData?.isActive ?? true,
      });
      setErrorMessage('');
    }
  }, [isOpen, initialData, defaultCollegeName]);

  if (!isOpen) return null;

  const handleSelectAutocomplete = (opt: InstitutionOptionDTO) => {
    setSelectedInst({
      id: opt.id,
      name: opt.name,
      institutionType: opt.institutionType,
      state: opt.state,
      district: opt.district,
      isActive: true,
    });
    setErrorMessage('');
  };

  const handleInputChange = (val: string, opt?: InstitutionOptionDTO | null) => {
    if (opt) {
      handleSelectAutocomplete(opt);
    } else {
      setSelectedInst((prev) => ({
        ...prev,
        id: undefined,
        name: val,
      }));
      if (val.trim()) {
        setErrorMessage('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const collegeName = selectedInst.name?.trim();
    if (!collegeName || collegeName.length < 2) {
      setErrorMessage('Please search and select or enter a valid college or university name.');
      return;
    }

    await onSubmit({
      ...selectedInst,
      name: collegeName,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-institution-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in font-sans"
    >
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden text-left flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 id="edit-institution-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                Link / Update Institution
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Search your college or university to link verified academic affiliation.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Autocomplete Input */}
          <div>
            <InstitutionAutocomplete
              id="profile-institution-search"
              label="College or University Name"
              required
              placeholder="Search by college name, city or keyword..."
              value={selectedInst.name || ''}
              error={errorMessage}
              onChange={handleInputChange}
              onSelectOption={handleSelectAutocomplete}
            />
            <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-1.5 flex items-center gap-1.5">
              <span>💡</span>
              <span>Search across 2,800+ registered colleges and universities in the database.</span>
            </p>
          </div>

          {/* Selected Institution Preview Badge */}
          {selectedInst.name && selectedInst.name.trim().length > 0 && (
            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                      {selectedInst.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        Selected Affiliation
                      </span>
                    </div>
                  </div>
                </div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 shrink-0">
                  {selectedInst.institutionType || 'College'}
                </span>
              </div>

              {(selectedInst.state || selectedInst.district) && (
                <div className="pt-2 border-t border-blue-100 dark:border-blue-900/40 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>
                    {selectedInst.district ? `${selectedInst.district}, ` : ''}{selectedInst.state}
                  </span>
                </div>
              )}
            </div>
          )}

          <FormFieldError id="institution-form-error" error={errorMessage} />

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/10 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.98] rounded-xl shadow-md shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Institution</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
