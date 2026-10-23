import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { UserInfoData } from '../../../../core/types/domain';
import { academicDetailsSchema, AcademicDetailsFormData } from '../../../../core/validation';
import { FormFieldError } from '../../../../shared/components/ui/FormFieldError';
import { InstitutionAutocomplete } from '../../../institutions/components/InstitutionAutocomplete';
import { GraduationCap, Hash, Calendar, FileText, X, Loader2 } from 'lucide-react';

export type AcademicFormData = AcademicDetailsFormData;

interface EditAcademicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AcademicDetailsFormData) => Promise<void>;
  initialData?: UserInfoData | null;
  defaultCollege?: string;
  defaultDegree?: string;
  defaultBranch?: string;
  submitting?: boolean;
}

export const EditAcademicModal: React.FC<EditAcademicModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  defaultCollege = '',
  submitting = false,
}) => {
  const currentYear = new Date().getFullYear();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AcademicDetailsFormData>({
    resolver: zodResolver(academicDetailsSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      regNumber: initialData?.regNumber || '',
      joinedYear: initialData?.joinedYear ? Number(initialData.joinedYear) : currentYear - 2,
      passedOutYear: initialData?.passedOutYear ? Number(initialData.passedOutYear) : currentYear + 2,
      college: initialData?.college || defaultCollege || '',
      collegeId: initialData?.collegeId !== undefined && initialData?.collegeId !== null ? String(initialData.collegeId) : '',
      bio: initialData?.bio || '',
    },
  });

  const watchedJoinedYear = Number(watch('joinedYear')) || currentYear - 2;
  const watchedPassedOutYear = Number(watch('passedOutYear')) || currentYear + 2;
  const watchedBio = watch('bio') || '';

  // Generate Year Options
  const joinedYearOptions = useMemo(() => {
    const list: number[] = [];
    for (let y = currentYear + 1; y >= 2000; y--) {
      list.push(y);
    }
    return list;
  }, [currentYear]);

  const passedOutYearOptions = useMemo(() => {
    const start = watchedJoinedYear || 2000;
    const end = Math.max(start + 8, currentYear + 6);
    const list: number[] = [];
    for (let y = start; y <= end; y++) {
      list.push(y);
    }
    return list;
  }, [watchedJoinedYear, currentYear]);

  // Adjust passedOutYear if it falls before joinedYear
  useEffect(() => {
    if (watchedPassedOutYear < watchedJoinedYear) {
      setValue('passedOutYear', watchedJoinedYear + 4, { shouldValidate: true });
    }
  }, [watchedJoinedYear, watchedPassedOutYear, setValue]);

  // Reset form when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      reset({
        regNumber: initialData?.regNumber || '',
        joinedYear: initialData?.joinedYear ? Number(initialData.joinedYear) : currentYear - 2,
        passedOutYear: initialData?.passedOutYear ? Number(initialData.passedOutYear) : currentYear + 2,
        college: initialData?.college || defaultCollege || '',
        collegeId: initialData?.collegeId !== undefined && initialData?.collegeId !== null ? String(initialData.collegeId) : '',
        bio: initialData?.bio || '',
      });
    }
  }, [isOpen, initialData, defaultCollege, reset, currentYear]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-academic-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in font-sans"
    >
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden text-left flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 id="edit-academic-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                Edit Academic Details
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Update your registration number, institution, and batch years.
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
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Registration Number */}
          <div>
            <label htmlFor="academic-reg-number" className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
              Registration / Roll Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Hash className="w-4 h-4" />
              </div>
              <input
                id="academic-reg-number"
                type="text"
                placeholder="e.g. 22CS101"
                aria-invalid={Boolean(errors.regNumber)}
                aria-describedby={errors.regNumber ? 'academic-reg-number-error' : undefined}
                {...register('regNumber')}
                className={`w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950 border ${
                  errors.regNumber
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
                } rounded-xl text-xs text-slate-900 dark:text-white font-mono uppercase focus:outline-none transition-colors`}
              />
            </div>
            <FormFieldError id="academic-reg-number-error" error={errors.regNumber?.message} />
          </div>

          {/* College / Institution Autocomplete Dropdown */}
          <div>
            <InstitutionAutocomplete
              id="academic-college-autocomplete"
              label="College or University Name"
              required
              placeholder="Search or type college name (min 3 characters)..."
              value={watch('college') || ''}
              error={errors.college?.message}
              onChange={(val, opt) => {
                setValue('college', val, { shouldValidate: true, shouldDirty: true });
                if (opt?.id) {
                  setValue('collegeId', String(opt.id), { shouldDirty: true });
                }
              }}
              onSelectOption={(opt) => {
                setValue('college', opt.name, { shouldValidate: true, shouldDirty: true });
                setValue('collegeId', String(opt.id), { shouldDirty: true });
              }}
            />
            {watch('collegeId') && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                College ID: #{watch('collegeId')}
              </p>
            )}
          </div>

          {/* Joined Year and Passed Out Year Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Joined Year Dropdown */}
            <div>
              <label htmlFor="academic-joined-year-select" className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                Joined Year <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <select
                  id="academic-joined-year-select"
                  aria-invalid={Boolean(errors.joinedYear)}
                  aria-describedby={errors.joinedYear ? 'academic-joined-year-error' : undefined}
                  {...register('joinedYear', { valueAsNumber: true })}
                  className={`w-full appearance-none pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-neutral-950 border ${
                    errors.joinedYear
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 focus:border-blue-500'
                  } rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none transition-colors cursor-pointer`}
                >
                  {joinedYearOptions.map((year) => (
                    <option key={year} value={year} className="bg-white dark:bg-neutral-900 text-slate-900 dark:text-white">
                      {year}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs">
                  ▼
                </div>
              </div>
              <FormFieldError id="academic-joined-year-error" error={errors.joinedYear?.message} />
            </div>

            {/* Passed Out / Graduation Year Dropdown */}
            <div>
              <label htmlFor="academic-passed-year-select" className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                Graduation Year <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <select
                  id="academic-passed-year-select"
                  aria-invalid={Boolean(errors.passedOutYear)}
                  aria-describedby={errors.passedOutYear ? 'academic-passed-year-error' : undefined}
                  {...register('passedOutYear', { valueAsNumber: true })}
                  className={`w-full appearance-none pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-neutral-950 border ${
                    errors.passedOutYear
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 focus:border-blue-500'
                  } rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none transition-colors cursor-pointer`}
                >
                  {passedOutYearOptions.map((year) => (
                    <option key={year} value={year} className="bg-white dark:bg-neutral-900 text-slate-900 dark:text-white">
                      {year}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs">
                  ▼
                </div>
              </div>
              <FormFieldError id="academic-passed-year-error" error={errors.passedOutYear?.message} />
            </div>
          </div>

          {/* Bio / Academic Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="academic-bio" className="block text-xs font-semibold text-slate-700 dark:text-gray-300">
                Academic Bio / Summary
              </label>
              <span className={`text-[10px] font-mono ${watchedBio.length > 500 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                {watchedBio.length} / 500
              </span>
            </div>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none text-slate-400">
                <FileText className="w-4 h-4" />
              </div>
              <textarea
                id="academic-bio"
                rows={3}
                placeholder="Briefly describe your programming interests, specializations, or learning goals..."
                aria-invalid={Boolean(errors.bio)}
                aria-describedby={errors.bio ? 'academic-bio-error' : undefined}
                {...register('bio')}
                className={`w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950 border ${
                  errors.bio
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
                } rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none transition-colors resize-none`}
              />
            </div>
            <FormFieldError id="academic-bio-error" error={errors.bio?.message} />
          </div>

          {/* Action buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-slate-100 dark:border-white/10 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting || isSubmitting}
              className="px-4 py-2.5 sm:py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer disabled:opacity-50 text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.98] rounded-xl shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting || isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Academic Info</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
