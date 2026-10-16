import React, { useState, useEffect } from 'react';
import { AdminModal } from '../AdminModal';
import { AdminBadge } from '../AdminBadge';
import { CompanyItem, adminCompanyService } from '../../../../services/admin/adminCompanyService';

interface CompanyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CompanyItem | null;
  loading?: boolean;
}

export const CompanyDetailsModal: React.FC<CompanyDetailsModalProps> = ({
  isOpen,
  onClose,
  company,
  loading = false,
}) => {
  const [problems, setProblems] = useState<any[]>([]);
  const [problemsLoading, setProblemsLoading] = useState<boolean>(false);

  // Fetch associated company problems when modal opens
  useEffect(() => {
    if (!isOpen || !company?.id) {
      setProblems([]);
      return;
    }

    let isMounted = true;
    const fetchProblems = async () => {
      setProblemsLoading(true);
      try {
        const res = await adminCompanyService.getCompanyProblems(company.id!);
        const list = res?.data || (Array.isArray(res) ? res : []);
        if (isMounted && Array.isArray(list)) {
          setProblems(list);
        }
      } catch (err) {
        console.warn('Failed to load company problems:', err);
      } finally {
        if (isMounted) setProblemsLoading(false);
      }
    };

    fetchProblems();
    return () => {
      isMounted = false;
    };
  }, [isOpen, company?.id]);

  if (!company && !loading) return null;

  const logoUrl = company?.logoUrl || '/logo-mark-transparent.png';

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={company?.name ? `Company Inspector — ${company.name}` : 'Company Details'}
      subtitle="View entity details and tagged DSA practice problems"
      maxWidth="xl"
      footer={
        <button
          onClick={onClose}
          className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-gray-300 border border-white/10 rounded-xl text-xs font-semibold transition-all cursor-pointer font-sans"
        >
          Close Inspector
        </button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center p-8 text-gray-400 gap-2 font-sans">
          <i className="fa-solid fa-spinner animate-spin text-neutral-300"></i>
          <span>Loading Company Details...</span>
        </div>
      ) : company ? (
        <div className="flex flex-col gap-4 font-sans text-xs">
          {/* Header Banner */}
          <div className="flex items-center gap-4 p-4 bg-neutral-900 border border-white/10 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-white p-2 flex items-center justify-center shrink-0 overflow-hidden border border-white/10">
              <img
                src={logoUrl}
                alt={company.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = '/logo-mark-transparent.png';
                }}
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white font-heading">{company.name}</h3>
                <AdminBadge variant={company.isActive !== false ? 'accent' : 'neutral'}>
                  {company.isActive !== false ? 'Active Tagging' : 'Inactive'}
                </AdminBadge>
              </div>
            </div>
          </div>

          {/* Description */}
          {company.description && (
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-heading mb-1.5">
                Overview & Hiring Context
              </h4>
              <div className="p-3.5 bg-neutral-900 border border-white/10 rounded-xl text-gray-200 whitespace-pre-wrap leading-relaxed">
                {company.description}
              </div>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
            {company.websiteUrl && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Official Website</span>
                <a
                  href={company.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-neutral-300 hover:underline font-mono truncate"
                >
                  {company.websiteUrl}
                </a>
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Database Record ID</span>
              <span className="text-xs font-mono text-gray-300">#{company.id}</span>
            </div>
          </div>

          {/* Tagged Problems Section */}
          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-heading">
                Tagged DSA Questions ({problems.length})
              </h4>
              {problemsLoading && (
                <span className="text-[11px] text-gray-400 flex items-center gap-1 font-mono">
                  <i className="fa-solid fa-spinner animate-spin text-neutral-300"></i> Loading...
                </span>
              )}
            </div>

            {problems.length === 0 ? (
              <div className="p-3 bg-neutral-900 border border-white/10 rounded-xl text-gray-500 italic text-[11px]">
                {problemsLoading ? 'Fetching tagged questions...' : 'No DSA questions currently tagged to this company.'}
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                {problems.map((p: any, idx: number) => (
                  <div
                    key={p.id || idx}
                    className="p-3 bg-neutral-900 border border-white/10 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 font-sans">
                      <span className="font-mono text-gray-500 text-[11px]">#{p.id}</span>
                      <span className="font-bold text-white">{p.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.difficultyName || p.difficulty ? (
                        <AdminBadge variant="neutral">
                          {p.difficultyName || p.difficulty}
                        </AdminBadge>
                      ) : null}
                      {p.topicName || p.topic ? (
                        <AdminBadge variant="primary">
                          {p.topicName || p.topic}
                        </AdminBadge>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </AdminModal>
  );
};
