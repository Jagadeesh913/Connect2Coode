import React, { useCallback, useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Edit3, LibraryBig, Plus, RotateCw, Trash2 } from 'lucide-react';
import { toast } from '@/shared/notifications/toast';
import { useAppDispatch } from '../../../app/hooks';
import type {
  CreateReferenceItemRequest,
  ReferenceItem,
  UpdateReferenceItemRequest,
} from '../../../core/types/domain';
import {
  adminReferenceItemSchema,
  getActionableErrorMessage,
  type AdminReferenceItemFormData,
} from '../../../core/validation';
import {
  fetchReferenceGroup,
  invalidateReferenceGroup,
} from '../../references/redux/referenceSlice';
import { useReferenceGroup } from '../../references/hooks/useReferenceGroup';
import { adminReferenceService } from '../../../services/admin/adminReferenceService';
import { referenceService } from '../../../services/referenceService';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { C2CSelect } from '../../../shared/components/ui/C2CSelect';
import { FormFieldError } from '../../../shared/components/ui/FormFieldError';
import { RequestStatus } from '../../../shared/components/ui/RequestStatus';
import { AdminBadge } from '../components/AdminBadge';
import { AdminModal } from '../components/AdminModal';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminTable, type Column } from '../components/AdminTable';

const normalizeGroupCode = (value: string) => value.trim().toUpperCase();

