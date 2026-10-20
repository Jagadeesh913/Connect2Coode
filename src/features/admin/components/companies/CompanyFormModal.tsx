import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AdminModal } from '../AdminModal';
import { CompanyItem } from '../../../../services/admin/adminCompanyService';
import { adminCompanySchema, AdminCompanyFormData } from '../../../../core/validation';
import { FormFieldError } from '../../../../shared/components/ui/FormFieldError';
import { Building2, Globe, Image, FileText, CheckCircle2 } from 'lucide-react';

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
        websiteUrl: initialData.websiteUrl || (initialData as any).website || '',
        logoUrl: initialData.logoUrl || (initialData as any).logo || '',
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

  const currentLogoUrl = watch('logoUrl');

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Company #${initialData?.id}` : 'Register Hiring Company'}
      subtitle="Configure target company profile for DSA problem tagging"
      icon={<Building2 className="w-5 h-5" />}
      maxWidth="lg"
      footer={
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer font-sans shadow-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit(handleFormSubmit)}
            disabled={submitting}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer font-sans disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? 'Saving...' : isEditing ? 'Update Company' : 'Create Company'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 font-sans text-left">
        {/* Preset Company Selector */}
        {!isEditing && availableCompanies.length > 0 && (
          <div className="space-y-1.5 p-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Autofill from Indexed Companies
            </label>
            <select
              onChange={(e) => {
                const found = availableCompanies.find((c) => String(c.id) === e.target.value);
                if (found) handleSelectPreset(found);
              }}
              defaultValue=""
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choose a company template --</option>
              {availableCompanies.map((c) => (
                <option key={c.id ?? c.name} value={c.id ?? ''}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Company Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Company Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              {...register('name')}
              placeholder="e.g. Google, Amazon, Microsoft"
              className={`w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border ${
                errors.name
                  ? 'border-rose-500 bg-rose-50/20'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80'
              } text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all`}
            />
          </div>
          <FormFieldError error={errors.name?.message} />
        </div>

        {/* Website URL */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Website URL
          </label>
          <div className="relative flex items-center">
            <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="url"
              {...register('websiteUrl')}
              placeholder="https://careers.google.com"
              className={`w-full pl-10 pr-3.5 py-2.5 text-xs font-semibold rounded-xl border ${
                errors.websiteUrl
                  ? 'border-rose-500 bg-rose-50/20'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80'
              } text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all font-mono`}
            />
          </div>
          <FormFieldError error={errors.websiteUrl?.message} />
        </div>

        {/* Logo URL with Live Preview */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Brand Logo URL
          </label>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 flex items-center justify-center shrink-0 shadow-xs">
              {currentLogoUrl ? (
                <img
                  src={currentLogoUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '/logo-mark-transparent.png';
                  }}
                />
              ) : (
                <Image className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div className="flex-1">
              <input
                type="url"
                {...register('logoUrl')}
                placeholder="https://example.com/logo.png"
                className={`w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border ${
                  errors.logoUrl
                    ? 'border-rose-500 bg-rose-50/20'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80'
                } text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all font-mono`}
              />
            </div>
          </div>
          <FormFieldError error={errors.logoUrl?.message} />
        </div>

        {/* Description / Hiring Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Description & Hiring Notes
          </label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Key patterns, interview rounds, DSA focus areas..."
            className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <FormFieldError error={errors.description?.message} />
        </div>

        {/* Active Toggle */}
        <div className="pt-2 flex items-center gap-3">
          <input
            type="checkbox"
            id="company-is-active"
            {...register('isActive')}
            className="w-4 h-4 text-blue-600 rounded-md border-slate-300 dark:border-slate-700 focus:ring-blue-500 cursor-pointer"
          />
          <label
            htmlFor="company-is-active"
            className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            Mark company as active for DSA tagging
          </label>
        </div>
      </form>
    </AdminModal>
  );
};
