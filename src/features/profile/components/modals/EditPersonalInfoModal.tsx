import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { UserProfile } from '../../../../core/types/domain';
import { personalInfoSchema, PersonalInfoFormData } from '../../../../core/validation';
import { FormFieldError } from '../../../../shared/components/ui/FormFieldError';
import { User, Mail, FileText, X, Loader2, CheckCircle2 } from 'lucide-react';

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
    watch,
    formState: { errors, isSubmitting },
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

  const watchedBio = watch('bio') || '';

  useEffect(() => {
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
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden text-left flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 id="edit-personal-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                Edit Personal Information
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Update your display name, verified email, and profile bio.
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
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Full Name */}
          <div>
            <label htmlFor="personal-fullname" className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="personal-fullname"
                type="text"
                placeholder="e.g. John Doe"
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={errors.fullName ? 'personal-fullname-error' : undefined}
                {...register('fullName')}
                className={`w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950 border ${
                  errors.fullName
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
                } rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none transition-colors`}
              />
            </div>
            <FormFieldError id="personal-fullname-error" error={errors.fullName?.message} />
          </div>

          {/* Email Address */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="personal-email" className="block text-xs font-semibold text-slate-700 dark:text-gray-300">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                Verified Account
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="personal-email"
                type="email"
                placeholder="developer@connect2code.in"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'personal-email-error' : undefined}
                {...register('email')}
                className={`w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950 border ${
                  errors.email
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
                } rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none transition-colors`}
              />
            </div>
            <FormFieldError id="personal-email-error" error={errors.email?.message} />
          </div>

          {/* Developer Bio */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="personal-bio" className="block text-xs font-semibold text-slate-700 dark:text-gray-300">
                Developer Bio / About
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
                id="personal-bio"
                rows={4}
                placeholder="Tell the community about your coding journey, skills, and aspirations..."
                aria-invalid={Boolean(errors.bio)}
                aria-describedby={errors.bio ? 'personal-bio-error' : undefined}
                {...register('bio')}
                className={`w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950 border ${
                  errors.bio
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
                } rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none transition-colors resize-none`}
              />
            </div>
            <FormFieldError id="personal-bio-error" error={errors.bio?.message} />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/10 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting || isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.98] rounded-xl shadow-md shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting || isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
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
