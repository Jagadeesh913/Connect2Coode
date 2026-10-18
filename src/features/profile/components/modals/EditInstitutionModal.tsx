import React, { useState } from 'react';
import { InstitutionAutocomplete } from '../../../institutions/components/InstitutionAutocomplete';
import type { Institution, InstitutionOptionDTO } from '../../../../core/types/domain';
import { FormFieldError } from '../../../../shared/components/ui/FormFieldError';
import { optionalUrlRule } from '../../../../core/validation';

interface EditInstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (institution: Partial<Institution>) => Promise<void>;
  initialData?: Institution | null;
  submitting?: boolean;
}

export const EditInstitutionModal: React.FC<EditInstitutionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  submitting = false,
}) => {
  const [selectedInst, setSelectedInst] = useState<Partial<Institution>>({
    id: initialData?.id,
    name: initialData?.name || '',
    aisheCode: initialData?.aisheCode || '',
    institutionType: initialData?.institutionType || 'COLLEGE',
    state: initialData?.state || '',
    district: initialData?.district || '',
    website: initialData?.website || '',
    yearOfEstablishment: initialData?.yearOfEstablishment || undefined,
    isActive: initialData?.isActive ?? true,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (initialData) {
      setSelectedInst({
        id: initialData.id,
        name: initialData.name || '',
        aisheCode: initialData.aisheCode || '',
        institutionType: initialData.institutionType || 'COLLEGE',
        state: initialData.state || '',
        district: initialData.district || '',
        website: initialData.website || '',
        yearOfEstablishment: initialData.yearOfEstablishment || undefined,
        isActive: initialData.isActive ?? true,
      });
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleSelectAutocomplete = (opt: InstitutionOptionDTO) => {
    setSelectedInst((prev) => ({
      ...prev,
      id: opt.id,
      name: opt.name,
      institutionType: opt.institutionType,
      state: opt.state,
      district: opt.district,
    }));
    setFormErrors((prev) => ({ ...prev, name: '' }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!selectedInst.name?.trim()) {
      errors.name = 'Please enter or select your college or university name.';
    }

    if (selectedInst.website?.trim()) {
      const urlCheck = optionalUrlRule('Website').safeParse(selectedInst.website.trim());
      if (!urlCheck.success) {
        errors.website = urlCheck.error.errors[0]?.message || 'Enter a valid website URL starting with http:// or https://';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    await onSubmit({
      ...selectedInst,
      name: selectedInst.name?.trim(),
      aisheCode: selectedInst.aisheCode ? selectedInst.aisheCode.toUpperCase().trim() : undefined,
      state: selectedInst.state?.trim(),
      district: selectedInst.district?.trim(),
      website: selectedInst.website?.trim() || undefined,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-institution-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in font-sans"
    >
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden text-left">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/10">
          <div>
            <h3 id="edit-institution-modal-title" className="text-base font-bold text-gray-900 dark:text-white">
              Edit Institution Information
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Search your college or university to link verified affiliations.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg"
          >
            <i className="fa-solid fa-xmark text-sm" aria-hidden="true" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <InstitutionAutocomplete
              id="profile-institution-search"
              label="Search College or University"
              value={selectedInst.name || ''}
              error={formErrors.name}
              onChange={(val, opt) => {
                if (opt) {
                  handleSelectAutocomplete(opt);
                } else {
                  setSelectedInst((prev) => ({ ...prev, name: val, id: undefined }));
                  if (!val.trim()) {
                    setFormErrors((prev) => ({ ...prev, name: 'Select your college or university from the search results.' }));
                  } else {
                    setFormErrors((prev) => ({ ...prev, name: '' }));
                  }
                }
              }}
              onSelectOption={handleSelectAutocomplete}
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Select from registered AISHE institutions for automatic verification.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="inst-aishe-code" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                AISHE Code
              </label>
              <input
                id="inst-aishe-code"
                type="text"
                value={selectedInst.aisheCode || ''}
                onChange={(e) => setSelectedInst({ ...selectedInst, aisheCode: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-900 dark:text-white font-mono uppercase focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="inst-type-select" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Institution Type
              </label>
              <div className="relative">
                <select
                  id="inst-type-select"
                  value={selectedInst.institutionType || 'COLLEGE'}
                  onChange={(e) => setSelectedInst({ ...selectedInst, institutionType: e.target.value as any })}
                  className="w-full appearance-none px-3.5 pr-9 py-2 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs transition-colors"
                >
                  <option value="COLLEGE" className="bg-white dark:bg-neutral-900 text-gray-900 dark:text-white">COLLEGE</option>
                  <option value="UNIVERSITY" className="bg-white dark:bg-neutral-900 text-gray-900 dark:text-white">UNIVERSITY</option>
                </select>
                <i className="fa-solid fa-chevron-down text-[10px] text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label htmlFor="inst-state" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                State
              </label>
              <input
                id="inst-state"
                type="text"
                value={selectedInst.state || ''}
                onChange={(e) => setSelectedInst({ ...selectedInst, state: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="inst-district" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                District
              </label>
              <input
                id="inst-district"
                type="text"
                value={selectedInst.district || ''}
                onChange={(e) => setSelectedInst({ ...selectedInst, district: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label htmlFor="inst-website" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Official Website
              </label>
              <input
                id="inst-website"
                type="url"
                placeholder="https://example.edu"
                aria-invalid={Boolean(formErrors.website)}
                aria-describedby={formErrors.website ? 'inst-website-error' : undefined}
                value={selectedInst.website || ''}
                onChange={(e) => {
                  setSelectedInst({ ...selectedInst, website: e.target.value });
                  if (formErrors.website) setFormErrors((prev) => ({ ...prev, website: '' }));
                }}
                className={`w-full px-3.5 py-2 bg-gray-50 dark:bg-neutral-950 border ${
                  formErrors.website ? 'border-rose-500 focus:border-rose-500' : 'border-gray-200 dark:border-white/10 focus:border-blue-500'
                } rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none`}
              />
              <FormFieldError id="inst-website-error" error={formErrors.website} />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin text-xs" aria-hidden="true" />
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
