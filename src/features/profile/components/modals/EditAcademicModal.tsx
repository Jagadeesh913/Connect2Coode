import React, { useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import type { ReferenceItem, UserInfoData } from '../../../../core/types/domain';
import { academicDetailsSchema, AcademicDetailsFormData } from '../../../../core/validation';
import { FormFieldError } from '../../../../shared/components/ui/FormFieldError';
import { InstitutionAutocomplete } from '../../../institutions/components/InstitutionAutocomplete';
import {
  GraduationCap,
  Hash,
  Calendar,
  FileText,
  X,
  Loader2,
  User,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { useAccessibleDialog } from '../../../../shared/hooks/useAccessibleDialog';
import { C2CSelect } from '../../../../shared/components/ui/C2CSelect';

export type AcademicFormData = AcademicDetailsFormData;

interface EditAcademicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AcademicDetailsFormData) => Promise<void>;
  initialData?: UserInfoData | null;
  genderOptions?: ReferenceItem[];
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
  genderOptions = [],
  defaultCollege = '',
  submitting = false,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useAccessibleDialog(isOpen, onClose, dialogRef);
  const currentYear = new Date().getFullYear();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof academicDetailsSchema>, unknown, AcademicDetailsFormData>({
    resolver: zodResolver(academicDetailsSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      regNumber: initialData?.regNumber || '',
      joinedYear: initialData?.joinedYear ? Number(initialData.joinedYear) : currentYear - 2,
      passedOutYear: initialData?.passedOutYear ? Number(initialData.passedOutYear) : currentYear + 2,
      college: initialData?.college || initialData?.collegeName || defaultCollege || '',
      collegeId: initialData?.collegeId ?? null,
      genderId: initialData?.gender?.id ?? null,
      dob: initialData?.dob || '',
      bio: initialData?.bio || '',
    },
  });

  const watchedJoinedYear = Number(watch('joinedYear')) || currentYear - 2;
  const watchedPassedOutYear = Number(watch('passedOutYear')) || currentYear + 2;
  const watchedCollegeId = watch('collegeId');
  const watchedGenderId = watch('genderId');
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

  // Gender dropdown options
  const genderSelectOptions = useMemo(() => {
    const options = [{ value: 0, label: 'Select Gender (Optional)' }];
    genderOptions.forEach((item) => {
      if (item.isActive !== false) {
        options.push({ value: item.id, label: item.refName || item.refCode });
      }
    });
    return options;
  }, [genderOptions]);

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
        firstName: initialData?.firstName || '',
        lastName: initialData?.lastName || '',
        regNumber: initialData?.regNumber || '',
        joinedYear: initialData?.joinedYear ? Number(initialData.joinedYear) : currentYear - 2,
        passedOutYear: initialData?.passedOutYear ? Number(initialData.passedOutYear) : currentYear + 2,
        college: initialData?.college || initialData?.collegeName || defaultCollege || '',
        collegeId: initialData?.collegeId ?? null,
        genderId: initialData?.gender?.id ?? null,
        dob: initialData?.dob || '',
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
      <div
        ref={dialogRef}
        className="w-full max-w-xl bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden text-left flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 id="edit-academic-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                Edit Profile Details
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Update your personal information, institution affiliation, and academic details.
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
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Section 1: Personal Details */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Personal Details
            </h4>

            {/* First Name & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="academic-first-name" className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="academic-first-name"
                    type="text"
                    placeholder="e.g. Uday"
                    aria-invalid={Boolean(errors.firstName)}
                    aria-describedby={errors.firstName ? 'academic-first-name-error' : undefined}
                    {...register('firstName')}
                    className={`w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950 border ${
                      errors.firstName
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                        : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
                    } rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none transition-colors`}
                  />
                </div>
                <FormFieldError id="academic-first-name-error" error={errors.firstName?.message} />
              </div>

              <div>
                <label htmlFor="academic-last-name" className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  Last Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="academic-last-name"
                    type="text"
                    placeholder="e.g. Kumar"
                    aria-invalid={Boolean(errors.lastName)}
                    aria-describedby={errors.lastName ? 'academic-last-name-error' : undefined}
                    {...register('lastName')}
                    className={`w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950 border ${
                      errors.lastName
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                        : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
                    } rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none transition-colors`}
                  />
                </div>
                <FormFieldError id="academic-last-name-error" error={errors.lastName?.message} />
              </div>
            </div>

            {/* Gender & Date of Birth */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="academic-gender-select" className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  Gender
                </label>
                <C2CSelect
                  id="academic-gender-select"
                  value={watchedGenderId || 0}
                  onChange={(val) => {
                    const numVal = Number(val);
                    setValue('genderId', numVal > 0 ? numVal : null, { shouldValidate: true, shouldDirty: true });
                  }}
                  options={genderSelectOptions}
                  placeholder="Select Gender"
                  ariaLabel="Gender"
                  className="w-full"
                  buttonClassName={`rounded-xl py-2.5 pl-3 pr-3 text-xs bg-slate-50 dark:bg-neutral-950 ${
                    errors.genderId
                      ? 'border-rose-500'
                      : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                  leading={<Users className="w-4 h-4 text-slate-400" />}
                />
                <FormFieldError id="academic-gender-error" error={errors.genderId?.message} />
              </div>

              <div>
                <label htmlFor="academic-dob" className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  Date of Birth
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    id="academic-dob"
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    min="1950-01-01"
                    aria-invalid={Boolean(errors.dob)}
                    aria-describedby={errors.dob ? 'academic-dob-error' : undefined}
                    {...register('dob')}
                    className={`w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950 border ${
                      errors.dob
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                        : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
                    } rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none transition-colors`}
                  />
                </div>
                <FormFieldError id="academic-dob-error" error={errors.dob?.message} />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-white/5 pt-3 space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" />
              Academic & Institution Details
            </h4>

            {/* College / Institution Autocomplete Dropdown */}
            <div>
              <InstitutionAutocomplete
                id="academic-college-autocomplete"
                label="College or University Name"
                required
                placeholder="Search or type college name (min 3 characters)..."
                value={watch('college') || ''}
                error={errors.college?.message}
                onChange={(val, selectedOpt) => {
                  setValue('college', val, { shouldValidate: true, shouldDirty: true });
                  if (selectedOpt) {
                    setValue('collegeId', selectedOpt.id, { shouldValidate: true, shouldDirty: true });
                  } else if (!val) {
                    setValue('collegeId', null, { shouldValidate: true, shouldDirty: true });
                  }
                }}
                onSelectOption={(opt) => {
                  setValue('college', opt.name, { shouldValidate: true, shouldDirty: true });
                  setValue('collegeId', opt.id, { shouldValidate: true, shouldDirty: true });
                }}
              />
              {watchedCollegeId ? (
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Verified institution linked (ID: #{watchedCollegeId})</span>
                </div>
              ) : null}
            </div>

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
                  placeholder="e.g. 231FA07084"
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

            {/* Joined Year and Passed Out Year Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="academic-joined-year-select" className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  Joined Year <span className="text-rose-500">*</span>
                </label>
                <C2CSelect
                  id="academic-joined-year-select"
                  value={watchedJoinedYear}
                  onChange={(val) => setValue('joinedYear', Number(val), { shouldValidate: true })}
                  options={joinedYearOptions.map((year) => ({ value: year, label: String(year) }))}
                  placeholder="Select Joined Year"
                  ariaLabel="Joined year"
                  className="w-full"
                  buttonClassName={`rounded-xl py-2.5 pl-3 pr-3 text-xs bg-slate-50 dark:bg-neutral-950 ${
                    errors.joinedYear ? 'border-rose-500' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                  leading={<Calendar className="w-4 h-4 text-slate-400" />}
                />
                <FormFieldError id="academic-joined-year-error" error={errors.joinedYear?.message} />
              </div>

              <div>
                <label htmlFor="academic-passed-year-select" className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                  Graduation Year <span className="text-rose-500">*</span>
                </label>
                <C2CSelect
                  id="academic-passed-year-select"
                  value={watchedPassedOutYear}
                  onChange={(val) => setValue('passedOutYear', Number(val), { shouldValidate: true })}
                  options={passedOutYearOptions.map((year) => ({ value: year, label: String(year) }))}
                  placeholder="Select Graduation Year"
                  ariaLabel="Graduation year"
                  className="w-full"
                  buttonClassName={`rounded-xl py-2.5 pl-3 pr-3 text-xs bg-slate-50 dark:bg-neutral-950 ${
                    errors.passedOutYear ? 'border-rose-500' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                  leading={<Calendar className="w-4 h-4 text-slate-400" />}
                />
                <FormFieldError id="academic-passed-year-error" error={errors.passedOutYear?.message} />
              </div>
            </div>
          </div>

          {/* Section 3: Bio */}
          <div className="border-t border-slate-100 dark:border-white/5 pt-3 space-y-2">
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
                <span>Save Profile Info</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
