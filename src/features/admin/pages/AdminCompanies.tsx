import { RequestStatus } from '../../../shared/components/ui/RequestStatus';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminTable, Column } from '../components/AdminTable';
import { AdminBadge } from '../components/AdminBadge';
import { AdminErrorState } from '../components/AdminErrorState';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { CompanyFormModal, CompanyFormData } from '../components/companies/CompanyFormModal';
import { CompanyDetailsModal } from '../components/companies/CompanyDetailsModal';
import { CompanyBrandLogo } from '../../companies/components/CompanyBrandLogo';
import { adminCompanyService, CompanyItem } from '../../../services/admin/adminCompanyService';
import { toast } from 'react-hot-toast';
import { getActionableErrorMessage } from '../../../core/validation';
import {
  Plus,
  RotateCw,
  Search,
  LayoutGrid,
  List,
  ExternalLink,
  Edit3,
  Eye,
  Globe,
  GraduationCap,
} from 'lucide-react';

export const AdminCompanies: React.FC = () => {
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & View Mode State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modals State
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [detailsTab, setDetailsTab] = useState<'overview' | 'exams'>('overview');
  const [selectedCompany, setSelectedCompany] = useState<CompanyItem | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);
  const [editingCompanyId, setEditingCompanyId] = useState<string | number | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  /**
   * REAL API ONLY — GET /api/v1/company
   * Fetches target company records directly from Backend database.
   */
  const listController = useRef<AbortController | null>(null);
  const fetchCompanies = useCallback(async () => {
    listController.current?.abort();
    const controller = new AbortController();
    listController.current = controller;
    setLoading(true);
    setError(null);
    try {
      const res = await adminCompanyService.getCompanies(controller.signal);
      if (controller.signal.aborted) return;
      const list = res?.data || (Array.isArray(res) ? res : []);
      setCompanies(Array.isArray(list) ? list : []);
    } catch (err: any) {
      if (controller.signal.aborted) return;
      const msg = getActionableErrorMessage(err, 'Failed to fetch companies list.');
      setError(msg);

    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
    return () => listController.current?.abort();
  }, [fetchCompanies]);

  const inspectionId = useRef(0);
  useEffect(() => () => { inspectionId.current++; }, []);
  const handleInspect = async (id: string | number, tab: 'overview' | 'exams' = 'overview') => {
    setDetailsTab(tab);
    const requestId = ++inspectionId.current;
    setSelectedCompany(null);
    setDetailsLoading(true);
    setIsDetailsOpen(true);
    try {
      const res = await adminCompanyService.getCompanyById(id);
      if (requestId !== inspectionId.current) return;
      const companyData = res?.data || ((res as any)?.id ? (res as any) : null);
      if (companyData) {
        setSelectedCompany(companyData);
      } else {
        setSelectedCompany(null);
        toast.error('Company details not found.');
      }
    } catch (err: any) {
      if (requestId !== inspectionId.current) return;
      setIsDetailsOpen(false);
      setSelectedCompany(null);
      toast.error(getActionableErrorMessage(err, 'Failed to fetch company details.'));
    } finally {
      if (requestId === inspectionId.current) setDetailsLoading(false);
    }
  };

  const handleEditClick = async (item: CompanyItem) => {
    if (!item.id) return;
    const requestId = ++inspectionId.current;
    setEditingCompanyId(item.id);
    try {
      const res = await adminCompanyService.getCompanyById(item.id);
      if (requestId !== inspectionId.current) return;
      const companyData = res?.data || ((res as any)?.id ? (res as any) : null);
      if (companyData) {
        setSelectedCompany(companyData);
        setIsFormOpen(true);
      } else {
        toast.error('Unable to retrieve full company data for editing.');
      }
    } catch (err: any) {
      if (requestId !== inspectionId.current) return;
      toast.error(getActionableErrorMessage(err, 'Error retrieving company for editing.'));
    } finally {
      if (requestId === inspectionId.current) setEditingCompanyId(null);
    }
  };

  const handleCreateClick = () => {
    inspectionId.current += 1;
    setEditingCompanyId(null);
    setSelectedCompany(null);
    setIsFormOpen(true);
  };

  const handleSaveCompany = async (formData: CompanyFormData) => {
    setSubmitting(true);
    try {
      const payload: CompanyItem = {
        id: formData.id ?? null,
        name: formData.name.trim(),
        websiteUrl: formData.websiteUrl ? formData.websiteUrl.trim() : '',
        logoUrl: formData.logoUrl ? formData.logoUrl.trim() : '',
        description: formData.description ? formData.description.trim() : '',
        isActive: formData.isActive ?? true,
      };

      await adminCompanyService.saveOrUpdateCompany(payload);
      toast.success(formData.id ? 'Company updated successfully!' : 'Company registered successfully!');
      setIsFormOpen(false);
      await fetchCompanies();
    } catch (err: any) {
      toast.error(getActionableErrorMessage(err, 'Failed to save company entity.'));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCompanies = companies.filter((c) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.websiteUrl?.toLowerCase().includes(q)
    );
  });

  const columns: Column<CompanyItem>[] = [
    {
      header: 'Identifier',
      accessorKey: 'id',
      className: 'w-24 font-mono text-slate-400 font-semibold',
      cell: (row) => <span>#{row.id}</span>,
    },
    {
      header: 'Company Profile',
      className: 'min-w-[220px]',
      cell: (row) => {
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 p-2 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
              <CompanyBrandLogo
                name={row.name}
                logo={row.logoUrl}
                website={row.websiteUrl}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-slate-900 dark:text-white truncate">
                {row.name}
              </span>
              {row.websiteUrl ? (
                <a
                  href={row.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-mono truncate"
                >
                  <span className="truncate">{row.websiteUrl.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                </a>
              ) : (
                <span className="text-[11px] text-slate-400 italic">No website specified</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Overview Notes',
      className: 'max-w-md hidden md:table-cell',
      cell: (row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
          {row.description || 'No specific notes recorded.'}
        </span>
      ),
    },
    {
      header: 'Tagging Status',
      className: 'w-32',
      cell: (row) => (
        <AdminBadge
          variant={row.isActive !== false ? 'success' : 'neutral'}
          dot
          size="sm"
        >
          {row.isActive !== false ? 'Active' : 'Inactive'}
        </AdminBadge>
      ),
    },
    {
      header: 'Actions',
      className: 'w-36 text-right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleInspect(row.id!, 'exams')}
            className="p-1.5 rounded-lg border border-purple-200 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 hover:text-purple-700 hover:border-purple-400 dark:hover:border-purple-700 transition-colors shadow-2xs cursor-pointer"
            title="Manage Recruitment Exams & Patterns"
          >
            <GraduationCap className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleInspect(row.id!, 'overview')}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:border-blue-400 transition-colors shadow-2xs cursor-pointer"
            title="Inspect Company Overview"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleEditClick(row)}
            disabled={editingCompanyId !== null}
            aria-label={editingCompanyId === row.id ? `Loading ${row.name} for editing` : `Edit ${row.name}`}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-600 hover:border-amber-400 transition-colors shadow-2xs cursor-pointer"
            title="Edit Company"
          >
            {editingCompanyId === row.id ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Edit3 className="w-3.5 h-3.5" />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 font-sans text-left pb-12">
      <RequestStatus error={companies.length ? error : null} onRetry={fetchCompanies} />
      {/* Page Header */}
      <AdminPageHeader
        title="Target Hiring Companies"
        description="Manage company profiles, brand assets, and link them to DSA question tags for company-specific interview preparation."
        badge={
          <AdminBadge variant="primary">
            {companies.length} Indexed
          </AdminBadge>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCreateClick}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Company</span>
            </button>
            <button
              onClick={fetchCompanies}
              disabled={loading}
              className="p-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 shadow-xs"
              title="Refresh"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
            </button>
          </div>
        }
      />

      {/* Filter and View Bar */}
      <div className="p-4 bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by company name or domain..."
            className="w-full pl-10 pr-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl">
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Table View"
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Table</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Card Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Grid</span>
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && companies.length === 0 && <AdminErrorState message={error} onRetry={fetchCompanies} />}

      {/* Main Content: Table or Grid */}
      {(!error || companies.length > 0) && viewMode === 'table' && (
        <AdminTable<CompanyItem>
          columns={columns}
          data={filteredCompanies}
          loading={loading}
          keyExtractor={(row) => row.id || row.name}
          onRowClick={(row) => row.id && handleInspect(row.id)}
          emptyTitle="No Companies Found"
          emptyDescription="There are currently no companies registered matching your search query."
          emptyAction={
            <button
              onClick={handleCreateClick}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register First Company</span>
            </button>
          }
        />
      )}

      {(!error || companies.length > 0) && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading && companies.length === 0 ? (
            Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="h-52 rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800/80 dark:bg-[#0D1322]">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <Skeleton className="mt-4 h-5 w-2/3" />
                <Skeleton className="mt-2 h-3 w-1/3" />
                <Skeleton className="mt-6 h-8 w-full" />
              </div>
            ))
          ) : filteredCompanies.length === 0 ? (
            <div className="col-span-full min-h-52 rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
              <p className="font-bold text-slate-800 dark:text-slate-100">No Companies Found</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">No companies match the current search.</p>
            </div>
          ) : filteredCompanies.map((c) => {
            return (
              <div
                key={c.id || c.name}
                onClick={() => c.id && handleInspect(c.id)}
                className="p-5 rounded-2xl bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800/80 space-y-3.5 shadow-xs hover:shadow-md hover:border-blue-400/50 transition-all cursor-pointer group text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 p-2 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                    <CompanyBrandLogo
                      name={c.name}
                      logo={c.logoUrl}
                      website={c.websiteUrl}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <AdminBadge
                    variant={c.isActive !== false ? 'success' : 'neutral'}
                    dot
                    size="sm"
                  >
                    {c.isActive !== false ? 'Active' : 'Inactive'}
                  </AdminBadge>
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {c.name}
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                    ID: #{c.id}
                  </span>
                </div>

                {c.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>
                )}

                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  {c.websiteUrl ? (
                    <a
                      href={c.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-mono text-[11px] truncate max-w-[150px]"
                    >
                      <Globe className="w-3 h-3 shrink-0" />
                      <span className="truncate">{c.websiteUrl.replace(/^https?:\/\//, '')}</span>
                    </a>
                  ) : (
                    <span className="text-slate-400 text-[11px] italic">No URL</span>
                  )}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInspect(c.id!, 'exams');
                      }}
                      className="p-1.5 rounded-lg border border-purple-200 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 hover:text-purple-700 hover:border-purple-400 dark:hover:border-purple-700 transition-colors shadow-2xs cursor-pointer"
                      title="Manage Recruitment Exams & Patterns"
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(c);
                      }}
                      disabled={editingCompanyId !== null}
                      aria-label={editingCompanyId === c.id ? `Loading ${c.name} for editing` : `Edit ${c.name}`}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-600 hover:border-amber-400 transition-colors shadow-2xs cursor-pointer"
                      title="Edit"
                    >
                      {editingCompanyId === c.id ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Edit3 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Company Form Modal */}
      <CompanyFormModal
        isOpen={isFormOpen}
        onClose={() => {
          inspectionId.current += 1;
          setEditingCompanyId(null);
          setIsFormOpen(false);
        }}
        onSubmit={handleSaveCompany}
        initialData={selectedCompany}
        availableCompanies={companies}
        submitting={submitting}
      />

      {/* Company Details Modal */}
      <CompanyDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          inspectionId.current += 1;
          setDetailsLoading(false);
          setIsDetailsOpen(false);
        }}
        company={selectedCompany}
        loading={detailsLoading}
        initialTab={detailsTab}
      />
    </div>
  );
};

export default AdminCompanies;
