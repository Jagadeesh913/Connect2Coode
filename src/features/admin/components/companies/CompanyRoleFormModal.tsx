import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { AdminModal } from '../AdminModal';
import { FormFieldError } from '../../../../shared/components/ui/FormFieldError';
import type { CompanyRoleItem } from '../../../companies/types/companyExam';
import { Briefcase, IndianRupee, Tag, FileText } from 'lucide-react';

export interface CompanyRoleFormData {
  id: number | null;
  companyExamId: number;
  roleName: string;
  roleCode: string;
  salary: string;
  description: string;
}

interface CompanyRoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CompanyRoleFormData) => Promise<void>;
  companyExamId: number;
  examName?: string;
  initialData?: CompanyRoleItem | null;
  submitting?: boolean;
}

export const CompanyRoleFormModal: React.FC<CompanyRoleFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  companyExamId,
  examName,
  initialData,
  submitting = false,
}) => {
  const isEditing = Boolean(initialData && initialData.id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompanyRoleFormData>({
    defaultValues: {
      id: null,
      companyExamId,
      roleName: '',
      roleCode: '',
      salary: '',
      description: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        id: initialData.id ? Number(initialData.id) : null,
        companyExamId: initialData.companyExamId ? Number(initialData.companyExamId) : companyExamId,
        roleName: initialData.roleName || '',
        roleCode: initialData.roleCode || '',
        salary: initialData.salary || '',
        description: initialData.description || '',
      });
    } else {
      reset({
        id: null,
        companyExamId,
        roleName: '',
        roleCode: '',
        salary: '',
        description: '',
      });
    }
  }, [initialData, companyExamId, reset]);

  const handleFormSubmit = (data: CompanyRoleFormData) => {
    onSubmit({
      ...data,
      companyExamId: Number(companyExamId),
      roleCode: data.roleCode.trim().toUpperCase(),
    });
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Role #${initialData?.id}` : 'Add Company Exam Role'}
      subtitle={examName ? `For Exam: ${examName} (Exam #${companyExamId})` : `Exam #${companyExamId}`}
      icon={<Briefcase className="w-5 h-5 text-indigo-600" />}
      maxWidth="md"
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
            {submitting ? 'Saving...' : isEditing ? 'Update Role' : 'Save Role'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 font-sans text-left">
        {/* Role Name & Code */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Role Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              {...register('roleName', { required: 'Role name is required' })}
              placeholder="e.g. Ninja, Digital, Prime"
              className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <FormFieldError error={errors.roleName?.message} />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Role Code <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                {...register('roleCode', { required: 'Role code is required' })}
                placeholder="NINJA"
                className="w-full pl-8 pr-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 uppercase font-mono"
              />
            </div>
            <FormFieldError error={errors.roleCode?.message} />
          </div>
        </div>

        {/* Salary / CTC Compensation */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Salary / CTC Package <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <IndianRupee className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              {...register('salary', { required: 'Salary package is required' })}
              placeholder="e.g. 3.36 - 3.6 LPA or UG: 7.0 LPA / PG: 7.3 LPA"
              className="w-full pl-8 pr-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all font-mono"
            />
          </div>
          <FormFieldError error={errors.salary?.message} />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Role Description & Scope
          </label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="e.g. Entry-level software engineer role across cloud, full-stack, and analytics..."
            className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
      </form>
    </AdminModal>
  );
};
