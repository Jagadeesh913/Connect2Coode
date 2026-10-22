import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { CompanyCardSkeleton } from '../../../shared/components/ui/Skeleton';
import { RequestStatus } from '../../../shared/components/ui/RequestStatus';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { CompanyBrandLogo } from '../components/CompanyBrandLogo';
import { openAuthModal } from '../../auth/redux/authSlice';
import { companyService } from '../../../services/companyService';
import type { CompanyItem } from '../types/companyExam';
import {
  Search,
  ExternalLink,
  ArrowRight,
  Building2,
  ChevronLeft,
  ChevronRight,
  Lock,
  Layers,
} from 'lucide-react';

export const CompanyList: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Pagination & Data State
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [pageNumber, setPageNumber] = useState<number>(0);
  const [pageSize] = useState<number>(24);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Client-side search & filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');

  const requestSequence = useRef(0);
  const loadCompanies = useCallback(
    async (page: number, signal?: AbortSignal) => {
      const requestId = ++requestSequence.current;
      setLoading(true);
      setError(null);
      try {
        const res = await companyService.getCompaniesPaginated(
          {
            pageNumber: page,
            pageSize,
            sortBy: 'name',
            sortDirection: 'ASC',
          },
          signal
        );

        if (signal?.aborted || requestId !== requestSequence.current) return;
        const data = res.data;
        setCompanies(data.content || []);
        setPageNumber(data.pageNumber ?? page);
        setTotalPages(data.totalPages ?? 1);
        setTotalElements(data.totalElements ?? data.content?.length ?? 0);
      } catch (err: any) {
        if (requestId !== requestSequence.current || err?.name === 'CanceledError' || signal?.aborted) return;
        setError(err?.message || 'Failed to fetch companies');
      } finally {
        if (!signal?.aborted && requestId === requestSequence.current) setLoading(false);
      }
    },
    [pageSize]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadCompanies(pageNumber, controller.signal);
    return () => {
      controller.abort();
    };
  }, [pageNumber, loadCompanies]);

  // Extract industries dynamically
  const availableIndustries = useMemo(() => {
    const set = new Set<string>();
    companies.forEach((c) => {
      if (c.industry && typeof c.industry === 'string' && c.industry.trim()) {
        set.add(c.industry.trim());
      }
    });
    return Array.from(set).sort();
  }, [companies]);

  // Filter companies matching search query or industry
  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        company.name.toLowerCase().includes(query) ||
        (company.industry && company.industry.toLowerCase().includes(query)) ||
        (company.description && company.description.toLowerCase().includes(query));

      const matchesIndustry =
        selectedIndustry === 'all' ||
        (company.industry && company.industry.toLowerCase() === selectedIndustry.toLowerCase());

      return matchesSearch && matchesIndustry;
    });
  }, [companies, searchTerm, selectedIndustry]);

  return (
    <div className="w-full flex flex-col items-center pb-20 font-sans bg-[#FFFFFF] dark:bg-[#070A13] text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-200 overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="fixed top-24 -left-48 w-96 h-[400px] bg-purple-600/10 dark:bg-purple-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed top-40 -right-48 w-96 h-[500px] bg-indigo-600/10 dark:bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Main Content Container */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        {/* 1. HERO BANNER SECTION */}
        <section className="w-full pb-6">
          <div className="w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#050D1D]">
            {/* Light Theme Banner */}
            <img
              src="/companies_banner_light.png?v=2"
              alt="Practice by Company Banner"
              className="w-full h-auto block dark:hidden object-cover select-none pointer-events-none"
            />
            {/* Dark Theme Banner */}
            <img
              src="/companies_banner_dark.png?v=2"
              alt="Practice by Company Banner"
              className="w-full h-auto hidden dark:block object-cover select-none pointer-events-none"
            />
          </div>
        </section>

        {/* 2. SEARCH & INDUSTRY FILTER BAR */}
        <div className="mt-2 mb-8 bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search companies by name or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent pl-11 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
            />
          </div>

          {/* Real Count Badge */}
          {totalElements > 0 && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#111A2E] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800 text-xs font-semibold shrink-0">
              <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{totalElements} Companies</span>
            </div>
          )}

          {/* Industry Dropdown */}
          {availableIndustries.length > 0 && (
            <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-3 shrink-0">
              <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                Industry
              </span>
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="bg-slate-50 dark:bg-[#111A2E] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 appearance-none font-semibold w-full pr-8 outline-none hover:border-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
                >
                  <option value="all" className="bg-white dark:bg-[#0D1322] text-slate-900 dark:text-white">
                    All Industries
                  </option>
                  {availableIndustries.map((ind) => (
                    <option key={ind} value={ind} className="bg-white dark:bg-[#0D1322] text-slate-900 dark:text-white">
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* 3. COMPANIES 4-COLUMN RESPONSIVE GRID */}
        <RequestStatus pending={loading} error={companies.length ? error : null} onRetry={() => loadCompanies(pageNumber)} />
        {loading && companies.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <CompanyCardSkeleton count={8} />
          </div>
        ) : !isAuthenticated && companies.length === 0 ? (
          <div className="my-12">
            <EmptyState
              title="Sign in to explore Company Prep"
              description="Log in with your Connect 2 Code account to browse hiring companies, recruitment patterns, and interview questions."
              actionText="Sign In"
              onAction={() => dispatch(openAuthModal({ mode: 'login' }))}
              icon={<Lock className="w-12 h-12 text-blue-500" />}
            />
          </div>
        ) : error && companies.length === 0 ? (
          <div className="my-10 p-8 rounded-3xl bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-800 text-center max-w-xl mx-auto shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4 text-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Unable to load hiring companies</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6">{error}</p>
            <button
              type="button"
              onClick={() => loadCompanies(pageNumber)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              Retry Loading
            </button>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="my-12">
            <EmptyState
              title="No companies found"
              description="No company matches your current search or industry filter."
              actionText="Reset Filters"
              onAction={() => {
                setSearchTerm('');
                setSelectedIndustry('all');
              }}
              icon={<Building2 className="w-12 h-12 text-slate-400" />}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCompanies.map((company) => {
              const companyTargetId = company.id || company.slug;

              return (
                <div
                  key={company.id || company.name}
                  onClick={() => navigate(`/companies/${companyTargetId}`)}
                  className="group relative bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 hover:border-blue-500/60 dark:hover:border-blue-500/60 rounded-2xl p-5 min-h-[230px] shadow-xs hover:shadow-xl transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer"
                >
                  {/* Faint Background Watermark Logo Silhouette */}
                  <div className="absolute -right-3 -top-3 w-32 h-32 opacity-[0.06] dark:opacity-[0.07] text-slate-900 dark:text-white pointer-events-none select-none overflow-hidden flex items-center justify-center">
                    <CompanyBrandLogo
                      name={company.name}
                      logo={company.logo || company.logoUrl || undefined}
                      website={company.website || company.websiteUrl || undefined}
                      className="w-full h-full"
                      watermark
                    />
                  </div>

                  <div>
                    {/* Top Row: Authentic Brand Logo + Website Link */}
                    <div className="flex items-center justify-between relative z-10 mb-3">
                      <div className="w-12 h-12 flex items-center justify-start shrink-0">
                        <CompanyBrandLogo
                          name={company.name}
                          logo={company.logo || company.logoUrl || undefined}
                          website={company.website || company.websiteUrl || undefined}
                          className="w-10 h-10"
                        />
                      </div>

                      {company.website && (
                        <a
                          href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Visit official website"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                    {/* Company Name */}
                    <div className="relative z-10">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {company.name}
                      </h3>
                      {typeof company.problemCount === 'number' && company.problemCount > 0 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                          {company.problemCount} {company.problemCount === 1 ? 'Question' : 'Questions'}
                        </p>
                      )}
                    </div>

                    {/* Badges: Active & Industry */}
                    <div className="mt-3 flex items-center gap-2 flex-wrap relative z-10">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/70">
                        <Layers className="w-3 h-3" />
                        Recruitment Prep
                      </span>
                      {company.industry && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {company.industry}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Primary CTA Button: View Recruitment Exams */}
                  <div className="mt-5 relative z-10">
                    <Link
                      to={`/companies/${companyTargetId}`}
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white dark:bg-blue-950/50 dark:hover:bg-blue-600 dark:text-blue-300 dark:hover:text-white border border-blue-200/80 dark:border-blue-800/80 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-150 shadow-2xs group/btn"
                    >
                      <span>View Recruitment Exams</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 4. PAGINATION BAR */}
        {totalPages > 1 && (
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Showing {pageNumber * pageSize + 1}–{Math.min((pageNumber + 1) * pageSize, totalElements)} of {totalElements} companies
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPageNumber((p) => Math.max(0, p - 1))}
                disabled={pageNumber === 0}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111A2E] text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 px-2">
                Page {pageNumber + 1} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPageNumber((p) => Math.min(totalPages - 1, p + 1))}
                disabled={pageNumber >= totalPages - 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111A2E] text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
