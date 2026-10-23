import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { UserProfile } from '../../../../core/types/domain';
import { personalInfoSchema, PersonalInfoFormData } from '../../../../core/validation';
import { FormFieldError } from '../../../../shared/components/ui/FormFieldError';
import { User, Mail, FileText, X, Loader2, CheckCircle2, Calendar, Lock } from 'lucide-react';
import { useReferenceGroup } from '../../../references/hooks/useReferenceGroup';

interface EditPersonalInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PersonalInfoFormData) => Promise<void>;
  initialData?: (Omit<UserProfile, 'gender' | 'dob'> & { bio?: string; dob?: string | null; gender?: any }) | null;
  submitting?: boolean;
}

export const EditPersonalInfoModal: React.FC<EditPersonalInfoModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  submitting = false,
}) => {
  const { items: genderReferences, loading: gendersLoading, error: gendersError, retry: retryGenders } =
    useReferenceGroup('GENDER', isOpen);
  const genderOptions = genderReferences.filter((item) => item.isActive !== false);
  const [selectedGenderId, setSelectedGenderId] = useState<number | null>(() => {
    return initialData?.gender?.id ?? (initialData?.gender ? Number((initialData.gender as any).id) : null);
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      fullName: initialData?.fullName || initialData?.firstName || '',
      email: initialData?.email || '',
      dob: initialData?.dob ? String(initialData.dob).split('T')[0] : '',
      gender: initialData?.gender || null,
      bio: initialData?.bio || '',
    },
  });

  const watchedBio = watch('bio') || '';

  useEffect(() => {
    if (isOpen && initialData) {
      const activeGender = initialData.gender || null;
      const activeGenderId = activeGender?.id ?? (activeGender ? Number((activeGender as any).id) : null);
      setSelectedGenderId(activeGenderId);

      reset({
        fullName: initialData.fullName || initialData.firstName || '',
        email: initialData.email || '',
        dob: initialData.dob ? String(initialData.dob).split('T')[0] : '',
        gender: activeGender,
        bio: initialData.bio || '',
      });
    }
  }, [isOpen, initialData, reset]);

  const handleGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      setSelectedGenderId(null);
      setValue('gender', null, { shouldDirty: true });
      return;
    }
    const selectedId = Number(val);
    const matched = genderOptions.find((g) => g.id === selectedId) || null;
    setSelectedGenderId(selectedId);
    setValue('gender', matched, { shouldDirty: true });
  };

  if (!isOpen) return null;

  const handleFormSubmit = (data: PersonalInfoFormData) => {
    return onSubmit({
      ...data,
      fullName: initialData?.fullName || initialData?.firstName || data.fullName,
      email: initialData?.email || data.email,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-personal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in font-sans"
    >
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden text-left flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 id="edit-personal-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                Edit Personal Information
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Update your gender, date of birth, and profile bio.
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
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Full Name (Disabled / Read-only) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="personal-fullname" className="block text-xs font-semibold text-slate-700 dark:text-gray-300">
                Full Name
              </label>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                <Lock className="w-3 h-3" />
                Non-editable
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="personal-fullname"
                type="text"
                readOnly
                disabled
                value={initialData?.fullName || initialData?.firstName || ''}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-100 dark:bg-neutral-800/60 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed select-none focus:outline-none"
              />
            </div>
          </div>

          {/* Email Address (Disabled / Read-only) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="personal-email" className="block text-xs font-semibold text-slate-700 dark:text-gray-300">
                Email Address
              </label>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                  <Lock className="w-3 h-3" />
                  Non-editable
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="personal-email"
                type="email"
                readOnly
                disabled
                value={initialData?.email || ''}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-100 dark:bg-neutral-800/60 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed select-none focus:outline-none"
              />
            </div>
          </div>

          {/* Gender and Date of Birth */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Gender Dropdown */}
            <div>
              <label htmlFor="personal-gender-select" className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                Gender
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <select
                  id="personal-gender-select"
                  value={selectedGenderId ?? ''}
                  onChange={handleGenderChange}
                  disabled={gendersLoading}
                  className="w-full appearance-none pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 focus:border-blue-500 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none transition-colors cursor-pointer"
                >
                  <option value="" className="bg-white dark:bg-neutral-900 text-slate-400">
                    Select Gender
                  </option>
                  {genderOptions.map((g) => (
                    <option key={g.id} value={g.id} className="bg-white dark:bg-neutral-900 text-slate-900 dark:text-white">
                      {g.refName || g.refCode}
                    </option>
                  ))}
                </select>
                {gendersError && (
                  <button type="button" onClick={retryGenders} className="text-xs text-rose-600 hover:underline">
                    Unable to load gender options. Retry
                  </button>
                )}
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs">
                  ▼
                </div>
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="personal-dob" className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                Date of Birth
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  id="personal-dob"
                  type="date"
                  {...register('dob')}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none transition-colors"
                />
              </div>
            </div>
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
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
