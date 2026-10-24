import { RequestStatus } from '../../../shared/components/ui/RequestStatus';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminTable, Column } from '../components/AdminTable';
import { AdminBadge } from '../components/AdminBadge';
import { AdminErrorState } from '../components/AdminErrorState';
import { Pagination } from '../../../shared/components/ui/Pagination';
import { InstitutionFormModal, InstitutionFormValues } from '../components/institutions/InstitutionFormModal';
import { InstitutionDetailsModal } from '../components/institutions/InstitutionDetailsModal';
import { InstitutionStatusModal } from '../components/institutions/InstitutionStatusModal';
import { adminInstitutionService, InstitutionItem } from '../../../services/admin/adminInstitutionService';
import type { InstitutionType } from '../../../core/types/domain';
import { toast } from 'react-hot-toast';
import { getActionableErrorMessage } from '../../../core/validation';
import {
  GraduationCap,
  Plus,
  RotateCw,
  Search,
  Eye,
  Edit3,
  PowerOff,
  MapPin,
} from 'lucide-react';

export const AdminInstitutions: React.FC = () => {
  const [institutions, setInstitutions] = useState<InstitutionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Filters State
  const [query, setQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<InstitutionType | 'ALL'>('ALL');
  const [stateFilter, setStateFilter] = useState<string>('');
  const districtFilter = '';
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [availableUniversities, setAvailableUniversities] = useState<InstitutionItem[]>([]);

  // Debounced Filter Values
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [debouncedState, setDebouncedState] = useState<string>('');
  const [debouncedDistrict, setDebouncedDistrict] = useState<string>('');
  const instAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setDebouncedState(stateFilter.trim());
      setDebouncedDistrict(districtFilter.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, stateFilter, districtFilter]);

  // Modals State
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [selectedInstitution, setSelectedInstitution] = useState<InstitutionItem | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);
  const [editingInstitutionId, setEditingInstitutionId] = useState<string | number | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formServerError, setFormServerError] = useState<{ field?: string; message: string } | null>(null);

  /**
   * Fetches institutions with active filters and pagination
   */
  const fetchInstitutions = useCallback(async () => {
    instAbortRef.current?.abort();
    const controller = new AbortController();
    instAbortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const activeParam =
        activeFilter === 'ACTIVE' ? true : activeFilter === 'INACTIVE' ? false : undefined;

      const res = await adminInstitutionService.getInstitutions(
        {
          page,
          size,
          query: debouncedQuery || undefined,
          type: typeFilter !== 'ALL' ? typeFilter : undefined,
          state: debouncedState || undefined,
          district: debouncedDistrict || undefined,
          activeOnly: activeParam,
        },
        controller.signal
      );

      if (controller.signal.aborted) return;

      const responseData: any = res?.data || res;

      if (responseData && Array.isArray(responseData.content)) {
        const computedPages = Math.max(1, Number(responseData.totalPages) || 1);
        const total = Number(responseData.totalElements) || responseData.content.length;
        if (total > 0 && page >= computedPages) {
          setPage(computedPages - 1);
          return;
        }
        setInstitutions(responseData.content);
        setTotalPages(computedPages);
        setTotalElements(total);
      } else if (Array.isArray(responseData)) {
        setInstitutions(responseData);
        setTotalPages(Math.max(1, Math.ceil(responseData.length / size)));
        setTotalElements(responseData.length);
      } else {
        throw new Error('Unexpected institutions response format');
      }
    } catch (err: any) {
      if (controller.signal.aborted) return;
      setError(getActionableErrorMessage(err, 'Failed to fetch institutions.'));

    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [page, size, debouncedQuery, typeFilter, debouncedState, debouncedDistrict, activeFilter]);

  useEffect(() => {
    fetchInstitutions();
    return () => {
      instAbortRef.current?.abort();
    };
  }, [fetchInstitutions]);

  useEffect(() => {
    const controller = new AbortController();
    adminInstitutionService
      .getAllInstitutions({ type: 'UNIVERSITY', activeOnly: true }, controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) setAvailableUniversities(response.data);
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          toast.error(getActionableErrorMessage(err, 'Unable to load university options.'));
        }
      });
    return () => controller.abort();
  }, []);

  const inspectionId = useRef(0);
  useEffect(() => () => { inspectionId.current++; }, []);
  const handleInspect = async (id: number | string) => {
    const requestId = ++inspectionId.current;
    setSelectedInstitution(null);
    setDetailsLoading(true);
    setIsDetailsOpen(true);
    try {
      const res = await adminInstitutionService.getInstitutionById(id);
      if (requestId !== inspectionId.current) return;
      setSelectedInstitution(res.data);
    } catch (err: any) {
      if (requestId !== inspectionId.current) return;
      setIsDetailsOpen(false);
      toast.error(getActionableErrorMessage(err, 'Could not retrieve full institution details.'));
    } finally {
      if (requestId === inspectionId.current) setDetailsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedInstitution(null);
    setFormServerError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = async (inst: InstitutionItem) => {
    setFormServerError(null);
    setEditingInstitutionId(inst.id);
    try {
      const response = await adminInstitutionService.getInstitutionById(inst.id);
      if (!response.data?.id) {
        throw new Error(`Institution #${inst.id} returned an invalid detail response`);
      }
      setSelectedInstitution(response.data);
      setIsFormOpen(true);
    } catch (err: any) {
      toast.error(getActionableErrorMessage(err, 'Unable to load complete institution data for editing.'));
    } finally {
      setEditingInstitutionId(null);
    }
  };

  const handleOpenStatusModal = (inst: InstitutionItem) => {
    setSelectedInstitution(inst);
    setIsStatusModalOpen(true);
  };

  const handleFormSubmit = async (values: InstitutionFormValues) => {
    setSubmitting(true);
    setFormServerError(null);
    try {
      if (selectedInstitution?.id) {
        // PUT /api/v1/admin/institutions/{id}
        await adminInstitutionService.updateInstitution(selectedInstitution.id, {
          aisheCode: values.aisheCode,
          name: values.name,
          institutionType: values.institutionType,
          universityId: values.universityId,
          state: values.state,
          district: values.district,
          website: values.website || undefined,
          yearOfEstablishment: values.yearOfEstablishment || undefined,
          isActive: values.isActive,
        });
        toast.success(`Institution #${selectedInstitution.id} updated successfully!`);
      } else {
        // POST /api/v1/admin/institutions
        await adminInstitutionService.createInstitution({
          aisheCode: values.aisheCode,
          name: values.name,
          institutionType: values.institutionType,
          universityId: values.universityId,
          state: values.state,
          district: values.district,
          website: values.website || undefined,
          yearOfEstablishment: values.yearOfEstablishment || undefined,
          isActive: values.isActive,
        });
        toast.success('Institution created successfully!');
      }
      setIsFormOpen(false);
      await fetchInstitutions();
    } catch (err: any) {
      const fieldError = err?.response?.data?.errors?.[0];
      if (fieldError?.field) {
        setFormServerError({
          field: fieldError.field,
          message: fieldError.defaultMessage || 'Field validation failed',
        });
      } else {
        toast.error(getActionableErrorMessage(err, 'Failed to save institution record.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusToggleConfirm = async () => {
    if (!selectedInstitution?.id) return;
    setSubmitting(true);
    try {
      const nextStatus = !selectedInstitution.isActive;
      await adminInstitutionService.updateInstitutionStatus(selectedInstitution.id, nextStatus);
      toast.success(
        `Institution #${selectedInstitution.id} ${nextStatus ? 'activated' : 'deactivated'} successfully.`
      );
      setIsStatusModalOpen(false);
      await fetchInstitutions();
    } catch (err: any) {
      toast.error(getActionableErrorMessage(err, 'Failed to update institution status.'));
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<InstitutionItem>[] = [
    {
      header: 'AISHE Code',
      accessorKey: 'aisheCode',
      className: 'w-32 font-mono font-bold text-slate-800 dark:text-slate-200',
      cell: (row) => (
        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
          {row.aisheCode}
        </span>
      ),
    },
    {
      header: 'Institution Name',
      className: 'min-w-[240px]',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-slate-900 dark:text-white truncate">
              {row.name}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Database ID: #{row.id}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Type',
      className: 'w-28',
      cell: (row) => (
        <AdminBadge
          variant={row.institutionType === 'UNIVERSITY' ? 'purple' : 'primary'}
          size="sm"
        >
          {row.institutionType}
        </AdminBadge>
      ),
    },
    {
      header: 'Location',
      className: 'min-w-[160px]',
      cell: (row) => (
        <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">
            {row.district ? `${row.district}, ` : ''}{row.state}
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      className: 'w-28',
      cell: (row) => (
        <AdminBadge
          variant={row.isActive ? 'success' : 'neutral'}
          dot
          size="sm"
        >
          {row.isActive ? 'Active' : 'Inactive'}
        </AdminBadge>
      ),
    },
    {
      header: 'Actions',
      className: 'w-28 text-right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleInspect(row.id)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:border-blue-400 transition-colors shadow-2xs cursor-pointer"
            title="Inspect Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            disabled={editingInstitutionId !== null}
            aria-label={editingInstitutionId === row.id ? `Loading ${row.name} for editing` : `Edit ${row.name}`}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-600 hover:border-amber-400 transition-colors shadow-2xs cursor-pointer"
            title="Edit Institution"
          >
            {editingInstitutionId === row.id ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Edit3 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => handleOpenStatusModal(row)}
            className={`p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors shadow-2xs cursor-pointer ${
              row.isActive
                ? 'text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:border-rose-400'
                : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:border-emerald-400'
            }`}
            title={row.isActive ? 'Deactivate' : 'Activate'}
          >
            <PowerOff className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 font-sans text-left pb-12">
      <RequestStatus error={institutions.length ? error : null} onRetry={fetchInstitutions} />
      {/* Page Header */}
      <AdminPageHeader
        title="Partner Institutions & Colleges"
        description="Manage university accreditations, college affiliations, and AISHE identifiers for student placement governance."
        badge={
          <AdminBadge variant="primary">
            {totalElements} Institutions
          </AdminBadge>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Institution</span>
            </button>
            <button
              onClick={fetchInstitutions}
              disabled={loading}
              className="p-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 shadow-xs"
              title="Refresh Data"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
            </button>
          </div>
        }
      />

      {/* Filter Toolbar */}
      <div className="p-4 bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or AISHE code..."
            className="w-full pl-10 pr-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters Grid */}
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as any);
              setPage(0);
            }}
            className="w-full sm:w-auto px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Types</option>
            <option value="COLLEGE">Colleges</option>
            <option value="UNIVERSITY">Universities</option>
          </select>

          {/* State Filter */}
          <input
            type="text"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            placeholder="Filter State..."
            className="w-full sm:w-32 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />

          {/* Status Filter */}
          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value as any);
              setPage(0);
            }}
            className="w-full sm:w-auto px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>

          {/* Page Size */}
          <select
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value));
              setPage(0);
            }}
            className="w-full sm:w-auto px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && institutions.length === 0 && <AdminErrorState message={error} onRetry={fetchInstitutions} />}

      {/* Main Table */}
      {(!error || institutions.length > 0) && (
        <div className="space-y-4">
          <AdminTable<InstitutionItem>
            columns={columns}
            data={institutions}
            loading={loading}
            keyExtractor={(row) => row.id}
            onRowClick={(row) => handleInspect(row.id)}
            emptyTitle="No Institutions Found"
            emptyDescription="There are currently no institutions matching your active filter criteria."
            emptyAction={
              <button
                onClick={handleOpenCreate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register Institution</span>
              </button>
            }
          />

          {/* Pagination */}
          {totalElements > 0 && (
            <Pagination
              currentPage={page + 1}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={size}
              onPageChange={(p) => setPage(p - 1)}
            />
          )}
        </div>
      )}

      {/* Institution Form Modal (Create / Edit) */}
      <InstitutionFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedInstitution}
        universities={availableUniversities}
        submitting={submitting}
        serverError={formServerError}
      />

      {/* Institution Details Modal */}
      <InstitutionDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        institution={selectedInstitution}
        loading={detailsLoading}
      />

      {/* Status Toggle Modal */}
      <InstitutionStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onConfirm={handleStatusToggleConfirm}
        institution={selectedInstitution}
        submitting={submitting}
      />
    </div>
  );
};

export default AdminInstitutions;