export const AdminReferences: React.FC = () => {
  const dispatch = useAppDispatch();
  const [groupCodes, setGroupCodes] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ReferenceItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ReferenceItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const mutationPendingRef = useRef(false);
  const groupsRequestGenerationRef = useRef(0);
  const {
    items,
    loading: itemsLoading,
    error: itemsError,
    retry: retryItems,
  } = useReferenceGroup(selectedGroup, Boolean(selectedGroup));

  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors },
  } = useForm<z.input<typeof adminReferenceItemSchema>, unknown, AdminReferenceItemFormData>({
    resolver: zodResolver(adminReferenceItemSchema),
    defaultValues: {
      refGroupCode: '',
      refGroupName: '',
      refCode: '',
      refName: '',
      logoUrl: '',
      isActive: true,
    },
  });

  const loadGroups = useCallback(async (signal?: AbortSignal, preferredGroup?: string) => {
    const requestGeneration = ++groupsRequestGenerationRef.current;
    setGroupsLoading(true);
    setGroupsError(null);
    try {
      const response = await referenceService.getGroupCodes(signal);
      if (signal?.aborted || requestGeneration !== groupsRequestGenerationRef.current) return null;
      const codes = [...new Set(response.data.map(normalizeGroupCode).filter(Boolean))].sort();
      setGroupCodes(codes);
      setSelectedGroup((current) => {
        const preferred = preferredGroup ? normalizeGroupCode(preferredGroup) : '';
        if (preferred && codes.includes(preferred)) return preferred;
        if (current && codes.includes(current)) return current;
        return codes[0] || '';
      });
      return codes;
    } catch (error: unknown) {
      if (signal?.aborted || requestGeneration !== groupsRequestGenerationRef.current) return null;
      setGroupsError(getActionableErrorMessage(error, 'Failed to load reference groups.'));
      return null;
    } finally {
      if (!signal?.aborted && requestGeneration === groupsRequestGenerationRef.current) {
        setGroupsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadGroups(controller.signal);
    return () => controller.abort();
  }, [loadGroups]);

  const openCreate = () => {
    setEditingItem(null);
    const existingGroupItem = items.find((i) => i.refGroupName?.trim());
    reset({
      refGroupCode: selectedGroup,
      refGroupName: existingGroupItem?.refGroupName || '',
      refCode: '',
      refName: '',
      logoUrl: '',
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEdit = (item: ReferenceItem) => {
    setEditingItem(item);
    reset({
      id: item.id,
      refGroupCode: item.refGroupCode,
      refGroupName: item.refGroupName || '',
      refCode: item.refCode,
      refName: item.refName,
      logoUrl: item.logoUrl || '',
      isActive: item.isActive,
    });
    setModalOpen(true);
  };

  const refreshAfterMutation = async (groupCode: string, previousGroupCode?: string) => {
    dispatch(invalidateReferenceGroup(groupCode));
    if (previousGroupCode && previousGroupCode !== groupCode) {
      dispatch(invalidateReferenceGroup(previousGroupCode));
    }
    const codes = await loadGroups(undefined, groupCode);
    if (codes?.includes(groupCode)) {
      void dispatch(fetchReferenceGroup({ groupCode, force: true }));
    }
  };

  const saveItem = async (data: AdminReferenceItemFormData) => {
    if (mutationPendingRef.current) return;

    const refGroupCode = normalizeGroupCode(data.refGroupCode);
    const refCode = data.refCode.trim();
    const refName = data.refName.trim();
    const refGroupName = data.refGroupName?.trim() || '';
    const logoUrl = data.logoUrl?.trim() || null;

    if (!refGroupName) {
      setError('refGroupName', { type: 'required', message: 'Reference group name is required.' });
      return;
    }

    mutationPendingRef.current = true;
    setSubmitting(true);
    try {
      if (editingItem) {
        const payload: UpdateReferenceItemRequest = {
          id: editingItem.id,
          refGroupCode,
          refGroupName,
          refCode,
          refName,
          isActive: data.isActive,
          logoUrl,
        };
        await adminReferenceService.save(payload);
        toast.success(`${refCode} updated successfully.`);
      } else {
        const payload: CreateReferenceItemRequest = {
          refGroupCode,
          refGroupName,
          refCode,
          refName,
          isActive: data.isActive,
          logoUrl,
        };
        await adminReferenceService.save(payload);
        toast.success(`${refCode} created successfully.`);
      }
      setModalOpen(false);
      await refreshAfterMutation(refGroupCode, editingItem?.refGroupCode);
    } catch (error: unknown) {
      toast.error(getActionableErrorMessage(error, 'Failed to save the reference record.'));
    } finally {
      mutationPendingRef.current = false;
      setSubmitting(false);
    }
  };

  const hardDeleteItem = async () => {
    if (!itemToDelete || mutationPendingRef.current) return;
    mutationPendingRef.current = true;
    setDeleting(true);
    const groupCode = itemToDelete.refGroupCode;
    try {
      await adminReferenceService.hardDelete(groupCode, itemToDelete.refCode);
      toast.success(`${itemToDelete.refCode} permanently deleted.`);
      setItemToDelete(null);
      dispatch(invalidateReferenceGroup(groupCode));
      const codes = await loadGroups();
      if (codes?.includes(groupCode)) {
        void dispatch(fetchReferenceGroup({ groupCode, force: true }));
      }
    } catch (error: unknown) {
      toast.error(getActionableErrorMessage(error, 'Failed to permanently delete the reference record.'));
    } finally {
      mutationPendingRef.current = false;
      setDeleting(false);
    }
  };

  const columns: Column<ReferenceItem>[] = [
    {
      header: 'ID',
      className: 'w-20 font-mono',
      cell: (item) => <span>#{item.id}</span>,
    },
    {
      header: 'Logo',
      className: 'w-16 text-center',
      cell: (item) =>
        item.logoUrl ? (
          <div className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 flex items-center justify-center overflow-hidden mx-auto">
            <img
              src={item.logoUrl}
              alt={`${item.refName} logo`}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        ) : (
          <span className="text-[11px] text-slate-400 italic">None</span>
        ),
    },
    {
      header: 'Reference Code',
      className: 'min-w-[180px]',
      cell: (item) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 dark:text-white">{item.refCode}</span>
          <span className="text-[10px] text-slate-400 font-mono">{item.refGroupCode}</span>
        </div>
      ),
    },
    {
      header: 'Group Name',
      className: 'min-w-[160px]',
      cell: (item) => (
        <span className="text-xs text-slate-700 dark:text-slate-300">
          {item.refGroupName || <span className="text-slate-400 italic">Unspecified</span>}
        </span>
      ),
    },
    { header: 'Display Name', accessorKey: 'refName', className: 'min-w-[180px]' },
    {
      header: 'Status',
      className: 'w-28',
      cell: (item) => (
        <AdminBadge variant={item.isActive ? 'success' : 'neutral'} dot size="sm">
          {item.isActive ? 'Active' : 'Inactive'}
        </AdminBadge>
      ),
    },
    {
      header: 'Actions',
      className: 'w-28 text-right',
      cell: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => openEdit(item)}
            aria-label={`Edit ${item.refCode}`}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:border-blue-400"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setItemToDelete(item)}
            aria-label={`Permanently delete ${item.refCode}`}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:border-rose-400"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const refreshAll = () => {
    void loadGroups(undefined, selectedGroup);
    if (selectedGroup) void retryItems();
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-left">
      <AdminPageHeader
        title="Reference Library"
        description="Manage API-owned taxonomy groups and codes used by user and admin dropdowns. Creating a group requires its first reference record."
        badge={<AdminBadge variant="primary">{groupCodes.length} Groups</AdminBadge>}
        actions={
          <>
            <button type="button" onClick={openCreate} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Reference
            </button>
            <button type="button" onClick={refreshAll} disabled={groupsLoading || itemsLoading} aria-label="Refresh reference library" className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl disabled:opacity-50">
              <RotateCw className={`w-4 h-4 ${groupsLoading || itemsLoading ? 'animate-spin' : ''}`} />
            </button>
          </>
        }
      />

      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0D1322] p-4 sm:p-5">
        <label htmlFor="reference-group" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Reference group</label>
        <C2CSelect
          id="reference-group"
          value={selectedGroup}
          onChange={setSelectedGroup}
          disabled={groupsLoading || groupCodes.length === 0}
          placeholder={groupCodes.length === 0 ? 'No groups available' : 'Select reference group'}
          options={groupCodes.map((code) => ({ value: code, label: code }))}
          ariaLabel="Reference group"
          className="w-full sm:max-w-md"
          buttonClassName="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-white"
        />
        <RequestStatus pending={groupsLoading} error={groupsError} onRetry={() => void loadGroups()} label="Loading reference groups…" />
      </div>

      <RequestStatus pending={itemsLoading} error={itemsError} onRetry={() => void retryItems()} label={`Loading ${selectedGroup || 'reference'} codes…`} />
      <AdminTable
        columns={columns}
        data={items}
        loading={itemsLoading}
        keyExtractor={(item) => item.id}
        emptyTitle={selectedGroup ? `No ${selectedGroup} references found` : 'Select or create a reference group'}
        emptyDescription="A new group is created by saving its first reference code."
        emptyAction={<button type="button" onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl">Add First Reference</button>}
      />

      <AdminModal
        isOpen={modalOpen}
        onClose={() => !submitting && setModalOpen(false)}
        title={editingItem ? `Edit ${editingItem.refCode}` : 'Create Reference Record'}
        subtitle={editingItem ? 'Updates use the existing record ID.' : 'A new group must be created with at least one record.'}
        icon={<LibraryBig className="w-5 h-5" />}
        footer={
          <>
            <button type="button" onClick={() => setModalOpen(false)} disabled={submitting} className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold disabled:opacity-50">Cancel</button>
            <button type="submit" form="reference-item-form" disabled={submitting} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold disabled:opacity-50">{submitting ? 'Saving…' : editingItem ? 'Save Changes' : 'Create Reference'}</button>
          </>
        }
      >
        <form id="reference-item-form" onSubmit={handleSubmit(saveItem)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" htmlFor="refGroupCode">Group code</label>
            <input id="refGroupCode" {...register('refGroupCode')} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-xs text-slate-900 dark:text-white" placeholder="e.g. DIFF" />
            <FormFieldError error={errors.refGroupCode?.message} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" htmlFor="refGroupName">Group name <span className="text-rose-500">*</span></label>
            <input id="refGroupName" {...register('refGroupName')} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-xs text-slate-900 dark:text-white" placeholder="e.g. Difficulty Levels" />
            <FormFieldError error={errors.refGroupName?.message} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" htmlFor="refCode">Reference code</label>
            <input id="refCode" {...register('refCode')} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-xs text-slate-900 dark:text-white" placeholder="e.g. EASY" />
            <FormFieldError error={errors.refCode?.message} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" htmlFor="refName">Display name</label>
            <input id="refName" {...register('refName')} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-xs text-slate-900 dark:text-white" placeholder="e.g. Easy" />
            <FormFieldError error={errors.refName?.message} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold mb-1.5" htmlFor="logoUrl">Logo image URL (Optional)</label>
            <div className="flex items-center gap-3">
              <input
                id="logoUrl"
                type="url"
                {...register('logoUrl')}
                className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/logo.png"
              />
              {watch('logoUrl') && (
                <div className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                  <img
                    src={watch('logoUrl') || ''}
                    alt="Logo preview"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.opacity = '0.3';
                    }}
                  />
                </div>
              )}
            </div>
            <FormFieldError error={errors.logoUrl?.message} />
          </div>
          <label className="sm:col-span-2 flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" {...register('isActive')} className="h-4 w-4 rounded border-slate-300" /> Active
          </label>
        </form>
      </AdminModal>

      <ConfirmDialog
        isOpen={Boolean(itemToDelete)}
        onClose={() => !deleting && setItemToDelete(null)}
        onConfirm={hardDeleteItem}
        title="Permanently delete this reference?"
        description={itemToDelete ? `This is a hard delete of ${itemToDelete.refGroupCode}/${itemToDelete.refCode}. It cannot be undone and may affect every dropdown or record that uses this code.` : ''}
        confirmLabel="Permanently Delete"
        variant="danger"
        submitting={deleting}
      />
    </div>
  );
};

export default AdminReferences;
