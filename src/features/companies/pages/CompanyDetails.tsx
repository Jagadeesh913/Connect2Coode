import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchCompanyBySlug, fetchCompanyProblems } from '../redux/companySlice';
import { CompanyDetailsSkeleton, TableRowSkeleton } from '../../../shared/components/ui/Skeleton';
import { toggleBookmarkItem } from '../../bookmarks/redux/bookmarkSlice';
import { openAuthModal } from '../../auth/redux/authSlice';
import { toast } from 'react-hot-toast';
import { CompanyBrandLogo } from '../components/CompanyBrandLogo';

export const CompanyDetails: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const dispatch = useAppDispatch();
  const {
    selectedCompany: company,
    companyProblems,
    detailsLoading,
    loading,
    companyProblemsLoading,
    error: companyError,
  } = useAppSelector((state) => state.companies);
  const isDetailsLoading = detailsLoading ?? loading;
  const { bookmarks } = useAppSelector((state) => state.bookmarks);
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const solvedByProblemId = useAppSelector((state) => state.progress.solvedByProblemId);

  // Filters matching Image 1
  const [questionSearch, setQuestionSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [sortBy, setSortBy] = useState<'default' | 'difficulty-asc' | 'difficulty-desc' | 'acceptance-desc'>('default');
  const [loadedCompanyKey, setLoadedCompanyKey] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoadedCompanyKey(null);
    const request = dispatch(fetchCompanyBySlug(slug));
    return () => {
      request.abort();
    };
  }, [dispatch, slug]);

  const companyId = company?.id;
  const companyName = company?.name;

  useEffect(() => {
    if (companyId === undefined && !companyName) return;
    const currentKey = `${companyId ?? ''}-${companyName ?? ''}`;
    let isSubscribed = true;

    const request = dispatch(fetchCompanyProblems({ id: companyId ?? undefined, name: companyName }));
    request
      .unwrap()
      .catch(() => {})
      .finally(() => {
        if (isSubscribed) {
          setLoadedCompanyKey(currentKey);
        }
      });

    return () => {
      isSubscribed = false;
      request.abort();
    };
  }, [dispatch, companyId, companyName]);

  const currentKey = company ? `${company.id ?? ''}-${company.name ?? ''}` : null;
  const isQuestionsLoading =
    isDetailsLoading ||
    companyProblemsLoading ||
    !company ||
    (currentKey !== null && loadedCompanyKey !== currentKey);

  const filteredProblems = useMemo(() => {
    let list = [...companyProblems];

    if (questionSearch.trim()) {
      const q = questionSearch.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.topic?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
      );
    }

    if (selectedDifficulty !== 'All') {
      list = list.filter((p) => p.difficulty?.toLowerCase() === selectedDifficulty.toLowerCase());
    }

    if (sortBy === 'difficulty-asc') {
      const rank: Record<string, number> = { easy: 1, medium: 2, hard: 3 };
      list.sort((a, b) => (rank[a.difficulty.toLowerCase()] || 2) - (rank[b.difficulty.toLowerCase()] || 2));
    } else if (sortBy === 'difficulty-desc') {
      const rank: Record<string, number> = { easy: 1, medium: 2, hard: 3 };
      list.sort((a, b) => (rank[b.difficulty.toLowerCase()] || 2) - (rank[a.difficulty.toLowerCase()] || 2));
    } else if (sortBy === 'acceptance-desc') {
      list.sort((a, b) => (parseFloat(String(b.acceptanceRate)) || 0) - (parseFloat(String(a.acceptanceRate)) || 0));
    }

    return list;
  }, [companyProblems, questionSearch, selectedDifficulty, sortBy]);

  const handleBookmarkToggle = (q: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please log in to bookmark questions');
      dispatch(openAuthModal({ mode: 'login' }));
      return;
    }
    dispatch(
      toggleBookmarkItem({
        itemId: String(q.id),
        type: 'PROBLEM',
        title: q.title,
        difficulty: q.difficulty,
        category: q.topic || company?.name || '',
      })
    );
    toast.success('Bookmark updated');
  };

  if (isDetailsLoading && !company) {
    return (
      <div className="w-full flex flex-col items-center pb-20 font-sans bg-[#FFFFFF] dark:bg-[#070A13] text-slate-900 dark:text-slate-100 min-h-screen">
        <CompanyDetailsSkeleton />
      </div>
    );
  }

  if (!isAuthenticated && !company) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[65vh] font-sans bg-[#FFFFFF] dark:bg-[#070A13] text-slate-900 dark:text-slate-100 px-4">
        <div className="text-center p-8 max-w-md w-full rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shadow-xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-blue-500/20 to-purple-500/20 flex items-center justify-center text-blue-500 dark:text-blue-400 text-2xl">
            <i className="fa-solid fa-lock"></i>
          </div>
          <h2 className="text-xl font-bold mb-2">Sign in to View Company Details</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Log in to your account to view company interview questions, practice problem sets, and track your progress.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => dispatch(openAuthModal({ mode: 'login' }))}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-md shadow-blue-500/20 cursor-pointer"
            >
              Sign In
            </button>
            <Link
              to="/companies"
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
            >
              Browse All Companies
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[60vh] font-sans bg-[#FFFFFF] dark:bg-[#070A13] text-slate-900 dark:text-slate-100">
        <div className="text-center p-8">
          <i className="fa-solid fa-building text-4xl text-slate-400 mb-4"></i>
          <h2 className="text-xl font-bold mb-2">Company Not Found</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {companyError || "We couldn't locate details for this company."}
          </p>
          <div className="flex items-center justify-center gap-3">
            {slug && (
              <button
                type="button"
                onClick={() => dispatch(fetchCompanyBySlug(slug))}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Retry
              </button>
            )}
            <Link
              to="/companies"
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
            >
              Back to Companies
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center pb-24 font-sans bg-[#FFFFFF] dark:bg-[#070A13] text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-200 overflow-x-hidden">
      
      {/* Ambient background glows */}
      <div className="fixed top-24 -left-48 w-96 h-[400px] bg-purple-600/10 dark:bg-purple-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed top-40 -right-48 w-96 h-[500px] bg-indigo-600/10 dark:bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Main Content Container matching Practice page */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        
        {/* 1. BREADCRUMBS */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-6">
          <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors">
            <i className="fa-solid fa-house text-[11px]"></i>
          </Link>
          <span>&gt;</span>
          <Link to="/companies" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Company Prep
          </Link>
          <span>&gt;</span>
          <span className="text-slate-900 dark:text-white font-bold">{company.name}</span>
        </nav>

        {/* 2. HERO COMPANY HEADER CARD */}
        <section className="bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden mb-8">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 relative z-10 w-full">
            {/* Big Company Logo Box */}
            <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl bg-white dark:bg-[#111A2E] border border-slate-200/80 dark:border-slate-700/80 p-3 flex items-center justify-center shrink-0 shadow-xs">
              <CompanyBrandLogo name={company.name} className="w-12 h-12 sm:w-14 sm:h-14" />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
                {company.name}
              </h1>
              {company.description ? (
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed mb-4">
                  {company.description}
                </p>
              ) : null}

              {/* Stats Badges Row (ONLY real data from backend API) */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                {/* Real Questions Count from API */}
                {companyProblems.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-2xs">
                    <i className="fa-solid fa-layer-group text-xs"></i>
                    <span>{companyProblems.length} {companyProblems.length === 1 ? 'Question' : 'Questions'}</span>
                  </span>
                )}

                {/* Real Industry Badge from API */}
                {company.industry && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-2xs">
                    <i className="fa-solid fa-briefcase text-xs"></i>
                    <span>{company.industry}</span>
                  </span>
                )}

                {/* Real Website Link if present from API */}
                {(company.website || company.websiteUrl) && (
                  <a
                    href={company.website || company.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
                    <span>Website</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 3. QUESTIONS SECTION CONTAINER (Matching Image 1) */}
        <section className="bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
          
          {/* Search & Filters Bar (Matching Image 1) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
            
            {/* Search Input */}
            <div className="relative flex-1 w-full bg-slate-50 dark:bg-[#111A2E] border border-slate-200 dark:border-slate-700/80 rounded-2xl px-4 py-2.5">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs sm:text-sm"></i>
              <input
                type="text"
                placeholder="Search questions by title, tags or keywords..."
                value={questionSearch}
                onChange={(e) => setQuestionSearch(e.target.value)}
                className="w-full bg-transparent pl-7 pr-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"
              />
            </div>

            {/* Difficulty & Sort Dropdowns */}
            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
              {/* Difficulty Dropdown */}
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value as any)}
                  className="w-full sm:w-auto bg-slate-50 dark:bg-[#111A2E] border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none hover:border-blue-500/50 focus:border-blue-500 transition-colors cursor-pointer pr-9 appearance-none shadow-2xs"
                >
                  <option value="All" className="bg-white dark:bg-[#0D1322] text-slate-800 dark:text-slate-200">Difficulty: All</option>
                  <option value="Easy" className="bg-white dark:bg-[#0D1322] text-slate-800 dark:text-slate-200">Easy</option>
                  <option value="Medium" className="bg-white dark:bg-[#0D1322] text-slate-800 dark:text-slate-200">Medium</option>
                  <option value="Hard" className="bg-white dark:bg-[#0D1322] text-slate-800 dark:text-slate-200">Hard</option>
                </select>
                <i className="fa-solid fa-chevron-down text-[10px] text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
              </div>

              {/* Sort By Dropdown */}
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full sm:w-auto bg-slate-50 dark:bg-[#111A2E] border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none hover:border-blue-500/50 focus:border-blue-500 transition-colors cursor-pointer pr-9 appearance-none shadow-2xs"
                >
                  <option value="default" className="bg-white dark:bg-[#0D1322] text-slate-800 dark:text-slate-200">Sort by: Default</option>
                  <option value="difficulty-asc" className="bg-white dark:bg-[#0D1322] text-slate-800 dark:text-slate-200">Difficulty (Easy to Hard)</option>
                  <option value="difficulty-desc" className="bg-white dark:bg-[#0D1322] text-slate-800 dark:text-slate-200">Difficulty (Hard to Easy)</option>
                  <option value="acceptance-desc" className="bg-white dark:bg-[#0D1322] text-slate-800 dark:text-slate-200">Acceptance Rate</option>
                </select>
                <i className="fa-solid fa-chevron-down text-[10px] text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
              </div>
            </div>

          </div>

          {/* Questions Table (Exact matching Image 1) */}
          <div className="overflow-x-auto border border-slate-100 dark:border-slate-800/80 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/30">
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-4">Title</th>
                  <th className="py-3.5 px-4 w-32">Difficulty</th>
                  <th className="py-3.5 px-4 w-28">Acceptance</th>
                  <th className="py-3.5 px-4 w-28">Status</th>
                  <th className="py-3.5 px-2 w-10 text-center"></th>
                  <th className="py-3.5 px-4 w-24 text-right"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs sm:text-sm">
                {isQuestionsLoading ? (
                  <TableRowSkeleton rows={8} />
                ) : !isAuthenticated && companyProblems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl shadow-xs">
                          <i className="fa-solid fa-lock"></i>
                        </div>
                        <span className="font-bold text-base text-slate-900 dark:text-white">Sign In to View Questions</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          Sign in to view recruitment problems, practice coding solutions, and track your progress for {company.name}.
                        </span>
                        <button
                          type="button"
                          onClick={() => dispatch(openAuthModal({ mode: 'login' }))}
                          className="mt-1 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                        >
                          Sign In
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : filteredProblems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <i className="fa-solid fa-code text-2xl text-slate-300 dark:text-slate-600"></i>
                        <span className="font-semibold text-sm">No questions found</span>
                        <span className="text-xs text-slate-400">
                          {companyProblems.length === 0
                            ? 'Questions for this company will appear once added.'
                            : 'Try adjusting your search or difficulty filter.'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProblems.map((problem, index) => {
                    const isSolved = Boolean(solvedByProblemId[problem.id]);
                    const isBookmarked = bookmarks.some((b) => String(b.itemId) === String(problem.id));
                    const diff = problem.difficulty?.toLowerCase();
                    const acceptance =
                      problem.acceptanceRate && problem.acceptanceRate !== '—'
                        ? `${String(problem.acceptanceRate).replace('%', '')}%`
                        : '—';

                    return (
                      <tr
                        key={problem.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* # Index */}
                        <td className="py-3.5 px-4 text-center font-mono text-xs font-semibold text-slate-400">
                          {index + 1}
                        </td>

                        {/* Title */}
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                          <Link
                            to={`/problems/${problem.slug || problem.id}`}
                            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            {problem.title}
                          </Link>
                        </td>

                        {/* Difficulty with colored dot */}
                        <td className="py-3.5 px-4">
                          {problem.difficulty ? (
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  diff === 'easy'
                                    ? 'bg-emerald-500'
                                    : diff === 'hard'
                                    ? 'bg-rose-500'
                                    : 'bg-amber-500'
                                }`}
                              ></span>
                              <span
                                className={`font-medium capitalize ${
                                  diff === 'easy'
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : diff === 'hard'
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-amber-600 dark:text-amber-400'
                                }`}
                              >
                                {problem.difficulty}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>

                        {/* Acceptance */}
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono text-xs">
                          {acceptance}
                        </td>

                        {/* Status Pill (Read-only, derived from user submissions) */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold select-none ${
                              isSolved
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/60'
                            }`}
                            title={isSolved ? 'Solved via successful code submission' : 'Not yet solved'}
                          >
                            <i className={`fa-solid ${isSolved ? 'fa-check text-[10px]' : 'fa-minus text-[10px]'}`}></i>
                            <span>{isSolved ? 'Solved' : 'Not Solved'}</span>
                          </span>
                        </td>

                        {/* Bookmark Button */}
                        <td className="py-3.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={(e) => handleBookmarkToggle(problem, e)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isBookmarked
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                            }`}
                            title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Question'}
                          >
                            <i className={`fa-${isBookmarked ? 'solid' : 'regular'} fa-bookmark text-sm`}></i>
                          </button>
                        </td>

                        {/* Solve Button */}
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            to={`/problems/${problem.slug || problem.id}`}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl border border-blue-500 hover:border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 dark:text-blue-400 font-semibold text-xs transition-colors"
                          >
                            <span>Solve</span>
                            <i className="fa-solid fa-arrow-right text-[10px]"></i>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </section>

      </div>

    </div>
  );
};
