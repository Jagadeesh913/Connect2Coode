import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { UserProfile } from '../../../../core/types/domain';
import { personalInfoSchema, PersonalInfoFormData } from '../../../../core/validation';
import { FormFieldError } from '../../../../shared/components/ui/FormFieldError';

interface EditPersonalInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PersonalInfoFormData) => Promise<void>;
  initialData?: (UserProfile & { bio?: string }) | null;
  submitting?: boolean;
}

export const EditPersonalInfoModal: React.FC<EditPersonalInfoModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  submitting = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema) as any,
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      fullName: initialData?.fullName || initialData?.firstName || '',
      email: initialData?.email || '',
      bio: initialData?.bio || '',
    },
  });

  React.useEffect(() => {
    if (isOpen && initialData) {
      reset({
        fullName: initialData.fullName || initialData.firstName || '',
        email: initialData.email || '',
        bio: initialData.bio || '',
      });
    }
  }, [isOpen, initialData, reset]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-personal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in font-sans"
    >
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden text-left">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/10">
          <div>
            <h3 id="edit-personal-modal-title" className="text-base font-bold text-gray-900 dark:text-white">
              Edit Personal Information
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Update your verified name, email address, and developer bio.
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
          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="personal-fullname" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="personal-fullname"
                type="text"
                placeholder="e.g. John Doe"
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={errors.fullName ? 'personal-fullname-error' : undefined}
                {...register('fullName')}
                className={`w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border ${
                  errors.fullName ? 'border-rose-500 focus:border-rose-500' : 'border-gray-200 dark:border-white/10 focus:border-blue-500'
                } rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none transition-colors`}
              />
              <FormFieldError id="personal-fullname-error" error={errors.fullName?.message} />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="personal-email" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                id="personal-email"
                type="email"
                placeholder="e.g. developer@connect2code.org"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'personal-email-error' : undefined}
                {...register('email')}
                className={`w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border ${
                  errors.email ? 'border-rose-500 focus:border-rose-500' : 'border-gray-200 dark:border-white/10 focus:border-blue-500'
                } rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none transition-colors`}
              />
              <FormFieldError id="personal-email-error" error={errors.email?.message} />
            </div>

            {/* Bio / About */}
            <div>
              <label htmlFor="personal-bio" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                About / Bio
              </label>
              <textarea
                id="personal-bio"
                rows={3}
                placeholder="Tell the community about your coding journey and interests..."
                aria-invalid={Boolean(errors.bio)}
                aria-describedby={errors.bio ? 'personal-bio-error' : undefined}
                {...register('bio')}
                className={`w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border ${
                  errors.bio ? 'border-rose-500 focus:border-rose-500' : 'border-gray-200 dark:border-white/10 focus:border-blue-500'
                } rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none transition-colors resize-none`}
              />
              <FormFieldError id="personal-bio-error" error={errors.bio?.message} />
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
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
