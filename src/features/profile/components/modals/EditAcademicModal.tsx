import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { UserInfoData } from '../../../../core/types/domain';
import { academicDetailsSchema, AcademicDetailsFormData } from '../../../../core/validation';
import { FormFieldError } from '../../../../shared/components/ui/FormFieldError';

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
  defaultDegree = '',
  defaultBranch = '',
  submitting = false,
}) => {
  const currentYear = new Date().getFullYear();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AcademicDetailsFormData>({
    resolver: zodResolver(academicDetailsSchema) as any,
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      regNumber: initialData?.regNumber || '',
      degree: defaultDegree || '',
      branch: defaultBranch || '',
      joinedYear: initialData?.joinedYear ? Number(initialData.joinedYear) : currentYear - 2,
      passedOutYear: initialData?.passedOutYear ? Number(initialData.passedOutYear) : currentYear + 2,
      college: initialData?.college || defaultCollege || '',
      bio: initialData?.bio || '',
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      reset({
        regNumber: initialData?.regNumber || '',
        degree: defaultDegree || '',
        branch: defaultBranch || '',
        joinedYear: initialData?.joinedYear ? Number(initialData.joinedYear) : currentYear - 2,
        passedOutYear: initialData?.passedOutYear ? Number(initialData.passedOutYear) : currentYear + 2,
        college: initialData?.college || defaultCollege || '',
        bio: initialData?.bio || '',
      });
    }
  }, [isOpen, initialData, defaultCollege, defaultDegree, defaultBranch, reset, currentYear]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-academic-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in font-sans"
    >
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden text-left">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/10">
          <div>
            <h3 id="edit-academic-modal-title" className="text-base font-bold text-gray-900 dark:text-white">
              Edit Academic Details
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Update your registration number, graduation year, and developer bio.
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
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Registration Number */}
            <div>
              <label htmlFor="academic-reg-number" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Registration Number <span className="text-rose-500">*</span>
              </label>
              <input
                id="academic-reg-number"
                type="text"
                placeholder="e.g. 22CS101"
                aria-invalid={Boolean(errors.regNumber)}
                aria-describedby={errors.regNumber ? 'academic-reg-number-error' : undefined}
                {...register('regNumber')}
                className={`w-full px-3.5 py-2 bg-gray-50 dark:bg-neutral-950 border ${
                  errors.regNumber ? 'border-rose-500 focus:border-rose-500' : 'border-gray-200 dark:border-white/10 focus:border-blue-500'
                } rounded-xl text-xs text-gray-900 dark:text-white font-mono uppercase focus:outline-none`}
              />
              <FormFieldError id="academic-reg-number-error" error={errors.regNumber?.message} />
            </div>

            {/* Degree */}
            <div>
              <label htmlFor="academic-degree" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Degree <span className="text-rose-500">*</span>
              </label>
              <input
                id="academic-degree"
                type="text"
                placeholder="e.g. B.Tech"
                aria-invalid={Boolean(errors.degree)}
                aria-describedby={errors.degree ? 'academic-degree-error' : undefined}
                {...register('degree')}
                className={`w-full px-3.5 py-2 bg-gray-50 dark:bg-neutral-950 border ${
                  errors.degree ? 'border-rose-500 focus:border-rose-500' : 'border-gray-200 dark:border-white/10 focus:border-blue-500'
                } rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none`}
              />
              <FormFieldError id="academic-degree-error" error={errors.degree?.message} />
            </div>

            {/* Branch / Major */}
            <div className="sm:col-span-2">
              <label htmlFor="academic-branch" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Branch / Major <span className="text-rose-500">*</span>
              </label>
              <input
                id="academic-branch"
                type="text"
                placeholder="e.g. Computer Science and Engineering"
                aria-invalid={Boolean(errors.branch)}
                aria-describedby={errors.branch ? 'academic-branch-error' : undefined}
                {...register('branch')}
                className={`w-full px-3.5 py-2 bg-gray-50 dark:bg-neutral-950 border ${
                  errors.branch ? 'border-rose-500 focus:border-rose-500' : 'border-gray-200 dark:border-white/10 focus:border-blue-500'
                } rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none`}
              />
              <FormFieldError id="academic-branch-error" error={errors.branch?.message} />
            </div>

            {/* Joined Year */}
            <div>
              <label htmlFor="academic-joined-year" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Joined Year <span className="text-rose-500">*</span>
              </label>
              <input
                id="academic-joined-year"
                type="number"
                placeholder="e.g. 2022"
                aria-invalid={Boolean(errors.joinedYear)}
                aria-describedby={errors.joinedYear ? 'academic-joined-year-error' : undefined}
                {...register('joinedYear', { valueAsNumber: true })}
                className={`w-full px-3.5 py-2 bg-gray-50 dark:bg-neutral-950 border ${
                  errors.joinedYear ? 'border-rose-500 focus:border-rose-500' : 'border-gray-200 dark:border-white/10 focus:border-blue-500'
                } rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none`}
              />
              <FormFieldError id="academic-joined-year-error" error={errors.joinedYear?.message} />
            </div>

            {/* Passed Out Year */}
            <div>
              <label htmlFor="academic-passed-year" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Passed Out / Graduation Year <span className="text-rose-500">*</span>
              </label>
              <input
                id="academic-passed-year"
                type="number"
                placeholder="e.g. 2026"
                aria-invalid={Boolean(errors.passedOutYear)}
                aria-describedby={errors.passedOutYear ? 'academic-passed-year-error' : undefined}
                {...register('passedOutYear', { valueAsNumber: true })}
                className={`w-full px-3.5 py-2 bg-gray-50 dark:bg-neutral-950 border ${
                  errors.passedOutYear ? 'border-rose-500 focus:border-rose-500' : 'border-gray-200 dark:border-white/10 focus:border-blue-500'
                } rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none`}
              />
              <FormFieldError id="academic-passed-year-error" error={errors.passedOutYear?.message} />
            </div>

            {/* College Name */}
            <div className="sm:col-span-2">
              <label htmlFor="academic-college" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                College / Institute Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="academic-college"
                type="text"
                placeholder="e.g. ABC Engineering College"
                aria-invalid={Boolean(errors.college)}
                aria-describedby={errors.college ? 'academic-college-error' : undefined}
                {...register('college')}
                className={`w-full px-3.5 py-2 bg-gray-50 dark:bg-neutral-950 border ${
                  errors.college ? 'border-rose-500 focus:border-rose-500' : 'border-gray-200 dark:border-white/10 focus:border-blue-500'
                } rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none`}
              />
              <FormFieldError id="academic-college-error" error={errors.college?.message} />
            </div>

            {/* Bio */}
            <div className="sm:col-span-2">
              <label htmlFor="academic-bio" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Developer Bio / Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="academic-bio"
                rows={3}
                placeholder="e.g. Java developer and coding enthusiast"
                aria-invalid={Boolean(errors.bio)}
                aria-describedby={errors.bio ? 'academic-bio-error' : undefined}
                {...register('bio')}
                className={`w-full px-3.5 py-2 bg-gray-50 dark:bg-neutral-950 border ${
                  errors.bio ? 'border-rose-500 focus:border-rose-500' : 'border-gray-200 dark:border-white/10 focus:border-blue-500'
                } rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none resize-none`}
              ></textarea>
              <FormFieldError id="academic-bio-error" error={errors.bio?.message} />
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
                <span>Save Academic Info</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
