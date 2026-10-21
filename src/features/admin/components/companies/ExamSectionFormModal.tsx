import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { AdminModal } from '../AdminModal';
import { FormFieldError } from '../../../../shared/components/ui/FormFieldError';
import type { CompanyExamSectionItem } from '../../../companies/types/companyExam';
import { ListTree, Clock, FileText, Award, Hash } from 'lucide-react';

export interface ExamSectionFormData {
  id: number | null;
  companyExamId: number;
  parentSectionId: number | null;
  sectionName: string;
  sectionTypeId: number;
  questionTypeId: number | null;
  questionCount: number | null;
  durationMinutes: number | null;
  totalMarks: number | null;
  sequenceNumber: number;
}

interface ExamSectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExamSectionFormData) => Promise<void>;
  companyExamId: number;
  examName?: string;
  existingSections?: CompanyExamSectionItem[];
  initialData?: CompanyExamSectionItem | null;
  submitting?: boolean;
}

export const ExamSectionFormModal: React.FC<ExamSectionFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  companyExamId,
  examName,
  existingSections = [],
  initialData,
  submitting = false,
}) => {
  const isEditing = Boolean(initialData && initialData.id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExamSectionFormData>({
    defaultValues: {
      id: null,
      companyExamId,
      parentSectionId: null,
      sectionName: '',
      sectionTypeId: 100,
      questionTypeId: null,
      questionCount: null,
      durationMinutes: null,
      totalMarks: null,
      sequenceNumber: 1,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        id: initialData.id ? Number(initialData.id) : null,
        companyExamId: initialData.companyExamId ? Number(initialData.companyExamId) : companyExamId,
        parentSectionId: initialData.parentSectionId ? Number(initialData.parentSectionId) : null,
        sectionName: initialData.sectionName || '',
        sectionTypeId: initialData.sectionType?.id || 100,
        questionTypeId: initialData.questionType?.id || null,
        questionCount: initialData.questionCount ?? null,
        durationMinutes: initialData.durationMinutes ?? null,
        totalMarks: initialData.totalMarks ?? null,
        sequenceNumber: initialData.sequenceNumber || 1,
      });
    } else {
      reset({
        id: null,
        companyExamId,
        parentSectionId: null,
        sectionName: '',
        sectionTypeId: 100,
        questionTypeId: null,
        questionCount: null,
        durationMinutes: null,
        totalMarks: null,
        sequenceNumber: existingSections.length + 1,
      });
    }
  }, [initialData, companyExamId, existingSections.length, reset]);

  const handleFormSubmit = (data: ExamSectionFormData) => {
    onSubmit({
      ...data,
      companyExamId: Number(companyExamId),
      parentSectionId: data.parentSectionId ? Number(data.parentSectionId) : null,
      sectionTypeId: Number(data.sectionTypeId) || 100,
      questionTypeId: data.questionTypeId ? Number(data.questionTypeId) : null,
      questionCount: data.questionCount !== null && data.questionCount !== undefined && String(data.questionCount) !== '' ? Number(data.questionCount) : null,
      durationMinutes: data.durationMinutes !== null && data.durationMinutes !== undefined && String(data.durationMinutes) !== '' ? Number(data.durationMinutes) : null,
      totalMarks: data.totalMarks !== null && data.totalMarks !== undefined && String(data.totalMarks) !== '' ? Number(data.totalMarks) : null,
      sequenceNumber: Number(data.sequenceNumber) || 1,
    });
  };

  // Filter root sections eligible to be parents (cannot be itself)
  const candidateParents = existingSections.filter(
    (s) => !initialData?.id || s.id !== initialData.id
  );

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Section #${initialData?.id}` : 'Add Exam Section / Round'}
      subtitle={examName ? `For Exam: ${examName}` : `Exam #${companyExamId}`}
      icon={<ListTree className="w-5 h-5 text-blue-600" />}
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
            {submitting ? 'Saving...' : isEditing ? 'Update Section' : 'Save Section'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 font-sans text-left">
        {/* Section Name & Sequence */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-3 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Section / Round Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              {...register('sectionName', { required: 'Section name is required' })}
              placeholder="e.g. Cognitive Skills, SQL, Coding Round"
              className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <FormFieldError error={errors.sectionName?.message} />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Sequence # <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="number"
                {...register('sequenceNumber', { required: true, valueAsNumber: true })}
                className="w-full pl-8 pr-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Parent Round Selector (Hierarchy) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Parent Section / Round
          </label>
          <select
            {...register('parentSectionId', {
              setValueAs: (v) => (v === '' || v === 'null' ? null : Number(v)),
            })}
            className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- None (Top-Level Assessment Round) --</option>
            {candidateParents.map((parent) => (
              <option key={parent.id} value={parent.id}>
                Round #{parent.sequenceNumber || parent.id}: {parent.sectionName}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Select an existing round to nest this as a sub-section (e.g. SQL inside Technical Assessment).
          </p>
        </div>

        {/* Section Type & Question Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Section Classification
            </label>
            <select
              {...register('sectionTypeId', { valueAsNumber: true })}
              className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value={100}>Section (Sub-section / Module)</option>
              <option value={99}>Round (Comprehensive Assessment Stage)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Question Type Focus
            </label>
            <select
              {...register('questionTypeId', {
                setValueAs: (v) => (v === '' || v === 'null' ? null : Number(v)),
              })}
              className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- General / Multi-disciplinary --</option>
              <option value={89}>SQL Assessment</option>
              <option value={88}>MCQ / Aptitude</option>
              <option value={87}>Hands-on Coding</option>
            </select>
          </div>
        </div>

        {/* Duration, Questions Count, Total Marks */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Duration (Minutes)
            </label>
            <div className="relative flex items-center">
              <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="number"
                {...register('durationMinutes', {
                  setValueAs: (v) => (v === '' ? null : Number(v)),
                })}
                placeholder="e.g. 15"
                className="w-full pl-8 pr-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Question Count
            </label>
            <div className="relative flex items-center">
              <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="number"
                {...register('questionCount', {
                  setValueAs: (v) => (v === '' ? null : Number(v)),
                })}
                placeholder="e.g. 10"
                className="w-full pl-8 pr-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Total Marks
            </label>
            <div className="relative flex items-center">
              <Award className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="number"
                {...register('totalMarks', {
                  setValueAs: (v) => (v === '' ? null : Number(v)),
                })}
                placeholder="e.g. 10"
                className="w-full pl-8 pr-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>
        </div>
      </form>
    </AdminModal>
  );
};
