import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchCompanies } from '../redux/companySlice';
import { CompanyCardSkeleton } from '../../../shared/components/ui/Skeleton';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { CompanyBrandLogo } from '../components/CompanyBrandLogo';
import { openAuthModal } from '../../auth/redux/authSlice';

export const CompanyList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { companies, listLoading, loading } = useAppSelector((state) => state.companies);
  const isLoading = listLoading ?? loading;
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');

  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);

  useEffect(() => {
    const req = dispatch(fetchCompanies(undefined));
    req
      .unwrap()
      .catch(() => {})
      .finally(() => {
        setHasFetchedOnce(true);
      });
    return () => {
      req.abort();
    };
  }, [dispatch]);

  const isCompaniesLoading = isLoading || !hasFetchedOnce;

  // Exclusively map real backend companies - NO MOCK DATA
  const allCompanies = useMemo(() => {
    if (!Array.isArray(companies)) return [];

    return companies.map((c: any) => {
      const name = c.name || c.companyName || '';
      const slug =
        c.slug ||
        (c.id ? String(c.id) : name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));

      return {
        ...c,
        id: c.id ?? slug,
        name,
        slug,
      };
    });
  }, [companies]);

  // Extract real industries dynamically from API response
  const availableIndustries = useMemo(() => {
    const set = new Set<string>();
    allCompanies.forEach((c) => {
      if (c.industry && typeof c.industry === 'string' && c.industry.trim()) {
        set.add(c.industry.trim());
      }
    });
    return Array.from(set).sort();
  }, [allCompanies]);

  const filteredCompanies = useMemo(() => {
    return allCompanies.filter((company) => {
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
  }, [allCompanies, searchTerm, selectedIndustry]);

  return (
    <div className="w-full flex flex-col items-center pb-20 font-sans bg-[#FFFFFF] dark:bg-[#070A13] text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-200 overflow-x-hidden">
      
      {/* Ambient background glows matching Home and Practice page */}
      <div className="fixed top-24 -left-48 w-96 h-[400px] bg-purple-600/10 dark:bg-purple-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed top-40 -right-48 w-96 h-[500px] bg-indigo-600/10 dark:bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Main Content Container (Exact max-w-7xl matching Home & Practice page) */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        
        {/* 1. HERO BANNER SECTION (Using exact Light and Dark theme banners provided by user) */}
        <section className="w-full pb-6">
          <div className="w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800/80 bg-slate-100 dark:bg-[#050D1D]">
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
        <div className="mt-2 mb-8 bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent pl-11 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"
            />
          </div>

          {/* Industry Dropdown (Dynamically populated from real API data only) */}
          {availableIndustries.length > 0 && (
            <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-3 shrink-0">
              <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                Industry
              </span>
              <div className="relative flex-1 sm:flex-initial">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#111A2E] border border-slate-200 dark:border-slate-700/80 rounded-xl pl-3 pr-8 py-2 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 hover:border-blue-500/50 focus-within:border-blue-500 transition-colors relative shadow-2xs">
                  <i className="fa-solid fa-industry text-blue-600 dark:text-blue-400 text-xs pointer-events-none"></i>
                  <select
                    value={selectedIndustry}
                    onChange={(e) => setSelectedIndustry(e.target.value)}
                    className="bg-transparent border-none outline-none cursor-pointer text-xs sm:text-sm text-slate-800 dark:text-slate-200 appearance-none font-semibold w-full pr-3"
                  >
                    <option value="all" className="bg-white dark:bg-[#0D1322] text-slate-900 dark:text-white">All Industries</option>
                    {availableIndustries.map((ind) => (
                      <option key={ind} value={ind} className="bg-white dark:bg-[#0D1322] text-slate-900 dark:text-white">
                        {ind}
                      </option>
                    ))}
                  </select>
                  <i className="fa-solid fa-chevron-down text-[10px] text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* 3. COMPANIES 4-COLUMN RESPONSIVE GRID */}
        {isCompaniesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <CompanyCardSkeleton count={8} />
          </div>
        ) : !isAuthenticated && allCompanies.length === 0 ? (
          <div className="my-12">
            <EmptyState
              title="Sign in to explore Company Prep"
              description="Log in with your Connect 2 Code account to browse hiring companies, recruitment patterns, and interview questions."
              actionText="Sign In"
              onAction={() => dispatch(openAuthModal({ mode: 'login' }))}
              icon={<i className="fa-solid fa-lock text-3xl text-blue-500"></i>}
            />
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
              icon={<i className="fa-solid fa-building text-3xl text-slate-400"></i>}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCompanies.map((company) => {
              const companySlug =
                company.slug ||
                (company.id ? String(company.id) : company.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-'));

              return (
                <div
                  key={company.id || company.name}
                  className="group relative bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 hover:border-blue-500/60 dark:hover:border-blue-500/60 rounded-2xl p-5 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden"
                >
                  {/* Faint Background Watermark Logo Silhouette */}
                  <div className="absolute -right-3 -top-3 w-32 h-32 opacity-[0.06] dark:opacity-[0.07] text-slate-900 dark:text-white pointer-events-none select-none overflow-hidden flex items-center justify-center">
                    <CompanyBrandLogo
                      name={company.name}
                      logo={company.logo || company.logoUrl}
                      website={company.website || company.websiteUrl}
                      className="w-full h-full"
                      watermark
                    />
                  </div>

                  <div>
                    {/* Top Row: Authentic Brand Logo */}
                    <div className="flex items-center justify-between relative z-10">
                      <div className="w-12 h-12 flex items-center justify-start shrink-0">
                        <CompanyBrandLogo
                          name={company.name}
                          logo={company.logo || company.logoUrl}
                          website={company.website || company.websiteUrl}
                          className="w-10 h-10"
                        />
                      </div>
                    </div>

                    {/* Company Name & Real Problem Count (ONLY if present in API) */}
                    <div className="mt-3 relative z-10">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {company.name}
                      </h3>
                      {typeof company.problemCount === 'number' && company.problemCount > 0 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                          {company.problemCount} {company.problemCount === 1 ? 'Question' : 'Questions'}
                        </p>
                      )}
                    </div>

                    {/* Real Industry Badge (ONLY if present in API) */}
                    {company.industry && (
                      <div className="mt-3 flex items-center gap-2 relative z-10">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                          {company.industry}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Solve Questions Button */}
                  <div className="mt-5 relative z-10">
                    <Link
                      to={`/companies/${companySlug}`}
                      className="w-full py-2.5 px-4 rounded-xl border border-blue-500 hover:border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 dark:text-blue-400 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-150 shadow-2xs group/btn"
                    >
                      <span>Solve Questions</span>
                      <i className="fa-solid fa-arrow-right text-xs group-hover/btn:translate-x-1 transition-transform"></i>
                    </Link>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
};
