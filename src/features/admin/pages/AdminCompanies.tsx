import React, { useState, useEffect, useCallback } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminTable, Column } from '../components/AdminTable';
import { AdminBadge } from '../components/AdminBadge';
import { AdminCard } from '../components/AdminCard';
import { AdminErrorState } from '../components/AdminErrorState';
import { CompanyFormModal, CompanyFormData } from '../components/companies/CompanyFormModal';
import { CompanyDetailsModal } from '../components/companies/CompanyDetailsModal';
import { adminCompanyService, CompanyItem } from '../../../services/admin/adminCompanyService';
import { toast } from 'react-hot-toast';
import { getActionableErrorMessage } from '../../../core/validation';

export const AdminCompanies: React.FC = () => {
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search State
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals State
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyItem | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  /**
   * REAL API ONLY — GET /api/v1/company
   * Fetches target company records directly from Backend.
   */
  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminCompanyService.getCompanies();
      const list = res?.data || (Array.isArray(res) ? res : []);
      setCompanies(Array.isArray(list) ? list : []);
    } catch (err: any) {
      const msg = getActionableErrorMessage(err, 'Failed to fetch companies list.');
      setError(msg);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleInspect = async (id: string | number) => {
    setDetailsLoading(true);
    setIsDetailsOpen(true);
    try {
      const res = await adminCompanyService.getCompanyById(id);
      const companyData = res?.data || ((res as any)?.id ? (res as any) : null);
      if (companyData) {
        setSelectedCompany(companyData);
      } else {
        setSelectedCompany(null);
        toast.error('Company details not found.');
      }
    } catch (err: any) {
      setSelectedCompany(null);
      toast.error(getActionableErrorMessage(err, 'Failed to fetch company details.'));
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleEditClick = async (item: CompanyItem) => {
    if (!item.id) return;
    try {
      const res = await adminCompanyService.getCompanyById(item.id);
      const companyData = res?.data || ((res as any)?.id ? (res as any) : null);
      if (companyData) {
        setSelectedCompany(companyData);
        setIsFormOpen(true);
      } else {
        toast.error('Unable to retrieve full company data for editing.');
      }
    } catch (err: any) {
      toast.error(getActionableErrorMessage(err, 'Error retrieving company for editing.'));
    }
  };

  const handleCreateClick = () => {
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
        isActive: !formData.id ? (formData.isActive !== false) : (formData.isActive ?? true),
      };

      const res = await adminCompanyService.saveOrUpdateCompany(payload);
      if (res && (res.statusCode === 200 || res.statusCode === 201 || (res as any).id || res.data)) {
        toast.success(
          formData.id
            ? 'Company updated successfully.'
            : 'Company created successfully.'
        );
        setIsFormOpen(false);
        fetchCompanies();
      } else {
        toast.error(res?.message || 'Failed to save company.');
      }
    } catch (err: any) {
      toast.error(getActionableErrorMessage(err, 'Failed to save company.'));
    } finally {
      setSubmitting(false);
    }
  };

  // Filter companies based on search term
  const filteredCompanies = companies.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(term);
  });

  const columns: Column<CompanyItem>[] = [
    {
      header: 'Company',
      cell: (row) => {
        const logo = row.logoUrl || '/logo-mark-transparent.png';
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 p-1.5 flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src={logo}
                alt={row.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = '/logo-mark-transparent.png';
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white hover:text-white transition-colors font-heading text-sm">{row.name}</span>
              {row.websiteUrl && (
                <a
                  href={row.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-neutral-300 hover:underline font-mono"
                  onClick={(e) => e.stopPropagation()}
                >
                  {row.websiteUrl}
                </a>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Status',
      cell: (row) => (
        <AdminBadge variant={row.isActive !== false ? 'accent' : 'neutral'}>
          {row.isActive !== false ? 'Active Tagging' : 'Inactive'}
        </AdminBadge>
      ),
      className: 'w-36',
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleInspect(row.id!)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Inspect Company & Problems"
          >
            <i className="fa-solid fa-eye text-xs"></i>
          </button>
          <button
            onClick={() => handleEditClick(row)}
            className="p-2 rounded-xl bg-white/5 hover:bg-neutral-800 text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Edit Company Details"
          >
            <i className="fa-solid fa-pen-to-square text-xs"></i>
          </button>
        </div>
      ),
      className: 'w-28 text-right',
    },
  ];

  return (
    <div className="space-y-6 font-sans text-left pb-12">
      <AdminPageHeader
        title="Companies"
        description="Manage target hiring companies"
        actions={
          <button
            onClick={handleCreateClick}
            className="px-4 py-2.5 bg-neutral-100 text-neutral-900 hover:bg-neutral-200 text-black font-extrabold text-sm rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-md  font-sans"
          >
            <i className="fa-solid fa-plus text-xs"></i>
            <span>Add Target Company</span>
          </button>
        }
      />

      {/* Filter Bar Controls with Glassmorphism */}
      <AdminCard className="p-4 bg-neutral-900 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-gray-300">Search Target Companies</label>
          <div className="relative flex items-center">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 text-gray-500 text-xs"></i>
            <input
              type="text"
              placeholder="Search target companies by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-950 text-gray-100 placeholder-gray-500 rounded-xl pl-9 pr-4 py-2.5 text-xs border border-white/10 transition-all focus:outline-none focus:border-neutral-600"
            />
          </div>
        </div>
      </AdminCard>

      {/* Error State Handler */}
      {error ? (
        <AdminErrorState
          title="Backend Company API Error"
          message={error}
          onRetry={fetchCompanies}
        />
      ) : (
        <AdminTable
          columns={columns}
          data={filteredCompanies}
          loading={loading}
          emptyTitle="No hiring companies configured."
          emptyDescription="No target hiring company records match your search parameters in the database."
          keyExtractor={(item) => item.id || item.name}
        />
      )}

      {/* Create / Edit Form Modal */}
      <CompanyFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSaveCompany}
        initialData={selectedCompany}
        availableCompanies={companies}
        submitting={submitting}
      />

      {/* Details View Modal */}
      <CompanyDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        company={selectedCompany}
        loading={detailsLoading}
      />
    </div>
  );
};
