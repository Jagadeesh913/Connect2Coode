import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AdminModal } from '../AdminModal';
import { CompanyItem } from '../../../../services/admin/adminCompanyService';
import { adminCompanySchema, AdminCompanyFormData } from '../../../../core/validation';
import { FormFieldError } from '../../../../shared/components/ui/FormFieldError';

export type CompanyFormData = AdminCompanyFormData;

interface CompanyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CompanyFormData) => Promise<void>;
  initialData?: CompanyItem | null;
  availableCompanies?: CompanyItem[];
  submitting?: boolean;
}

export const CompanyFormModal: React.FC<CompanyFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  availableCompanies = [],
  submitting = false,
}) => {
  const isEditing = Boolean(initialData?.id);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(adminCompanySchema) as any,
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      id: null,
      name: '',
      websiteUrl: '',
      logoUrl: '',
      description: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        id: typeof initialData.id === 'number' ? initialData.id : (initialData.id ? Number(initialData.id) || null : null),
        name: initialData.name || '',
        websiteUrl: initialData.websiteUrl || '',
        logoUrl: initialData.logoUrl || '',
        description: initialData.description || '',
        isActive: initialData.isActive ?? true,
      });
    } else {
      reset({
        id: null,
        name: '',
        websiteUrl: '',
        logoUrl: '',
        description: '',
        isActive: true,
      });
    }
  }, [initialData, reset]);

  const handleSelectPreset = (company: CompanyItem) => {
    setValue('name', company.name, { shouldValidate: true, shouldDirty: true });
    setValue('logoUrl', company.logoUrl || '', { shouldValidate: true, shouldDirty: true });
    setValue('websiteUrl', company.websiteUrl || '', { shouldValidate: true, shouldDirty: true });
  };

  const handleFormSubmit = (data: CompanyFormData) => {
    onSubmit({
      ...data,
      isActive: data.isActive !== false,
    });
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Company #${initialData?.id}` : 'Add Target Hiring Company'}
      subtitle="Configure target company details for DSA tag questions"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 font-sans text-left">
        {/* Select Existing Company */}
        {!isEditing && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Existing Backend Companies
            </label>
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-2 rounded-xl bg-neutral-900 border border-white/5">
              {availableCompanies.map((company) => (
                <button
                  key={company.id || company.name}
                  type="button"
                  onClick={() => handleSelectPreset(company)}
                  className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-white/10 text-xs font-medium text-gray-300 hover:text-white flex items-center gap-2 border border-white/10 transition-all cursor-pointer"
                >
                  <img src={company.logoUrl || '/logo-mark-transparent.png'} alt={company.name} className="w-3.5 h-3.5 object-contain" />
                  <span>{company.name}</span>
                </button>
              ))}
            </div>
            {availableCompanies.length === 0 && (
              <p className="text-[11px] text-gray-500">No companies are currently available from the backend.</p>
            )}
          </div>
        )}

        {/* Company Name */}
        <div className="space-y-1">
          <label htmlFor="company-name-input" className="block text-xs font-semibold text-gray-300">Company Name *</label>
          <input
            id="company-name-input"
            type="text"
            placeholder="e.g. Google, Accenture, TCS"
            aria-invalid={errors.name ? 'true' : 'false'}
            aria-describedby={errors.name ? 'company-name-error' : undefined}
            className={`w-full bg-neutral-900 text-gray-100 placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm border transition-all focus:outline-none focus:ring-1 ${
              errors.name ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-white/10 focus:border-neutral-600 focus:ring-neutral-500'
            }`}
            {...register('name')}
          />
          <FormFieldError error={errors.name?.message} id="company-name-error" />
        </div>

        {/* Logo URL & Website Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="company-logo-input" className="block text-xs font-semibold text-gray-300">Logo Image URL</label>
            <input
              id="company-logo-input"
              type="text"
              placeholder="https://example.com/logo.png"
              aria-invalid={errors.logoUrl ? 'true' : 'false'}
              aria-describedby={errors.logoUrl ? 'company-logo-error' : undefined}
              className={`w-full bg-neutral-900 text-gray-100 placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm border transition-all focus:outline-none focus:ring-1 ${
                errors.logoUrl ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-white/10 focus:border-neutral-600 focus:ring-neutral-500'
              }`}
              {...register('logoUrl')}
            />
            <FormFieldError error={errors.logoUrl?.message} id="company-logo-error" />
          </div>

          <div className="space-y-1">
            <label htmlFor="company-website-input" className="block text-xs font-semibold text-gray-300">Official Website URL</label>
            <input
              id="company-website-input"
              type="text"
              placeholder="https://company.com"
              aria-invalid={errors.websiteUrl ? 'true' : 'false'}
              aria-describedby={errors.websiteUrl ? 'company-website-error' : undefined}
              className={`w-full bg-neutral-900 text-gray-100 placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm border transition-all focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-500 ${
                errors.websiteUrl ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-white/10 focus:border-neutral-600 focus:ring-neutral-500'
              }`}
              {...register('websiteUrl')}
            />
            <FormFieldError error={errors.websiteUrl?.message} id="company-website-error" />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label htmlFor="company-description-input" className="block text-xs font-semibold text-gray-300">Company Overview / Placement Context</label>
          <textarea
            id="company-description-input"
            rows={3}
            placeholder="Enter brief description of company hiring context..."
            aria-invalid={errors.description ? 'true' : 'false'}
            aria-describedby={errors.description ? 'company-desc-error' : undefined}
            className={`w-full bg-neutral-900 text-gray-100 placeholder-gray-500 rounded-xl p-3 text-sm border transition-all focus:outline-none focus:ring-1 leading-relaxed ${
              errors.description ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-white/10 focus:border-neutral-600 focus:ring-neutral-500'
            }`}
            {...register('description')}
          />
          <FormFieldError error={errors.description?.message} id="company-desc-error" />
        </div>

        {/* Active Toggle */}
        <div className="flex items-center gap-3 pt-1">
          <input
            type="checkbox"
            id="companyIsActiveToggle"
            className="w-4 h-4 rounded bg-neutral-900 border-white/10 text-neutral-300 focus:ring-neutral-500 cursor-pointer"
            checked={watch('isActive') !== false}
            onChange={(e) => setValue('isActive', e.target.checked, { shouldValidate: true, shouldDirty: true })}
          />
          <label htmlFor="companyIsActiveToggle" className="text-xs font-semibold text-gray-300 cursor-pointer select-none">
            Active for Problem Tagging (Published to users)
          </label>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-gray-300 border border-white/10 rounded-xl text-sm font-semibold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-neutral-100 text-neutral-900 hover:bg-[#b4f043] text-black font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md  disabled:opacity-50"
          >
            {submitting ? (
              <>
                <i className="fa-solid fa-spinner animate-spin text-xs"></i>
                <span>Saving...</span>
              </>
            ) : (
              <span>{isEditing ? 'Save Changes' : 'Create Company'}</span>
            )}
          </button>
        </div>
      </form>
    </AdminModal>
  );
};
