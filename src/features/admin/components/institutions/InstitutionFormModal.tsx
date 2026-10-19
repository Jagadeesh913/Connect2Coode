import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AdminModal } from '../AdminModal';
import type { Institution } from '../../../../core/types/domain';
import { adminInstitutionSchema, AdminInstitutionFormData } from '../../../../core/validation';
import { FormFieldError } from '../../../../shared/components/ui/FormFieldError';
import { GraduationCap, Building2, MapPin, Globe } from 'lucide-react';

export type InstitutionFormValues = AdminInstitutionFormData;

interface InstitutionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InstitutionFormValues) => Promise<void>;
  initialData?: Institution | null;
  universities?: Institution[];
  submitting?: boolean;
  serverError?: { field?: string; message: string } | null;
}

export const InstitutionFormModal: React.FC<InstitutionFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  universities = [],
  submitting = false,
  serverError,
}) => {
  const isEditing = Boolean(initialData?.id);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<InstitutionFormValues>({
    resolver: zodResolver(adminInstitutionSchema) as any,
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      id: null,
      aisheCode: '',
      name: '',
      institutionType: 'COLLEGE',
      universityId: null,
      state: '',
      district: '',
      website: '',
      yearOfEstablishment: null,
      isActive: true,
    },
  });

  const selectedType = watch('institutionType');

  // Sync initial data on open/edit
  useEffect(() => {
    if (initialData) {
      reset({
        id: initialData.id,
        aisheCode: initialData.aisheCode || '',
        name: initialData.name || '',
        institutionType: initialData.institutionType || 'COLLEGE',
        universityId: initialData.universityId ?? null,
        state: initialData.state || '',
        district: initialData.district || '',
        website: initialData.website || '',
        yearOfEstablishment: initialData.yearOfEstablishment ?? null,
        isActive: initialData.isActive ?? true,
      });
    } else {
      reset({
        id: null,
        aisheCode: '',
        name: '',
        institutionType: 'COLLEGE',
        universityId: null,
        state: '',
        district: '',
        website: '',
        yearOfEstablishment: null,
        isActive: true,
      });
    }
  }, [initialData, reset]);

  // Handle server-side field error mappings (e.g. 409 duplicate AISHE code)
  useEffect(() => {
    if (serverError?.field) {
      setError(serverError.field as any, {
        type: 'server',
        message: serverError.message,
      });
    }
  }, [serverError, setError]);

  // Clean universityId if type switched to UNIVERSITY
  useEffect(() => {
    if (selectedType === 'UNIVERSITY') {
      setValue('universityId', null);
      clearErrors('universityId');
    }
  }, [selectedType, setValue, clearErrors]);

  const handleFormSubmit = async (values: InstitutionFormValues) => {
    await onSubmit({
      ...values,
      aisheCode: values.aisheCode.toUpperCase().trim(),
      universityId: values.institutionType === 'UNIVERSITY' ? null : values.universityId,
    });
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Institution #${initialData?.id}` : 'Register New Institution'}
      subtitle="Configure academic accreditation, AISHE identifier, and university affiliation"
      icon={<GraduationCap className="w-5 h-5" />}
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
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
            {submitting
              ? 'Saving Record...'
              : isEditing
              ? 'Update Institution'
              : 'Register Institution'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 font-sans text-left">
        {/* AISHE Code & Type Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              AISHE Code <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                {...register('aisheCode')}
                placeholder="e.g. C-12345 or U-0123"
                className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border ${
                  errors.aisheCode
                    ? 'border-rose-500 bg-rose-50/20'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80'
                } text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono uppercase transition-all`}
              />
            </div>
            <FormFieldError error={errors.aisheCode?.message} />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Institution Type <span className="text-rose-500">*</span>
            </label>
            <select
              {...register('institutionType')}
              className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="COLLEGE">College</option>
              <option value="UNIVERSITY">University</option>
            </select>
            <FormFieldError error={errors.institutionType?.message} />
          </div>
        </div>

        {/* Institution Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Institution Official Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            {...register('name')}
            placeholder="e.g. National Institute of Technology"
            className={`w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border ${
              errors.name
                ? 'border-rose-500 bg-rose-50/20'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80'
            } text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all`}
          />
          <FormFieldError error={errors.name?.message} />
        </div>

        {/* Affiliated University (Only if College) */}
        {selectedType === 'COLLEGE' && (
          <div className="space-y-1.5 p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Affiliated Parent University (Optional)
            </label>
            <select
              {...register('universityId', {
                setValueAs: (v) => (v === '' || v === null || isNaN(Number(v)) ? null : Number(v)),
              })}
              className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Autonomous / None --</option>
              {universities.map((uni) => (
                <option key={uni.id} value={uni.id}>
                  {uni.name} ({uni.aisheCode})
                </option>
              ))}
            </select>
            <FormFieldError error={errors.universityId?.message} />
          </div>
        )}

        {/* Location: State & District */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              State <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              {...register('state')}
              placeholder="e.g. Karnataka, Maharashtra"
              className={`w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border ${
                errors.state
                  ? 'border-rose-500 bg-rose-50/20'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80'
              } text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all`}
            />
            <FormFieldError error={errors.state?.message} />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              District <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              {...register('district')}
              placeholder="e.g. Bengaluru Urban, Pune"
              className={`w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border ${
                errors.district
                  ? 'border-rose-500 bg-rose-50/20'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80'
              } text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all`}
            />
            <FormFieldError error={errors.district?.message} />
          </div>
        </div>

        {/* Website & Year of Establishment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Official Website
            </label>
            <input
              type="url"
              {...register('website')}
              placeholder="https://institution.edu.in"
              className={`w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border ${
                errors.website
                  ? 'border-rose-500 bg-rose-50/20'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80'
              } text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all font-mono`}
            />
            <FormFieldError error={errors.website?.message} />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Year of Establishment
            </label>
            <input
              type="number"
              {...register('yearOfEstablishment', {
                setValueAs: (v) => (v === '' || isNaN(Number(v)) ? null : Number(v)),
              })}
              placeholder="e.g. 1960"
              className={`w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border ${
                errors.yearOfEstablishment
                  ? 'border-rose-500 bg-rose-50/20'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80'
              } text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all font-mono`}
            />
            <FormFieldError error={errors.yearOfEstablishment?.message} />
          </div>
        </div>

        {/* Active Toggle */}
        <div className="pt-2 flex items-center gap-3">
          <input
            type="checkbox"
            id="institution-is-active"
            {...register('isActive')}
            className="w-4 h-4 text-blue-600 rounded-md border-slate-300 dark:border-slate-700 focus:ring-blue-500 cursor-pointer"
          />
          <label
            htmlFor="institution-is-active"
            className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            Mark institution as active for student registration
          </label>
        </div>
      </form>
    </AdminModal>
  );
};
