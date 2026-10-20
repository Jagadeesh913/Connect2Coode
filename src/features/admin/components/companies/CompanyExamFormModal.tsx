import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { AdminModal } from '../AdminModal';
import { FormFieldError } from '../../../../shared/components/ui/FormFieldError';
import type { CompanyExamItem } from '../../../companies/types/companyExam';
import { GraduationCap, Calendar, Clock, FileText, Award, Globe } from 'lucide-react';

export interface CompanyExamFormData {
  id: number | null;
  companyId: number;
  examName: string;
  year: number;
  description: string;
  totalDurationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  sourceUrl: string;
  isActive: boolean;
}

interface CompanyExamFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CompanyExamFormData) => Promise<void>;
  companyId: number;
  companyName?: string;
  initialData?: CompanyExamItem | null;
  submitting?: boolean;
}

export const CompanyExamFormModal: React.FC<CompanyExamFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  companyId,
  companyName,
  initialData,
  submitting = false,
}) => {
  const isEditing = Boolean(initialData && initialData.id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompanyExamFormData>({
    defaultValues: {
      id: null,
      companyId,
      examName: '',
      year: new Date().getFullYear(),
      description: '',
      totalDurationMinutes: 120,
      totalQuestions: 60,
      totalMarks: 100,
      sourceUrl: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        id: initialData.id ? Number(initialData.id) : null,
        companyId: initialData.companyId ? Number(initialData.companyId) : companyId,
        examName: initialData.examName || '',
        year: initialData.year || new Date().getFullYear(),
        description: initialData.description || '',
        totalDurationMinutes: initialData.totalDurationMinutes ?? 120,
        totalQuestions: initialData.totalQuestions ?? 60,
        totalMarks: initialData.totalMarks ?? 100,
        sourceUrl: initialData.sourceUrl || '',
        isActive: initialData.isActive ?? true,
      });
    } else {
      reset({
        id: null,
        companyId,
        examName: '',
        year: new Date().getFullYear(),
        description: '',
        totalDurationMinutes: 120,
        totalQuestions: 60,
        totalMarks: 100,
        sourceUrl: '',
        isActive: true,
      });
    }
  }, [initialData, companyId, reset]);

  const handleFormSubmit = (data: CompanyExamFormData) => {
    onSubmit({
      ...data,
      companyId: Number(companyId),
      year: Number(data.year),
      totalDurationMinutes: Number(data.totalDurationMinutes),
      totalQuestions: Number(data.totalQuestions),
      totalMarks: Number(data.totalMarks),
      isActive: data.isActive !== false,
    });
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Exam #${initialData?.id}` : 'Create Recruitment Exam'}
      subtitle={companyName ? `For ${companyName} (Company #${companyId})` : `Company #${companyId}`}
      icon={<GraduationCap className="w-5 h-5 text-blue-600" />}
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
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer font-sans disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? 'Saving...' : isEditing ? 'Update Exam' : 'Save Exam'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 font-sans text-left">
        {/* Exam Name & Year */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Exam Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              {...register('examName', { required: 'Exam name is required' })}
              placeholder="e.g. TCS NQT, Amazon SDE Assessment"
              className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <FormFieldError error={errors.examName?.message} />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Year Edition <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="number"
                {...register('year', { required: 'Year is required', valueAsNumber: true })}
                className="w-full pl-8 pr-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Duration, Questions, Total Marks */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Duration (Minutes) <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="number"
                {...register('totalDurationMinutes', { required: true, valueAsNumber: true })}
                placeholder="120"
                className="w-full pl-8 pr-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Total Questions <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="number"
                {...register('totalQuestions', { required: true, valueAsNumber: true })}
                placeholder="65"
                className="w-full pl-8 pr-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Total Marks <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <Award className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="number"
                {...register('totalMarks', { required: true, valueAsNumber: true })}
                placeholder="100"
                className="w-full pl-8 pr-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Source Portal URL */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Official Exam / Careers URL
          </label>
          <div className="relative flex items-center">
            <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="url"
              {...register('sourceUrl')}
              placeholder="https://www.tcs.com/careers"
              className="w-full pl-10 pr-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Description & Exam Overview
          </label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Key syllabus highlights, assessment pattern notes..."
            className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Active Toggle */}
        <div className="pt-1 flex items-center gap-3">
          <input
            type="checkbox"
            id="exam-is-active"
            {...register('isActive')}
            className="w-4 h-4 text-blue-600 rounded-md border-slate-300 dark:border-slate-700 focus:ring-blue-500 cursor-pointer"
          />
          <label
            htmlFor="exam-is-active"
            className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            Mark exam as active and published for candidates
          </label>
        </div>
      </form>
    </AdminModal>
  );
};
