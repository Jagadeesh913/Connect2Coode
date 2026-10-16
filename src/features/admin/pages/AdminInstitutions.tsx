import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminTable, Column } from '../components/AdminTable';
import { AdminBadge } from '../components/AdminBadge';
import { AdminCard } from '../components/AdminCard';
import { AdminErrorState } from '../components/AdminErrorState';
import { InstitutionFormModal, InstitutionFormValues } from '../components/institutions/InstitutionFormModal';
import { InstitutionDetailsModal } from '../components/institutions/InstitutionDetailsModal';
import { InstitutionStatusModal } from '../components/institutions/InstitutionStatusModal';
import { adminInstitutionService, InstitutionItem } from '../../../services/admin/adminInstitutionService';
import type { InstitutionType } from '../../../core/types/domain';
import { toast } from 'react-hot-toast';
import { getActionableErrorMessage } from '../../../core/validation';

export const AdminInstitutions: React.FC = () => {
  const [institutions, setInstitutions] = useState<InstitutionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Filters State
  const [query, setQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<InstitutionType | 'ALL'>('ALL');
  const [stateFilter, setStateFilter] = useState<string>('');
  const [districtFilter, setDistrictFilter] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Debounced Filter Values to avoid per-keystroke API spam
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [debouncedState, setDebouncedState] = useState<string>('');
  const [debouncedDistrict, setDebouncedDistrict] = useState<string>('');
  const instAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setDebouncedState(stateFilter.trim());
      setDebouncedDistrict(districtFilter.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [query, stateFilter, districtFilter]);

  // Modals State
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [selectedInstitution, setSelectedInstitution] = useState<InstitutionItem | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);
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
        setInstitutions(responseData.content);
        setTotalPages(responseData.totalPages || 1);
        setTotalElements(responseData.totalElements || responseData.content.length);
      } else if (Array.isArray(responseData)) {
        setInstitutions(responseData);
        setTotalPages(Math.max(1, Math.ceil(responseData.length / size)));
        setTotalElements(responseData.length);
      } else {
        setInstitutions([]);
        setTotalPages(1);
        setTotalElements(0);
      }
    } catch (err: any) {
      if (controller.signal.aborted || err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
        return;
      }
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to fetch institutions from server';
      setError(msg);
      setInstitutions([]);
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

  // List of registered universities for affiliated dropdown
  const universityOptions = useMemo(() => {
    return institutions.filter((inst) => inst.institutionType === 'UNIVERSITY');
  }, [institutions]);

  // Quick stats
  const stats = useMemo(() => {
    const total = totalElements || institutions.length;
    const universitiesCount = institutions.filter((i) => i.institutionType === 'UNIVERSITY').length;
    const collegesCount = institutions.filter((i) => i.institutionType === 'COLLEGE').length;
    const activeCount = institutions.filter((i) => i.isActive).length;
    return { total, universitiesCount, collegesCount, activeCount };
  }, [institutions, totalElements]);

  // Handlers
  const handleInspect = async (id: number) => {
    setDetailsLoading(true);
    setIsDetailsOpen(true);
    try {
      const res = await adminInstitutionService.getInstitutionById(id);
      const data = res?.data || res;
      if (data && (data as any).id) {
        setSelectedInstitution(data as InstitutionItem);
      } else {
        const fallback = institutions.find((i) => i.id === id);
        setSelectedInstitution(fallback || null);
      }
    } catch (err: any) {
      const fallback = institutions.find((i) => i.id === id);
      if (fallback) {
        setSelectedInstitution(fallback);
      } else {
        toast.error(err?.message || 'Failed to fetch institution details');
      }
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleEditClick = (inst: InstitutionItem) => {
    setSelectedInstitution(inst);
    setFormServerError(null);
    setIsFormOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedInstitution(null);
    setFormServerError(null);
    setIsFormOpen(true);
  };

  const handleStatusToggleClick = (inst: InstitutionItem) => {
    setSelectedInstitution(inst);
    setIsStatusModalOpen(true);
  };

  const handleSaveInstitution = async (formData: InstitutionFormValues) => {
    setSubmitting(true);
    setFormServerError(null);
    try {
      if (selectedInstitution?.id) {
        // PUT update
        await adminInstitutionService.updateInstitution(selectedInstitution.id, {
          aisheCode: formData.aisheCode,
          name: formData.name,
          institutionType: formData.institutionType,
          universityId: formData.universityId,
          state: formData.state,
          district: formData.district,
          website: formData.website,
          yearOfEstablishment: formData.yearOfEstablishment ?? undefined,
          isActive: formData.isActive,
        });
        toast.success('Institution updated successfully.');
      } else {
        // POST create
        await adminInstitutionService.createInstitution({
          aisheCode: formData.aisheCode,
          name: formData.name,
          institutionType: formData.institutionType,
          universityId: formData.universityId,
          state: formData.state,
          district: formData.district,
          website: formData.website,
          yearOfEstablishment: formData.yearOfEstablishment ?? undefined,
          isActive: formData.isActive,
        });
        toast.success('Institution created successfully.');
      }
      setIsFormOpen(false);
      setFormServerError(null);
      fetchInstitutions();
    } catch (err: any) {
      const status = err?.statusCode || err?.response?.status;
      const errorMsg = getActionableErrorMessage(err, 'Unable to save institution.');
      if (status === 409 || errorMsg.toLowerCase().includes('aishe')) {
        setFormServerError({
          field: 'aisheCode',
          message: `AISHE Code "${formData.aisheCode}" is already in use by another institution.`,
        });
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedInstitution) return;
    setSubmitting(true);
    try {
      const nextStatus = !selectedInstitution.isActive;
      await adminInstitutionService.updateInstitutionStatus(selectedInstitution.id, nextStatus);
      toast.success(
        nextStatus
          ? 'Institution activated successfully'
          : 'Institution status updated successfully'
      );
      setIsStatusModalOpen(false);
      fetchInstitutions();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update institution status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetFilters = () => {
    setQuery('');
    setTypeFilter('ALL');
    setStateFilter('');
    setDistrictFilter('');
    setActiveFilter('ALL');
    setPage(0);
  };

  // Table Columns
  const columns: Column<InstitutionItem>[] = [
    {
      header: 'AISHE Code',
      className: 'w-28 font-mono font-bold text-gray-300',
      cell: (row) => (
        <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs">
          {row.aisheCode || '—'}
        </span>
      ),
    },
    {
      header: 'Institution Name',
      className: 'min-w-[220px]',
      cell: (row) => (
        <div>
          <span className="font-semibold text-white group-hover:text-blue-400 transition-colors">
            {row.name}
          </span>
          {row.website && (
            <a
              href={row.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="block text-[11px] text-gray-500 hover:text-blue-300 transition-colors truncate max-w-xs"
            >
              <i className="fa-solid fa-link text-[9px] mr-1"></i>
              {row.website}
            </a>
          )}
        </div>
      ),
    },
    {
      header: 'Type',
      className: 'w-32',
      cell: (row) => {
        const isUniv = row.institutionType === 'UNIVERSITY';
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
              isUniv
                ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            }`}
          >
            {row.institutionType}
          </span>
        );
      },
    },
    {
      header: 'Location',
      className: 'w-44 text-gray-300',
      cell: (row) => (
        <div className="text-xs">
          <p className="font-medium text-gray-200">{row.state}</p>
          <p className="text-[11px] text-gray-500">{row.district || '—'}</p>
        </div>
      ),
    },
    {
      header: 'Year',
      className: 'w-20 text-gray-400',
      cell: (row) => (row.yearOfEstablishment ? String(row.yearOfEstablishment) : '—'),
    },
    {
      header: 'Status',
      className: 'w-24',
      cell: (row) => (
        <AdminBadge variant={row.isActive ? 'success' : 'neutral'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </AdminBadge>
      ),
    },
    {
      header: 'Actions',
      className: 'w-36 text-right',
      cell: (row) => (
        <div
          className="flex items-center justify-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Inspect */}
          <button
            onClick={() => handleInspect(row.id)}
            title="Inspect Details"
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <i className="fa-solid fa-eye text-xs"></i>
          </button>
          {/* Edit */}
          <button
            onClick={() => handleEditClick(row)}
            title="Edit Institution"
            className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
          >
            <i className="fa-solid fa-pen-to-square text-xs"></i>
          </button>
          {/* Toggle status */}
          <button
            onClick={() => handleStatusToggleClick(row)}
            title={row.isActive ? 'Deactivate Institution' : 'Activate Institution'}
            className={`p-1.5 rounded-lg transition-colors ${
              row.isActive
                ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
                : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
            }`}
          >
            <i
              className={`fa-solid ${
                row.isActive ? 'fa-ban' : 'fa-circle-check'
              } text-xs`}
            ></i>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <AdminPageHeader
        title="Institution Management"
        description="Manage colleges and universities, configure student registration affiliations, and control public visibility."
        actions={
          <button
            onClick={handleCreateClick}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <i className="fa-solid fa-plus text-xs"></i>
            <span>Add Institution</span>
          </button>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <AdminCard title="Total Institutions">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-white">{stats.total}</span>
            <i className="fa-solid fa-graduation-cap text-gray-500 text-lg"></i>
          </div>
        </AdminCard>
        <AdminCard title="Universities">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-purple-400">
              {stats.universitiesCount}
            </span>
            <i className="fa-solid fa-building-columns text-purple-400/50 text-lg"></i>
          </div>
        </AdminCard>
        <AdminCard title="Colleges">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-emerald-400">
              {stats.collegesCount}
            </span>
            <i className="fa-solid fa-school text-emerald-400/50 text-lg"></i>
          </div>
        </AdminCard>
        <AdminCard title="Active Records">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-blue-400">{stats.activeCount}</span>
            <i className="fa-solid fa-circle-check text-blue-400/50 text-lg"></i>
          </div>
        </AdminCard>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl border border-white/10 bg-neutral-900/80 backdrop-blur-xl shadow-xl flex flex-col md:flex-row flex-wrap items-center gap-3">
        {/* Search input (Query: name or AISHE) */}
        <div className="relative flex-1 min-w-[200px] w-full md:w-auto">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs"></i>
          <input
            type="text"
            placeholder="Search name or AISHE code..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Institution Type Filter */}
        <div className="w-full sm:w-auto relative">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as any);
              setPage(0);
            }}
            className="w-full sm:w-auto appearance-none pl-3 pr-8 py-2 bg-neutral-950 border border-white/10 hover:border-white/20 focus:border-blue-500 rounded-xl text-xs text-white focus:outline-none transition-colors cursor-pointer"
          >
            <option value="ALL">All Types</option>
            <option value="UNIVERSITY">Universities Only</option>
            <option value="COLLEGE">Colleges Only</option>
          </select>
          <i className="fa-solid fa-chevron-down text-[10px] text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
        </div>

        {/* State Filter */}
        <div className="w-full sm:w-auto min-w-[140px]">
          <input
            type="text"
            placeholder="Filter State..."
            value={stateFilter}
            onChange={(e) => {
              setStateFilter(e.target.value);
              setPage(0);
            }}
            className="w-full px-3 py-2 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* District Filter */}
        <div className="w-full sm:w-auto min-w-[140px]">
          <input
            type="text"
            placeholder="Filter District..."
            value={districtFilter}
            onChange={(e) => {
              setDistrictFilter(e.target.value);
              setPage(0);
            }}
            className="w-full px-3 py-2 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Active Status Filter */}
        <div className="w-full sm:w-auto relative">
          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value as any);
              setPage(0);
            }}
            className="w-full sm:w-auto appearance-none pl-3 pr-8 py-2 bg-neutral-950 border border-white/10 hover:border-white/20 focus:border-blue-500 rounded-xl text-xs text-white focus:outline-none transition-colors cursor-pointer"
          >
            <option value="ALL">Status: All</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
          <i className="fa-solid fa-chevron-down text-[10px] text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
        </div>

        {/* Reset Filter Button */}
        {(query || typeFilter !== 'ALL' || stateFilter || districtFilter || activeFilter !== 'ALL') && (
          <button
            onClick={handleResetFilters}
            className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            title="Reset All Filters"
          >
            <i className="fa-solid fa-rotate-left text-xs"></i>
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Main Content State */}
      {error ? (
        <AdminErrorState message={error} onRetry={fetchInstitutions} />
      ) : (
        <div className="space-y-4">
          <AdminTable<InstitutionItem>
            columns={columns}
            data={institutions}
            loading={loading}
            emptyTitle="No institutions found"
            emptyDescription="Try adjusting your search criteria or add a new institution."
            onRowClick={(row) => handleInspect(row.id)}
            keyExtractor={(row) => row.id}
          />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-white/10 bg-neutral-950 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <span>
                  Showing {institutions.length} of {totalElements} records
                </span>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <span>Page size:</span>
                  <div className="relative">
                    <select
                      value={size}
                      onChange={(e) => {
                        setSize(Number(e.target.value));
                        setPage(0);
                      }}
                      className="appearance-none bg-neutral-900 border border-white/10 rounded-lg pl-2.5 pr-6 py-1 text-white text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                    <i className="fa-solid fa-chevron-down text-[8px] text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={page === 0 || loading}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <i className="fa-solid fa-chevron-left text-[10px] mr-1"></i> Prev
                </button>
                <span className="font-semibold text-white px-2">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages - 1 || loading}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next <i className="fa-solid fa-chevron-right text-[10px] ml-1"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Modal (Create / Edit) */}
      <InstitutionFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSaveInstitution}
        initialData={selectedInstitution}
        universities={universityOptions}
        submitting={submitting}
        serverError={formServerError}
      />


      {/* Details Modal */}
      <InstitutionDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        institution={selectedInstitution}
        loading={detailsLoading}
      />

      {/* Status Confirmation Modal */}
      <InstitutionStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onConfirm={handleConfirmStatusChange}
        institution={selectedInstitution}
        submitting={submitting}
      />
    </div>
  );
};
