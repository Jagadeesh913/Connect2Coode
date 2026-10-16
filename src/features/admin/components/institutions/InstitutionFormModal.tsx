import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AdminModal } from '../AdminModal';
import type { Institution } from '../../../../core/types/domain';
import { adminInstitutionSchema, AdminInstitutionFormData } from '../../../../core/validation';
import { FormFieldError } from '../../../../shared/components/ui/FormFieldError';

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

  // When type changes to UNIVERSITY, clear universityId
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
      name: values.name.trim(),
      state: values.state.trim(),
      district: values.district.trim(),
      website: values.website?.trim() || undefined,
      yearOfEstablishment: values.yearOfEstablishment ? Number(values.yearOfEstablishment) : null,
      universityId: values.institutionType === 'COLLEGE' && values.universityId ? Number(values.universityId) : null,
    });
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Institution #${initialData?.id}` : 'Create Institution'}
      subtitle={
        isEditing
          ? 'Update college or university details and affiliations'
          : 'Register a college or university into the common institution table'
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 font-sans text-left">
        {/* Type & AISHE Code */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="admin-inst-type" className="block text-xs font-semibold text-gray-300 mb-1">
              Institution Type <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <select
                id="admin-inst-type"
                {...register('institutionType')}
                className="w-full appearance-none px-3.5 pr-9 py-2 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer transition-colors shadow-2xs"
              >
                <option value="COLLEGE" className="bg-neutral-900 text-white">COLLEGE</option>
                <option value="UNIVERSITY" className="bg-neutral-900 text-white">UNIVERSITY</option>
              </select>
              <i className="fa-solid fa-chevron-down text-[10px] text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <FormFieldError id="admin-inst-type-error" error={errors.institutionType?.message} />
          </div>

          <div>
            <label htmlFor="admin-inst-aishe" className="block text-xs font-semibold text-gray-300 mb-1">
              AISHE Code <span className="text-rose-400">*</span>
            </label>
            <input
              id="admin-inst-aishe"
              type="text"
              placeholder="e.g. U-0043 or C-27955"
              aria-invalid={Boolean(errors.aisheCode)}
              aria-describedby={errors.aisheCode ? 'admin-inst-aishe-error' : undefined}
              {...register('aisheCode', {
                onChange: () => {
                  if (errors.aisheCode) clearErrors('aisheCode');
                },
              })}
              className={`w-full px-3 py-2 bg-neutral-950 border ${
                errors.aisheCode ? 'border-rose-500 focus:border-rose-500' : 'border-white/10 focus:border-blue-500'
              } rounded-xl text-xs text-white focus:outline-none transition-colors uppercase font-mono`}
            />
            <FormFieldError id="admin-inst-aishe-error" error={errors.aisheCode?.message} />
          </div>
        </div>

        {/* Name */}
        <div>
          <label htmlFor="admin-inst-name" className="block text-xs font-semibold text-gray-300 mb-1">
            Institution Name <span className="text-rose-400">*</span>
          </label>
          <input
            id="admin-inst-name"
            type="text"
            placeholder="e.g. Vignan's Foundation for Science, Technology and Research"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'admin-inst-name-error' : undefined}
            {...register('name')}
            className={`w-full px-3 py-2 bg-neutral-950 border ${
              errors.name ? 'border-rose-500 focus:border-rose-500' : 'border-white/10 focus:border-blue-500'
            } rounded-xl text-xs text-white focus:outline-none transition-colors`}
          />
          <FormFieldError id="admin-inst-name-error" error={errors.name?.message} />
        </div>

        {/* Affiliated University (Visible only when type is COLLEGE) */}
        {selectedType === 'COLLEGE' && (
          <div>
            <label htmlFor="admin-inst-university" className="block text-xs font-semibold text-gray-300 mb-1">
              Affiliated University (Optional)
            </label>
            <div className="relative">
              <select
                id="admin-inst-university"
                value={watch('universityId') ?? ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : null;
                  setValue('universityId', val, { shouldValidate: true });
                }}
                className="w-full appearance-none px-3.5 pr-9 py-2 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer transition-colors shadow-2xs"
              >
                <option value="" className="bg-neutral-900 text-gray-400">None / Autonomous</option>
                {universities.map((u) => (
                  <option key={u.id} value={u.id} className="bg-neutral-900 text-white">
                    {u.name} ({u.aisheCode || `ID: ${u.id}`})
                  </option>
                ))}
              </select>
              <i className="fa-solid fa-chevron-down text-[10px] text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <FormFieldError id="admin-inst-university-error" error={errors.universityId?.message} />
            <p className="mt-1 text-[10px] text-gray-500">
              Only registered universities can be chosen as parent institutions.
            </p>
          </div>
        )}

        {/* State & District */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="admin-inst-state" className="block text-xs font-semibold text-gray-300 mb-1">
              State <span className="text-rose-400">*</span>
            </label>
            <input
              id="admin-inst-state"
              type="text"
              placeholder="e.g. Andhra Pradesh"
              aria-invalid={Boolean(errors.state)}
              aria-describedby={errors.state ? 'admin-inst-state-error' : undefined}
              {...register('state')}
              className={`w-full px-3 py-2 bg-neutral-950 border ${
                errors.state ? 'border-rose-500 focus:border-rose-500' : 'border-white/10 focus:border-blue-500'
              } rounded-xl text-xs text-white focus:outline-none transition-colors`}
            />
            <FormFieldError id="admin-inst-state-error" error={errors.state?.message} />
          </div>

          <div>
            <label htmlFor="admin-inst-district" className="block text-xs font-semibold text-gray-300 mb-1">
              District <span className="text-rose-400">*</span>
            </label>
            <input
              id="admin-inst-district"
              type="text"
              placeholder="e.g. Guntur"
              aria-invalid={Boolean(errors.district)}
              aria-describedby={errors.district ? 'admin-inst-district-error' : undefined}
              {...register('district')}
              className={`w-full px-3 py-2 bg-neutral-950 border ${
                errors.district ? 'border-rose-500 focus:border-rose-500' : 'border-white/10 focus:border-blue-500'
              } rounded-xl text-xs text-white focus:outline-none transition-colors`}
            />
            <FormFieldError id="admin-inst-district-error" error={errors.district?.message} />
          </div>
        </div>

        {/* Website & Year of Establishment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="admin-inst-website" className="block text-xs font-semibold text-gray-300 mb-1">
              Official Website (Optional)
            </label>
            <input
              id="admin-inst-website"
              type="url"
              placeholder="https://vignan.ac.in"
              aria-invalid={Boolean(errors.website)}
              aria-describedby={errors.website ? 'admin-inst-website-error' : undefined}
              {...register('website')}
              className={`w-full px-3 py-2 bg-neutral-950 border ${
                errors.website ? 'border-rose-500 focus:border-rose-500' : 'border-white/10 focus:border-blue-500'
              } rounded-xl text-xs text-white focus:outline-none transition-colors`}
            />
            <FormFieldError id="admin-inst-website-error" error={errors.website?.message} />
          </div>

          <div>
            <label htmlFor="admin-inst-year" className="block text-xs font-semibold text-gray-300 mb-1">
              Year of Establishment (Optional)
            </label>
            <input
              id="admin-inst-year"
              type="number"
              placeholder="e.g. 2008"
              aria-invalid={Boolean(errors.yearOfEstablishment)}
              aria-describedby={errors.yearOfEstablishment ? 'admin-inst-year-error' : undefined}
              {...register('yearOfEstablishment', { valueAsNumber: true })}
              className={`w-full px-3 py-2 bg-neutral-950 border ${
                errors.yearOfEstablishment ? 'border-rose-500 focus:border-rose-500' : 'border-white/10 focus:border-blue-500'
              } rounded-xl text-xs text-white focus:outline-none transition-colors`}
            />
            <FormFieldError id="admin-inst-year-error" error={errors.yearOfEstablishment?.message} />
          </div>
        </div>

        {/* Status Toggle */}
        <div className="flex items-center gap-3 pt-2">
          <input
            id="admin-inst-active"
            type="checkbox"
            {...register('isActive')}
            className="w-4 h-4 rounded-md bg-neutral-950 border-white/20 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <label htmlFor="admin-inst-active" className="text-xs text-gray-300 cursor-pointer select-none">
            Active Status (visible to students in registration and search)
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
          >
            {submitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin text-xs" aria-hidden="true" />
                <span>{isEditing ? 'Updating...' : 'Creating...'}</span>
              </>
            ) : (
              <span>{isEditing ? 'Save Changes' : 'Create Institution'}</span>
            )}
          </button>
        </div>
      </form>
    </AdminModal>
  );
};
