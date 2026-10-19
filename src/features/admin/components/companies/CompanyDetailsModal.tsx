import React, { useState, useEffect } from 'react';
import { AdminModal } from '../AdminModal';
import { AdminBadge } from '../AdminBadge';
import { CompanyItem, adminCompanyService } from '../../../../services/admin/adminCompanyService';
import {
  Building2,
  ExternalLink,
  Globe,
  Hash,
  Code2,
  Loader2,
  FileText,
} from 'lucide-react';

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
      title={company?.name ? company.name : 'Company Details'}
      subtitle="Entity profile and tagged DSA coding questions"
      icon={<Building2 className="w-5 h-5" />}
      maxWidth="xl"
      footer={
        <button
          onClick={onClose}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer font-sans shadow-xs"
        >
          Close Inspector
        </button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center p-8 text-slate-500 gap-2 font-sans">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span>Loading Company Details...</span>
        </div>
      ) : company ? (
        <div className="flex flex-col gap-4 font-sans text-xs">
          {/* Header Banner */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-white p-2.5 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xs">
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
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                  {company.name}
                </h3>
                <AdminBadge
                  variant={company.isActive !== false ? 'success' : 'neutral'}
                  dot
                  size="sm"
                >
                  {company.isActive !== false ? 'Active' : 'Inactive'}
                </AdminBadge>
              </div>
              <span className="font-mono text-slate-400 dark:text-slate-500 text-[11px] mt-0.5">
                Record ID: #{company.id}
              </span>
            </div>
          </div>

          {/* Description */}
          {company.description && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Overview & Hiring Notes</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-xs">
                {company.description}
              </div>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
            {company.websiteUrl && (
              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-xl flex flex-col gap-0.5">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1">
                  <Globe className="w-3 h-3 text-blue-500" /> Official Website
                </span>
                <a
                  href={company.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-mono truncate flex items-center gap-1 mt-0.5"
                >
                  <span className="truncate">{company.websiteUrl}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
            )}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-xl flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1">
                <Hash className="w-3 h-3 text-purple-500" /> Database Identifier
              </span>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                #{company.id}
              </span>
            </div>
          </div>

          {/* Tagged Problems Section */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <Code2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Tagged DSA Questions ({problems.length})</span>
              </div>
              {problemsLoading && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                  <Loader2 className="w-3 h-3 animate-spin text-blue-600" /> Loading...
                </span>
              )}
            </div>

            {problems.length === 0 ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-slate-500 italic text-xs text-center">
                {problemsLoading
                  ? 'Fetching tagged questions...'
                  : 'No DSA questions currently tagged to this company.'}
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
                {problems.map((p: any, idx: number) => (
                  <div
                    key={p.id || idx}
                    className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-xl flex items-center justify-between text-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2 font-sans min-w-0">
                      <span className="font-mono text-slate-400 text-[11px] shrink-0">#{p.id}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {p.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {p.difficultyName || p.difficulty ? (
                        <AdminBadge variant="neutral" size="sm">
                          {p.difficultyName || p.difficulty}
                        </AdminBadge>
                      ) : null}
                      {p.topicName || p.topic ? (
                        <AdminBadge variant="primary" size="sm">
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
