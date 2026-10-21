import { RequestStatus } from '../../../shared/components/ui/RequestStatus';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminBadge } from '../components/AdminBadge';
import { AdminModal } from '../components/AdminModal';
import { AdminTable, Column } from '../components/AdminTable';
import {
  adminLanguageService,
  AdminLanguageItem,
  LanguageDropdownItem,
} from '../../../services/admin/adminLanguageService';
import { referenceService, ReferenceItem } from '../../../services/referenceService';
import { toast } from 'react-hot-toast';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { FormFieldError } from '../../../shared/components/ui/FormFieldError';
import { getActionableErrorMessage } from '../../../core/validation';
import {
  Languages,
  Plus,
  RotateCw,
  Edit3,
  PowerOff,
  Terminal,
  CheckCircle2,
  Code2,
} from 'lucide-react';

export const AdminLanguages: React.FC = () => {
  const [languages, setLanguages] = useState<AdminLanguageItem[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<LanguageDropdownItem[]>([]);
  const [refLanguages, setRefLanguages] = useState<ReferenceItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingLanguage, setEditingLanguage] = useState<AdminLanguageItem | null>(null);
  const [formReferenceId, setFormReferenceId] = useState<number>(5);
  const [formJudge0Id, setFormJudge0Id] = useState<number>(62);
  const [formVersion, setFormVersion] = useState<string>('Java 17');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formErrors, setFormErrors] = useState<{ referenceId?: string; judge0Id?: string }>({});
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Deactivate confirmation state
  const [languageToDeactivate, setLanguageToDeactivate] = useState<AdminLanguageItem | null>(null);
  const [submittingDeactivation, setSubmittingDeactivation] = useState<boolean>(false);

  const requestSequence = useRef(0);
  const fetchLanguagesData = useCallback(async () => {
    const requestId = ++requestSequence.current;
    setLoading(true);
    setError(null);
    try {
      const [langs, drop, refs] = await Promise.allSettled([
        adminLanguageService.getLanguages(),
        adminLanguageService.getLanguageDropdown(),
        referenceService.getByGroupCode('LANG'),
      ]);

      if (requestId !== requestSequence.current) return;
      if ([langs, drop, refs].some((result) => result.status === 'rejected')) setError('Some language data could not be loaded. Retry to refresh the registry and options.');
      if (langs.status === 'fulfilled') {
        const list = Array.isArray(langs.value) ? langs.value : [];
        setLanguages(list);
      }
      if (drop.status === 'fulfilled') {
        const dropList = Array.isArray(drop.value) ? drop.value : [];
        setActiveDropdown(dropList);
      }
      if (refs.status === 'fulfilled') {
        const refList = refs.value?.data || (Array.isArray(refs.value) ? refs.value : []);
        if (Array.isArray(refList)) setRefLanguages(refList);
      }
    } catch {
      toast.error('Failed to load language data.');
    } finally {
      if (requestId === requestSequence.current) setLoading(false);
    }
  }, []);

  const invalidateLanguageRequests = useCallback(() => {
    requestSequence.current += 1;
  }, []);

  useEffect(() => {
    fetchLanguagesData();
    return invalidateLanguageRequests;
  }, [fetchLanguagesData, invalidateLanguageRequests]);

  const handleOpenCreateModal = () => {
    setEditingLanguage(null);
    setFormReferenceId(refLanguages[0]?.id || 5);
    setFormJudge0Id(62);
    setFormVersion('Java 17');
    setFormIsActive(true);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (lang: AdminLanguageItem) => {
    setEditingLanguage(lang);
    setFormReferenceId(lang.referenceId || 5);
    setFormJudge0Id(lang.judge0LanguageId || 62);
    setFormVersion(lang.version || '');
    setFormIsActive(lang.isActive !== false);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSaveLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { referenceId?: string; judge0Id?: string } = {};
    if (!formReferenceId || isNaN(formReferenceId) || formReferenceId <= 0) {
      errors.referenceId = 'Select a valid language from the list.';
    }
    if (!formJudge0Id || isNaN(formJudge0Id) || formJudge0Id <= 0) {
      errors.judge0Id = 'Enter a valid numeric Judge0 Language ID.';
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    setSubmitting(true);
    try {
      if (editingLanguage && editingLanguage.id) {
        // Update Language (POST /api/v1/language with id)
        await adminLanguageService.updateLanguage({
          id: editingLanguage.id,
          referenceId: Number(formReferenceId),
          judge0LanguageId: Number(formJudge0Id),
          version: formVersion.trim() || undefined,
          isActive: formIsActive,
        });
        toast.success(`Language #${editingLanguage.id} updated successfully!`);
      } else {
        // Create Language (POST /api/v1/language without id)
        await adminLanguageService.createLanguage({
          referenceId: Number(formReferenceId),
          judge0LanguageId: Number(formJudge0Id),
          version: formVersion.trim() || undefined,
          isActive: formIsActive,
        });
        toast.success('Language registered successfully!');
      }
      setIsModalOpen(false);
      fetchLanguagesData();
    } catch (err: any) {
      toast.error(getActionableErrorMessage(err, 'Failed to save language.'));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeactivateLanguage = async () => {
    if (!languageToDeactivate?.id) return;
    setSubmittingDeactivation(true);
    try {
      await adminLanguageService.deleteLanguage(languageToDeactivate.id);
      toast.success(`Language #${languageToDeactivate.id} deactivated successfully.`);
      setLanguageToDeactivate(null);
      fetchLanguagesData();
    } catch (err: any) {
      toast.error(getActionableErrorMessage(err, 'Failed to deactivate language.'));
    } finally {
      setSubmittingDeactivation(false);
    }
  };

  const activeCount = languages.filter((l) => l.isActive !== false).length;

  const columns: Column<AdminLanguageItem>[] = [
    {
      header: 'Identifier',
      accessorKey: 'id',
      className: 'w-24 font-mono font-bold text-slate-400',
      cell: (row) => <span>#{row.id}</span>,
    },
    {
      header: 'Compiler Runtime',
      className: 'min-w-[200px]',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Code2 className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
              {row.languageName || 'Runtime'}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              Reference ID: {row.referenceId}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Version',
      className: 'w-36',
      cell: (row) => (
        <span className="font-mono text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
          {row.version || 'Latest'}
        </span>
      ),
    },
    {
      header: 'Judge0 Runtime ID',
      className: 'w-36',
      cell: (row) => (
        <AdminBadge variant="neutral" size="sm">
          <span className="font-mono text-[11px]">Judge0 #{row.judge0LanguageId}</span>
        </AdminBadge>
      ),
    },
    {
      header: 'Execution Status',
      className: 'w-28',
      cell: (row) => (
        <AdminBadge
          variant={row.isActive !== false ? 'success' : 'neutral'}
          dot
          size="sm"
        >
          {row.isActive !== false ? 'Active' : 'Disabled'}
        </AdminBadge>
      ),
    },
    {
      header: 'Actions',
      className: 'w-28 text-right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleOpenEditModal(row)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:border-blue-400 transition-colors shadow-2xs cursor-pointer"
            title="Edit Language"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          {row.isActive !== false && row.id && (
            <button
              onClick={() => setLanguageToDeactivate(row)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:border-rose-400 transition-colors shadow-2xs cursor-pointer"
              title="Deactivate Runtime"
            >
              <PowerOff className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 font-sans text-left pb-12">
      {/* Page Header */}
      <AdminPageHeader
        title="Execution Languages & Runtimes"
        description="Configure Judge0 compilation runtimes, language version mappings, and active compiler targets."
        badge={
          <AdminBadge variant="primary">
            {activeCount} Active / {languages.length} Registered
          </AdminBadge>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Register Language</span>
            </button>
            <button
              onClick={fetchLanguagesData}
              disabled={loading}
              className="p-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 shadow-xs"
              title="Refresh Data"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
            </button>
          </div>
        }
      />

      {/* Runtimes Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Total Runtimes</span>
            <Languages className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {languages.length}
          </div>
          <span className="text-[11px] text-slate-400">Total registered languages</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Active in Judge0</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {activeCount}
          </div>
          <span className="text-[11px] text-slate-400">Live execution endpoints</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Dropdown Mappings</span>
            <Terminal className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {activeDropdown.length}
          </div>
          <span className="text-[11px] text-slate-400">User problem dropdown options</span>
        </div>
      </div>

      {/* Languages Table */}
      <RequestStatus pending={loading} error={error} onRetry={fetchLanguagesData} label="Loading language registry…" />
      <AdminTable<AdminLanguageItem>
        columns={columns}
        data={languages}
        loading={loading}
        keyExtractor={(row) => row.id || `${row.referenceId}-${row.judge0LanguageId}`}
        emptyTitle="No Languages Found"
        emptyDescription="There are currently no languages registered in the platform database."
        emptyAction={
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register First Language</span>
          </button>
        }
      />

      {/* Modal: Create or Edit Language */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLanguage ? `Edit Language #${editingLanguage.id}` : 'Register Execution Language'}
        subtitle="Configure compiler details for Judge0 sandbox integration"
        icon={<Terminal className="w-5 h-5" />}
        maxWidth="md"
        footer={
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:justify-end">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveLanguage}
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingLanguage ? 'Update Language' : 'Register'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSaveLanguage} className="space-y-4 font-sans text-left">
          {/* Reference Language Select */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Reference Language <span className="text-rose-500">*</span>
            </label>
            <select
              value={formReferenceId}
              onChange={(e) => setFormReferenceId(Number(e.target.value))}
              disabled={submitting}
              className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {refLanguages.map((ref) => (
                <option key={ref.id} value={ref.id}>
                  {ref.refName} ({ref.refCode})
                </option>
              ))}
              {refLanguages.length === 0 && <option value="5">Java (5)</option>}
            </select>
            <FormFieldError error={formErrors.referenceId} />
          </div>

          {/* Judge0 Language ID */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Judge0 Compiler ID <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={formJudge0Id}
              onChange={(e) => setFormJudge0Id(Number(e.target.value))}
              placeholder="e.g. 62 for Java 17, 71 for Python 3"
              disabled={submitting}
              className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <span className="text-[11px] text-slate-400">
              Corresponds to Judge0 CE language ID mapping.
            </span>
            <FormFieldError error={formErrors.judge0Id} />
          </div>

          {/* Version */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Display Version
            </label>
            <input
              type="text"
              value={formVersion}
              onChange={(e) => setFormVersion(e.target.value)}
              placeholder="e.g. OpenJDK 17, Python 3.10"
              disabled={submitting}
              className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Active Status */}
          <div className="pt-2 flex items-center gap-3">
            <input
              type="checkbox"
              id="lang-is-active"
              checked={formIsActive}
              onChange={(e) => setFormIsActive(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded-md border-slate-300 dark:border-slate-700 focus:ring-blue-500 cursor-pointer"
            />
            <label
              htmlFor="lang-is-active"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Active for problem submissions
            </label>
          </div>
        </form>
      </AdminModal>

      {/* Confirmation Dialog: Deactivate */}
      <ConfirmDialog
        isOpen={Boolean(languageToDeactivate)}
        title="Deactivate Compiler Runtime"
        message={`Are you sure you want to deactivate ${languageToDeactivate?.languageName || 'this language'}? It will be removed from user dropdown options.`}
        confirmText={submittingDeactivation ? 'Deactivating...' : 'Deactivate'}
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDeactivateLanguage}
        onClose={() => setLanguageToDeactivate(null)}
      />
    </div>
  );
};

export default AdminLanguages;
