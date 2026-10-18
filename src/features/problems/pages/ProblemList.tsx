import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchProblems } from '../redux/problemSlice';
import { toggleBookmarkItem } from '../../bookmarks/redux/bookmarkSlice';
import { openAuthModal } from '../../auth/redux/authSlice';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { Pagination } from '../../../shared/components/ui/Pagination';
import { toast } from 'react-hot-toast';

export const ProblemList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { problems, loading, error, pagination } = useAppSelector((state) => state.problems);
  const { bookmarks } = useAppSelector((state) => state.bookmarks);
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const solvedByProblemId = useAppSelector((state) => state.progress.solvedByProblemId);

  const [searchParams, setSearchParams] = useSearchParams();
  const rawPage = searchParams.get('page');
  const parsedPage = Number(rawPage || '1');
  const currentPage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const pageSize = 20;

  // Sanitize invalid page query parameters (F-031)
  useEffect(() => {
    if (rawPage !== null && (!Number.isInteger(parsedPage) || parsedPage < 1)) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('page', '1');
        return next;
      }, { replace: true });
    }
  }, [rawPage, parsedPage, setSearchParams]);

  // Normalize out-of-bounds page query parameters when total pages decrease (F-031)
  useEffect(() => {
    if (!loading && pagination.totalPages > 0 && currentPage > pagination.totalPages) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('page', String(pagination.totalPages));
        return next;
      }, { replace: true });
    }
  }, [loading, pagination.totalPages, currentPage, setSearchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      if (rawPage && rawPage !== '1') {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set('page', '1');
          return next;
        }, { replace: true });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, rawPage, setSearchParams]);

  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);

  useEffect(() => {
    const request = dispatch(
      fetchProblems({
        search: debouncedSearch || undefined,
        searchText: debouncedSearch || undefined,
        page: currentPage,
        limit: pageSize,
      })
    );

    request
      .unwrap()
      .catch(() => {})
      .finally(() => {
        setHasFetchedOnce(true);
      });

    return () => request.abort();
  }, [dispatch, debouncedSearch, currentPage]);

  const isListLoading = loading || !hasFetchedOnce;

  const groupedProblems = useMemo(() => {
    const groups = new Map<string, typeof problems>();
    problems.forEach((problem) => {
      const topic = problem.topic || problem.category || '—';
      const existing = groups.get(topic) || [];
      existing.push(problem);
      groups.set(topic, existing);
    });

    return Array.from(groups.entries()).map(([topic, items], index) => ({
      num: String(index + 1).padStart(2, '0'),
      topic,
      questions: items,
    }));
  }, [problems]);

  const handleBookmarkToggle = (problem: (typeof problems)[number], e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please log in to bookmark problems');
      dispatch(openAuthModal({ mode: 'login' }));
      return;
    }

    const isCurrentlyBookmarked = bookmarks.some((b) => b.itemId === problem.id);
    dispatch(
      toggleBookmarkItem({
        itemId: problem.id,
        type: 'PROBLEM',
        title: problem.title,
        difficulty: problem.difficulty,
        category: problem.category || problem.topic || '',
      })
    )
      .unwrap()
      .then(() => {
        toast.success(isCurrentlyBookmarked ? 'Bookmark removed' : 'Problem bookmarked!');
      })
      .catch((err: any) => {
        toast.error(typeof err === 'string' ? err : 'Failed to update bookmark');
      });
  };

  const handlePageChange = (page: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(page));
      return next;
    }, { replace: true });
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  return (
    <div className="w-full flex flex-col items-center pb-20 font-sans bg-[#FFFFFF] dark:bg-[#070A13] text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-200 overflow-x-hidden">
      {/* Ambient background glows matching Practice and Companies page */}
      <div className="fixed top-24 -left-48 w-96 h-[400px] bg-purple-600/10 dark:bg-purple-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed top-40 -right-48 w-96 h-[500px] bg-indigo-600/10 dark:bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Hero Header Section */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-6 flex flex-col items-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-[#0F1D38] border border-blue-200 dark:border-blue-700/60 text-blue-600 dark:text-sky-300 text-xs font-bold uppercase tracking-wider mb-4 shadow-2xs">
          <i className="fa-solid fa-layer-group text-[10px]"></i>
          <span>CURATED DSA SHEET</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-3">
          Master Coding with{' '}
          <span className="text-blue-600 dark:text-[#38BDF8]">
            DSA Sheet
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed mb-6">
          Structured collection of coding problems organized by core topics to boost your interview readiness.
        </p>
      </section>

      {/* Search Input */}
      <div className="w-full max-w-5xl px-4 sm:px-6 lg:px-8 mb-8">
        <div className="relative w-full">
          <i className="fa-solid fa-magnifying-glass text-slate-400 text-sm absolute left-5 top-1/2 -translate-y-1/2"></i>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search problems by title or keywords..."
            className="w-full bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:border-blue-500 dark:focus:border-blue-400 shadow-sm transition-colors"
            aria-label="Search problems"
          />
        </div>
      </div>

      {isListLoading ? (
        <div className="w-full max-w-5xl px-4 sm:px-6 lg:px-8 space-y-4">
          <Skeleton className="h-16 w-full rounded-2xl" count={6} />
        </div>
      ) : !isAuthenticated && problems.length === 0 ? (
        <div className="w-full max-w-5xl px-4 sm:px-6 lg:px-8">
          <EmptyState
            title="Sign in to access DSA Sheet"
            description="Log in with your Connect 2 Code account to browse problems, track solved status, and save bookmarks."
            actionText="Sign In"
            onAction={() => dispatch(openAuthModal({ mode: 'login' }))}
            icon={<i className="fa-solid fa-lock text-3xl text-blue-500" />}
          />
        </div>
      ) : error && problems.length === 0 ? (
        <div className="w-full max-w-5xl px-4 sm:px-6 lg:px-8">
          <EmptyState
            title="Unable to load problems"
            description={error}
            actionText="Retry"
            onAction={() => dispatch(fetchProblems({ page: currentPage, limit: pageSize }))}
            icon={<i className="fa-solid fa-triangle-exclamation text-2xl text-slate-400" />}
          />
        </div>
      ) : problems.length === 0 ? (
        <div className="w-full max-w-5xl px-4 sm:px-6 lg:px-8">
          <EmptyState
            title="No problems found"
            description="The backend returned no problems for this search."
            actionText="Clear Search"
            onAction={() => setSearchInput('')}
            icon={<i className="fa-solid fa-code text-2xl text-slate-400" />}
          />
        </div>
      ) : (
        <div className="w-full max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">
          {groupedProblems.map((group) => (
            <section key={group.topic} className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 px-2.5 py-1 rounded-lg">
                  {group.num}
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {group.topic}
                </h2>
              </div>

              <div className="bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
                {group.questions.map((problem) => {
                  const solved = solvedByProblemId[problem.id] ?? problem.isSolved;
                  const bookmarked = problem.isBookmarked || bookmarks.some((b) => b.itemId === problem.id);
                  const targetSlug = problem.slug || problem.id;

                  return (
                    <div
                      key={problem.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-100 dark:border-slate-800/80 last:border-b-0 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`text-xl shrink-0 select-none ${solved ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`}
                          title={solved ? 'Solved via code submission' : 'Not yet solved'}
                        >
                          <i className={`fa-solid ${solved ? 'fa-circle-check' : 'fa-circle'}`} />
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleBookmarkToggle(problem, e)}
                          className={`p-2 rounded-xl border text-xs shrink-0 cursor-pointer transition-colors ${
                            bookmarked
                              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-500 dark:text-amber-400'
                              : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-400 hover:text-amber-500'
                          }`}
                          title={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
                        >
                          <i className={`fa-${bookmarked ? 'solid' : 'regular'} fa-star`} />
                        </button>

                        <div className="min-w-0">
                          <Link
                            to={`/problems/${targetSlug}`}
                            className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate block transition-colors"
                          >
                            {problem.title}
                          </Link>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono">
                            {problem.slug ? problem.slug : (problem.topic || problem.category || '')}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                        <span className="text-xs font-mono font-bold px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300">
                          {problem.difficulty || '—'}
                        </span>
                        <Link
                          to={`/problems/${targetSlug}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-2xs no-underline"
                        >
                          Solve
                          <i className="fa-solid fa-chevron-right text-[10px]" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {pagination.totalPages > 1 && (
            <div className="pt-2">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalElements={pagination.total}
                pageSize={pageSize}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProblemList;
