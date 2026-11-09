import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchProblems, resetFilters } from '../redux/problemSlice';
import { isBookmarkItem, toggleBookmarkItem } from '../../bookmarks/redux/bookmarkSlice';
import { openAuthModal } from '../../auth/redux/authSlice';
import { Pagination } from '../../../shared/components/ui/Pagination';
import type { ReferenceItem, Company as CompanyItem } from '../../../core/types/domain';
import { fetchReferenceGroup } from '../../references/redux/referenceSlice';
import { fetchCompanies, invalidateCompanyList } from '../../companies/redux/companySlice';
import { CodingQuestionTable } from '../components/CodingQuestionTable';
import { toast } from '@/shared/notifications/toast';
import { Lock } from 'lucide-react';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { PracticeHeroBanner } from '../components/PracticeHeroBanner';
import { C2CSelect } from '../../../shared/components/ui/C2CSelect';

const EMPTY_REFERENCES: ReferenceItem[] = [];
const EMPTY_COMPANIES: CompanyItem[] = [];
const ALLOWED_PAGE_SIZES = [10, 25, 50, 100] as const;

const parseListParam = (val: string | null): string[] => {
  if (!val) return [];
  return val
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

const isPositiveIntegerId = (value: string): boolean => {
  const numericValue = Number(value);
  return /^\d+$/.test(value) && Number.isSafeInteger(numericValue) && numericValue > 0;
};

export const PracticePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    problems: apiProblems,
    pagination: serverPagination,
    listLoading: loading,
    listError: error,
  } = useAppSelector((state) => state.problems);
  const { bookmarks } = useAppSelector((state) => state.bookmarks);
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { solvedByProblemId } = useAppSelector((state) => state.progress);
  const referenceGroups = useAppSelector((state) => state.references.groups);
  const referenceLoading = useAppSelector((state) => state.references.loading);
  const referenceErrors = useAppSelector((state) => state.references.errors);
  const serverCompanies = useAppSelector((state) => state.companies.companies);
  const companiesLoading = useAppSelector((state) => state.companies.loading);
  const companiesError = useAppSelector((state) => state.companies.error);

  const [searchParams, setSearchParams] = useSearchParams();
  const rawLimit = searchParams.get('limit') || searchParams.get('pageSize');
  const parsedLimit = Number(rawLimit);
  const pageSize = ALLOWED_PAGE_SIZES.includes(parsedLimit as (typeof ALLOWED_PAGE_SIZES)[number])
    ? parsedLimit
    : 25;

  // URL state persistence (applied filters - arrays supporting multiple selections)
  const searchInputParam = searchParams.get('q') || '';
  const selectedTopics = useMemo(() => parseListParam(searchParams.get('topic')), [searchParams]);
  const selectedDifficulties = useMemo(() => parseListParam(searchParams.get('difficulty')), [searchParams]);
  const selectedCompanies = useMemo(() => parseListParam(searchParams.get('company')), [searchParams]);
  const rawPage = searchParams.get('page');
  const parsedPage = Number(rawPage || '1');
  const currentPage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  // Draft filters staged until user clicks "Apply Filters"
  const [draftDifficulties, setDraftDifficulties] = useState<string[]>(selectedDifficulties);
  const [draftTopics, setDraftTopics] = useState<string[]>(selectedTopics);
  const [draftCompanies, setDraftCompanies] = useState<string[]>(selectedCompanies);
  const [searchInput, setSearchInput] = useState(searchInputParam);

  // In-filter search inputs
  const [topicFilterSearch, setTopicFilterSearch] = useState('');
  const [companyFilterSearch, setCompanyFilterSearch] = useState('');
  const [showMoreTopics, setShowMoreTopics] = useState(false);
  const [showMoreCompanies, setShowMoreCompanies] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Sync draft states whenever URL params change
  useEffect(() => {
    setDraftDifficulties(selectedDifficulties);
  }, [selectedDifficulties]);

  useEffect(() => {
    setDraftTopics(selectedTopics);
  }, [selectedTopics]);

  useEffect(() => {
    setDraftCompanies(selectedCompanies);
  }, [selectedCompanies]);

  useEffect(() => {
    setSearchInput(searchInputParam);
  }, [searchInputParam]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    count += selectedDifficulties.length;
    count += selectedTopics.length;
    count += selectedCompanies.length;
    if (searchInputParam.trim()) count++;
    return count;
  }, [
    selectedDifficulties,
    selectedTopics,
    selectedCompanies,
    searchInputParam,
  ]);

  const draftFilterCount = useMemo(() => {
    let count = 0;
    count += draftDifficulties.length;
    count += draftTopics.length;
    count += draftCompanies.length;
    if (searchInput.trim()) count++;
    return count;
  }, [draftDifficulties, draftTopics, draftCompanies, searchInput]);

  const hasUnappliedChanges = useMemo(() => {
    if (searchInput.trim() !== searchInputParam) return true;
    if (
      draftDifficulties.length !== selectedDifficulties.length ||
      !draftDifficulties.every((d) => selectedDifficulties.includes(d))
    ) {
      return true;
    }
    if (
      draftTopics.length !== selectedTopics.length ||
      !draftTopics.every((t) => selectedTopics.includes(t))
    ) {
      return true;
    }
    if (
      draftCompanies.length !== selectedCompanies.length ||
      !draftCompanies.every((c) => selectedCompanies.includes(c))
    ) {
      return true;
    }
    return false;
  }, [
    draftDifficulties,
    selectedDifficulties,
    draftTopics,
    selectedTopics,
    draftCompanies,
    selectedCompanies,
    searchInput,
    searchInputParam,
  ]);

  const updatePracticeParams = useCallback(
    (updates: Record<string, string | null>) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === '') next.delete(key);
            else next.set(key, value);
          });
          return next;
        },
        { replace: true, preventScrollReset: true }
      );
    },
    [setSearchParams]
  );

  // Sanitize invalid page query parameters
  useEffect(() => {
    if (rawPage !== null && (!Number.isInteger(parsedPage) || parsedPage < 1)) {
      updatePracticeParams({ page: '1' });
    }
  }, [rawPage, parsedPage, updatePracticeParams]);

  useEffect(() => {
    if (
      rawLimit !== null &&
      !ALLOWED_PAGE_SIZES.includes(parsedLimit as (typeof ALLOWED_PAGE_SIZES)[number])
    ) {
      updatePracticeParams({ limit: String(pageSize), page: '1', pageSize: null });
    }
  }, [rawLimit, parsedLimit, pageSize, updatePracticeParams]);

  // Reference groups from API
  const apiDifficulties: ReferenceItem[] = referenceGroups.DIFF ?? EMPTY_REFERENCES;
  const apiTopics: ReferenceItem[] = referenceGroups.TOPIC ?? EMPTY_REFERENCES;
  const apiCompanies = serverCompanies ?? EMPTY_COMPANIES;

  // Sort difficulties: Row 1 = Basic, Easy; Row 2 = Medium, Hard
  const sortedDifficulties = useMemo(() => {
    const order: Record<string, number> = {
      basic: 1,
      school: 1,
      easy: 2,
      medium: 3,
      hard: 4,
    };
    return [...apiDifficulties].sort((a, b) => {
      const aKey = (a.refCode || a.refName || '').toLowerCase().trim();
      const bKey = (b.refCode || b.refName || '').toLowerCase().trim();
      const aOrder = order[aKey] ?? 99;
      const bOrder = order[bKey] ?? 99;
      return aOrder - bOrder;
    });
  }, [apiDifficulties]);

  // Resolve filters to numeric backend IDs whether passed as number or name/code
  const resolvedDifficultyIds = useMemo(() => {
    const ids = new Set<number>();
    selectedDifficulties.forEach((val) => {
      if (isPositiveIntegerId(val)) ids.add(Number(val));
      const found = apiDifficulties.find(
        (d) =>
          d.refName.toLowerCase() === val.toLowerCase() ||
          d.refCode?.toLowerCase() === val.toLowerCase()
      );
      if (found?.id !== undefined && !isNaN(Number(found.id))) ids.add(Number(found.id));
    });
    return ids;
  }, [selectedDifficulties, apiDifficulties]);

  const resolvedTopicIds = useMemo(() => {
    const ids = new Set<number>();
    selectedTopics.forEach((val) => {
      if (isPositiveIntegerId(val)) ids.add(Number(val));
      const found = apiTopics.find(
        (t) =>
          t.refName.toLowerCase() === val.toLowerCase() ||
          t.refCode?.toLowerCase() === val.toLowerCase()
      );
      if (found?.id !== undefined && !isNaN(Number(found.id))) ids.add(Number(found.id));
    });
    return ids;
  }, [selectedTopics, apiTopics]);

  const resolvedCompanyIds = useMemo(() => {
    const ids = new Set<number>();
    selectedCompanies.forEach((val) => {
      if (isPositiveIntegerId(val)) ids.add(Number(val));
      const found = apiCompanies.find(
        (c) =>
          c.name.toLowerCase() === val.toLowerCase() ||
          c.slug?.toLowerCase() === val.toLowerCase() ||
          String(c.id) === val
      );
      if (found?.id !== undefined && !isNaN(Number(found.id))) ids.add(Number(found.id));
    });
    return ids;
  }, [selectedCompanies, apiCompanies]);

  const difficultyIdsKey = Array.from(resolvedDifficultyIds).join(',');
  const topicIdsKey = Array.from(resolvedTopicIds).join(',');
  const companyIdsKey = Array.from(resolvedCompanyIds).join(',');
  const difficultyIds = useMemo(() => difficultyIdsKey ? difficultyIdsKey.split(',').map(Number) : [], [difficultyIdsKey]);
  const topicIds = useMemo(() => topicIdsKey ? topicIdsKey.split(',').map(Number) : [], [topicIdsKey]);
  const companyIds = useMemo(() => companyIdsKey ? companyIdsKey.split(',').map(Number) : [], [companyIdsKey]);

  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);

  // Load catalog reference data from APIs once
  useEffect(() => {
    if (!isAuthenticated) return;
    dispatch(fetchReferenceGroup('DIFF'));
    dispatch(fetchReferenceGroup('TOPIC'));
    dispatch(fetchCompanies(undefined));
  }, [dispatch, isAuthenticated]);

  const [retryAttempt, setRetryAttempt] = useState(0);

  const hasUnresolvedDifficulty = selectedDifficulties.some(
    (val) =>
      !isPositiveIntegerId(val) &&
      !apiDifficulties.some(
        (item) =>
          item.refName.toLowerCase() === val.toLowerCase() ||
          item.refCode?.toLowerCase() === val.toLowerCase()
      )
  );
  const hasUnresolvedTopic = selectedTopics.some(
    (val) =>
      !isPositiveIntegerId(val) &&
      !apiTopics.some(
        (item) =>
          item.refName.toLowerCase() === val.toLowerCase() ||
          item.refCode?.toLowerCase() === val.toLowerCase()
      )
  );
  const hasUnresolvedCompany = selectedCompanies.some(
    (val) =>
      !isPositiveIntegerId(val) &&
      !apiCompanies.some(
        (item) =>
          item.name.toLowerCase() === val.toLowerCase() ||
          item.slug?.toLowerCase() === val.toLowerCase()
      )
  );

  const hasPendingFilterResolution = useMemo(() => {
    if (
      hasUnresolvedDifficulty &&
      (referenceLoading.DIFF || (!referenceGroups.DIFF && !referenceErrors.DIFF))
    ) return true;
    if (hasUnresolvedTopic && (referenceLoading['TOPIC'] || (!referenceGroups['TOPIC'] && !referenceErrors['TOPIC']))) return true;
    if (hasUnresolvedCompany && (companiesLoading || (serverCompanies.length === 0 && !companiesError))) return true;

    return false;
  }, [
    hasUnresolvedDifficulty,
    referenceLoading,
    referenceGroups,
    referenceErrors,
    hasUnresolvedTopic,
    hasUnresolvedCompany,
    companiesLoading,
    serverCompanies,
    companiesError,
  ]);

  const hasUnresolvedFilters = useMemo(
    () =>
      !hasPendingFilterResolution &&
      (hasUnresolvedDifficulty || hasUnresolvedTopic || hasUnresolvedCompany),
    [
      hasPendingFilterResolution,
      hasUnresolvedDifficulty,
      hasUnresolvedTopic,
      hasUnresolvedCompany,
    ]
  );

  const currentRequestKey = useMemo(() => {
    return JSON.stringify({
      page: currentPage,
      limit: pageSize,
      search: searchInputParam.trim(),
      difficulty: difficultyIds,
      topic: topicIds,
      companies: companyIds,
    });
  }, [currentPage, pageSize, searchInputParam, difficultyIds, topicIds, companyIds]);

  const [fulfilledKey, setFulfilledKey] = useState<string | null>(null);

  // Every backend-supported filter and page is owned by POST /questions. Keep
  // the URL as the UI source of truth, but never hydrate a large client-side
  // catalog and pretend its slices are server pages.
  useLayoutEffect(() => {
    let active = true;
    if (!isAuthenticated) {
      setHasFetchedOnce(true);
      return;
    }

    if (hasPendingFilterResolution || hasUnresolvedFilters) {
      return;
    }

    const request = dispatch(
      fetchProblems({
        page: currentPage,
        limit: pageSize,
        searchText: searchInputParam,
        difficulty: difficultyIds,
        topic: topicIds,
        companies: companyIds,
      })
    );

    request
      .unwrap()
      .then(() => {
        if (active) setFulfilledKey(currentRequestKey);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setHasFetchedOnce(true);
      });

    return () => {
      active = false;
      request.abort();
    };
  }, [
    dispatch,
    isAuthenticated,
    retryAttempt,
    currentPage,
    pageSize,
    searchInputParam,
    difficultyIds,
    topicIds,
    companyIds,
    hasPendingFilterResolution,
    hasUnresolvedFilters,
    currentRequestKey,
  ]);

  const isProblemsLoading =
    (loading || (!hasFetchedOnce && !hasUnresolvedFilters)) && apiProblems.length === 0;

  // Filter Selection handlers (updates DRAFT state ONLY - NO API call until Apply clicked)
  const handleDifficultyClick = (diffVal: string) => {
    setDraftDifficulties((prev) => {
      const isAlready = prev.some((d) => d.toLowerCase() === diffVal.toLowerCase());
      return isAlready
        ? prev.filter((d) => d.toLowerCase() !== diffVal.toLowerCase())
        : [...prev, diffVal];
    });
  };

  const handleTopicClick = (topicVal: string) => {
    setDraftTopics((prev) => {
      const isAlready = prev.some((t) => t.toLowerCase() === topicVal.toLowerCase());
      return isAlready
        ? prev.filter((t) => t.toLowerCase() !== topicVal.toLowerCase())
        : [...prev, topicVal];
    });
  };

  const handleCompanyClick = (compVal: string) => {
    setDraftCompanies((prev) => {
      const isAlready = prev.some((c) => c.toLowerCase() === compVal.toLowerCase());
      return isAlready
        ? prev.filter((c) => c.toLowerCase() !== compVal.toLowerCase())
        : [...prev, compVal];
    });
  };

  const handleClearDifficultyDraft = () => {
    setDraftDifficulties([]);
  };

  const handleClearTopicDraft = () => {
    setDraftTopics([]);
  };

  const handleClearCompanyDraft = () => {
    setDraftCompanies([]);
  };

  // APPLY FILTERS: Commits all staged filters to URL and triggers backend API call
  const handleApplyFilters = () => {
    const trimmed = searchInput.trim();
    updatePracticeParams({
      q: trimmed || null,
      difficulty: draftDifficulties.length > 0 ? draftDifficulties.join(',') : null,
      topic: draftTopics.length > 0 ? draftTopics.join(',') : null,
      company: draftCompanies.length > 0 ? draftCompanies.join(',') : null,
      page: '1',
    });
    if (isMobileFilterOpen) {
      setIsMobileFilterOpen(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleApplyFilters();
  };

  const handleResetFilters = () => {
    setDraftDifficulties([]);
    setDraftTopics([]);
    setDraftCompanies([]);
    setSearchInput('');
    setSearchParams(new URLSearchParams(), { replace: true, preventScrollReset: true });
    dispatch(resetFilters());
  };

  const handleFilterResolutionRetry = () => {
    if (hasUnresolvedDifficulty) {
      dispatch(fetchReferenceGroup({ groupCode: 'DIFF', force: true }));
    }
    if (hasUnresolvedTopic) {
      dispatch(fetchReferenceGroup({ groupCode: 'TOPIC', force: true }));
    }
    if (hasUnresolvedCompany) {
      dispatch(invalidateCompanyList());
      dispatch(fetchCompanies(undefined));
    }
  };

  const removeAppliedDifficulty = (val: string) => {
    const next = selectedDifficulties.filter((d) => d.toLowerCase() !== val.toLowerCase());
    setDraftDifficulties(next);
    updatePracticeParams({
      difficulty: next.length > 0 ? next.join(',') : null,
      page: '1',
    });
  };

  const removeAppliedTopic = (val: string) => {
    const next = selectedTopics.filter((t) => t.toLowerCase() !== val.toLowerCase());
    setDraftTopics(next);
    updatePracticeParams({
      topic: next.length > 0 ? next.join(',') : null,
      page: '1',
    });
  };

  const removeAppliedCompany = (val: string) => {
    const next = selectedCompanies.filter((c) => c.toLowerCase() !== val.toLowerCase());
    setDraftCompanies(next);
    updatePracticeParams({
      company: next.length > 0 ? next.join(',') : null,
      page: '1',
    });
  };

  const handlePageChange = (newPage: number) => {
    updatePracticeParams({ page: String(newPage) });
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleBookmarkToggle = (
    problemId: string,
    title: string,
    diff: string,
    cat: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please log in to bookmark problems');
      dispatch(openAuthModal({ mode: 'login' }));
      return;
    }
    const isCurrentlyBookmarked = bookmarks.some((b) => isBookmarkItem(b, problemId, 'PROBLEM'));
    dispatch(
      toggleBookmarkItem({
        itemId: problemId,
        type: 'PROBLEM',
        title: title,
        difficulty: diff,
        category: cat || '',
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

  // Filter topics for sidebar search
  const filteredTopics = useMemo(() => {
    if (!topicFilterSearch.trim()) return apiTopics;
    return apiTopics.filter((t) =>
      t.refName.toLowerCase().includes(topicFilterSearch.toLowerCase())
    );
  }, [apiTopics, topicFilterSearch]);

  // Filter companies for sidebar search
  const filteredCompanies = useMemo(() => {
    if (!companyFilterSearch.trim()) return apiCompanies;
    return apiCompanies.filter((c) =>
      c.name.toLowerCase().includes(companyFilterSearch.toLowerCase())
    );
  }, [apiCompanies, companyFilterSearch]);

  const displayedProblems = apiProblems;

  const totalMatching = serverPagination.total;
  const totalPages = Math.max(1, serverPagination.totalPages);

  // Reset page to 1 if current page is out of range
  useEffect(() => {
    if (!hasFetchedOnce || loading) return;
    if (fulfilledKey !== currentRequestKey) return;
    if (currentPage > totalPages && totalPages > 0) {
      updatePracticeParams({ page: '1' });
    }
  }, [
    currentPage,
    totalPages,
    updatePracticeParams,
    hasFetchedOnce,
    loading,
    fulfilledKey,
    currentRequestKey,
  ]);

  return (
    <div className="relative w-full flex flex-col items-center bg-[#FBFBFD] dark:bg-[#070A13] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 overflow-x-hidden min-h-screen pb-20">
      
      {/* Ambient glowing blobs matching Home page */}
      <div className="hidden dark:block fixed top-20 -left-48 w-96 h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="hidden dark:block fixed top-[45%] -right-48 w-[450px] h-[550px] bg-indigo-600/25 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="hidden dark:block fixed bottom-20 -left-40 w-96 h-[500px] bg-purple-900/20 rounded-full blur-[130px] pointer-events-none -z-10" />

      {/* 1. HERO BANNER SECTION (Exact matching user design) */}
      <PracticeHeroBanner />

      {/* 2. GLOBAL SEARCH BAR & FILTERS (Search input, Sort, Limit, Status + Active Filter Pills) */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 w-full">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <i className="fa-solid fa-magnifying-glass text-slate-400 text-sm absolute left-5 top-1/2 -translate-y-1/2"></i>
            <input
              type="text"
              placeholder="Search problems by title or keywords..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 rounded-2xl pl-12 pr-28 py-3.5 outline-none focus:border-blue-500 dark:focus:border-blue-400 shadow-2xs transition-colors"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  if (searchInputParam) {
                    updatePracticeParams({ q: null, page: '1' });
                  }
                }}
                className="absolute right-24 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer p-1"
                title="Clear search"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Page size is part of the canonical server request. */}
          <div className="flex items-center gap-2.5 w-full lg:w-auto flex-wrap sm:flex-nowrap shrink-0">
            <C2CSelect
              value={pageSize}
              onChange={(val) => {
                updatePracticeParams({ limit: val, page: '1' });
              }}
              options={ALLOWED_PAGE_SIZES.map((size) => ({
                value: String(size),
                label: `${size} / page`,
              }))}
              align="right"
              ariaLabel="Problems per page"
              className="w-full sm:w-32 shrink-0"
              buttonClassName="rounded-2xl py-3 px-4 text-xs sm:text-sm font-semibold border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0D1322] text-slate-700 dark:text-slate-300 hover:border-blue-500/50 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Active Filter Pills Bar (styled like AptitudePrep) */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1 animate-fade-in">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mr-1">
              <i className="fa-solid fa-sliders text-[11px] text-blue-500"></i> Active Filters:
            </span>

            {searchInputParam && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-sky-300 border border-blue-200/60 dark:border-blue-800/60 shadow-2xs">
                <span>Search: "{searchInputParam}"</span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    updatePracticeParams({ q: null, page: '1' });
                  }}
                  className="hover:text-rose-500 transition-colors cursor-pointer"
                  title="Remove search filter"
                >
                  <i className="fa-solid fa-xmark text-[10px]"></i>
                </button>
              </span>
            )}

            {selectedDifficulties.map((val) => {
              const label =
                apiDifficulties.find(
                  (d) =>
                    String(d.id) === val ||
                    d.refName.toLowerCase() === val.toLowerCase() ||
                    d.refCode?.toLowerCase() === val.toLowerCase()
                )?.refName || val;
              return (
                <span
                  key={`diff-${val}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs"
                >
                  <span>{label}</span>
                  <button
                    type="button"
                    onClick={() => removeAppliedDifficulty(val)}
                    className="hover:text-rose-500 transition-colors cursor-pointer"
                    title={`Remove ${label}`}
                  >
                    <i className="fa-solid fa-xmark text-[10px]"></i>
                  </button>
                </span>
              );
            })}

            {selectedTopics.map((val) => {
              const label =
                apiTopics.find(
                  (t) =>
                    String(t.id) === val ||
                    t.refName.toLowerCase() === val.toLowerCase() ||
                    t.refCode?.toLowerCase() === val.toLowerCase()
                )?.refName || val;
              return (
                <span
                  key={`topic-${val}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs"
                >
                  <span>{label}</span>
                  <button
                    type="button"
                    onClick={() => removeAppliedTopic(val)}
                    className="hover:text-rose-500 transition-colors cursor-pointer"
                    title={`Remove ${label}`}
                  >
                    <i className="fa-solid fa-xmark text-[10px]"></i>
                  </button>
                </span>
              );
            })}

            {selectedCompanies.map((val) => {
              const label =
                apiCompanies.find(
                  (c) =>
                    String(c.id) === val ||
                    c.name.toLowerCase() === val.toLowerCase() ||
                    c.slug?.toLowerCase() === val.toLowerCase()
                )?.name || val;
              return (
                <span
                  key={`comp-${val}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs"
                >
                  <span>{label}</span>
                  <button
                    type="button"
                    onClick={() => removeAppliedCompany(val)}
                    className="hover:text-rose-500 transition-colors cursor-pointer"
                    title={`Remove ${label}`}
                  >
                    <i className="fa-solid fa-xmark text-[10px]"></i>
                  </button>
                </span>
              );
            })}

            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-bold text-rose-500 dark:text-rose-400 hover:underline cursor-pointer ml-1"
            >
              Clear All
            </button>
          </div>
        )}
      </section>

      {/* 3. MAIN CATALOG: SIDEBAR FILTERS (Left) + DATA TABLE (Right) */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        
        {/* Mobile Filter Toggle Button Bar (lg:hidden) */}
        <div className="lg:hidden flex items-center justify-between bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 mb-6 shadow-xs">
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen((prev) => !prev)}
            className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <i className="fa-solid fa-sliders text-xs"></i>
            </div>
            <span>Filter Problems</span>
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-600 text-white shadow-2xs">
                {activeFilterCount} Active
              </span>
            )}
            <i className={`fa-solid fa-chevron-${isMobileFilterOpen ? 'up' : 'down'} text-[11px] text-slate-400 ml-1 transition-transform`}></i>
          </button>

          {(activeFilterCount > 0 || draftFilterCount > 0) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-semibold text-rose-500 dark:text-rose-400 hover:underline cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* SIDEBAR FILTERS (Left 3 cols on lg, collapsible on mobile) */}
          <div className={`${isMobileFilterOpen ? 'flex' : 'hidden'} lg:flex lg:col-span-3 flex-col gap-4 bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs`}>
            
            {/* APPLY FILTERS BUTTON AT THE VERY TOP OF THE FILTERS DIV */}
            <div className="w-full pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={handleApplyFilters}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-md ${
                  hasUnappliedChanges
                    ? 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white ring-2 ring-blue-500/30'
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white'
                }`}
              >
                <i className="fa-solid fa-filter text-xs"></i>
                <span>Apply Filters</span>
                {hasUnappliedChanges && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" title="Unapplied changes"></span>
                )}
              </button>
            </div>

            {/* Header: Filters Title + Clear All */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-sliders text-blue-600 dark:text-blue-400 text-sm"></i>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Filters</h3>
                {draftFilterCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400">
                    {draftFilterCount}
                  </span>
                )}
              </div>
              {(draftFilterCount > 0 || activeFilterCount > 0) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-semibold text-rose-500 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Unauthenticated Guide Banner */}
            {!isAuthenticated && apiDifficulties.length === 0 && (
              <div className="flex flex-col items-center justify-center p-4 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <i className="fa-solid fa-lock text-xl text-blue-500 mb-2"></i>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Sign In to Filter</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 mb-3">
                  Log in to filter problems by difficulty level, topic tags, and company categories.
                </p>
                <button
                  type="button"
                  onClick={() => dispatch(openAuthModal({ mode: 'login' }))}
                  className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            )}

            {/* Difficulty Level Filter from API: Row 1 = Basic, Easy | Row 2 = Medium, Hard */}
            {sortedDifficulties.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Difficulty</span>
                  {draftDifficulties.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearDifficultyDraft}
                      className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {sortedDifficulties.map((diff) => {
                    const isSelected = draftDifficulties.some(
                      (d) =>
                        d === String(diff.id) ||
                        d.toLowerCase() === diff.refName.toLowerCase() ||
                        d.toLowerCase() === diff.refCode?.toLowerCase()
                    );
                    return (
                      <button
                        key={diff.id}
                        type="button"
                        onClick={() => handleDifficultyClick(String(diff.id))}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center border cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {diff.refName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Topics Section from API */}
            {apiTopics.length > 0 && (
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Topics</span>
                  {draftTopics.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearTopicDraft}
                      className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="relative">
                  <i className="fa-solid fa-magnifying-glass text-slate-400 text-[10px] absolute left-2.5 top-1/2 -translate-y-1/2"></i>
                  <input
                    type="text"
                    placeholder="Search topics..."
                    value={topicFilterSearch}
                    onChange={(e) => setTopicFilterSearch(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-7 pr-2.5 py-1 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto no-scrollbar">
                  {filteredTopics
                    .slice(0, showMoreTopics ? filteredTopics.length : 8)
                    .map((topic) => {
                      const isSelected = draftTopics.some(
                        (t) =>
                          t === String(topic.id) ||
                          t.toLowerCase() === topic.refName.toLowerCase() ||
                          t.toLowerCase() === topic.refCode?.toLowerCase()
                      );
                      return (
                        <button
                          type="button"
                          key={topic.id}
                          onClick={() => handleTopicClick(String(topic.id))}
                          aria-pressed={isSelected}
                          className="flex w-full items-center justify-between text-left text-xs py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 truncate">
                            <span
                              className={`w-3.5 h-3.5 rounded flex items-center justify-center border shrink-0 ${
                                isSelected
                                  ? 'bg-blue-600 border-blue-600 text-white'
                                  : 'border-slate-300 dark:border-slate-600'
                              }`}
                            >
                              {isSelected && <i className="fa-solid fa-check text-[9px]"></i>}
                            </span>
                            <span className="truncate">{topic.refName}</span>
                          </div>
                        </button>
                      );
                    })}
                </div>

                {filteredTopics.length > 8 && (
                  <button
                    type="button"
                    onClick={() => setShowMoreTopics(!showMoreTopics)}
                    className="text-left text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline pt-0.5 cursor-pointer"
                  >
                    {showMoreTopics ? 'Show Less ∧' : `Show All (${filteredTopics.length}) ∨`}
                  </button>
                )}
              </div>
            )}

            {/* Companies Section from API */}
            {apiCompanies.length > 0 && (
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Companies</span>
                  {draftCompanies.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearCompanyDraft}
                      className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="relative">
                  <i className="fa-solid fa-magnifying-glass text-slate-400 text-[10px] absolute left-2.5 top-1/2 -translate-y-1/2"></i>
                  <input
                    type="text"
                    placeholder="Search companies..."
                    value={companyFilterSearch}
                    onChange={(e) => setCompanyFilterSearch(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-7 pr-2.5 py-1 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto no-scrollbar">
                  {filteredCompanies
                    .slice(0, showMoreCompanies ? filteredCompanies.length : 8)
                    .map((comp) => {
                      const compId = String(comp.id || comp.slug || comp.name);
                      const isSelected = draftCompanies.some(
                        (c) =>
                          c === compId ||
                          c === String(comp.id) ||
                          c.toLowerCase() === comp.name.toLowerCase() ||
                          (comp.slug && c.toLowerCase() === comp.slug.toLowerCase())
                      );
                      return (
                        <button
                          type="button"
                          key={compId}
                          onClick={() => handleCompanyClick(String(comp.id))}
                          aria-pressed={isSelected}
                          className="flex w-full items-center justify-between text-left text-xs py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 truncate">
                            <span
                              className={`w-3.5 h-3.5 rounded flex items-center justify-center border shrink-0 ${
                                isSelected
                                  ? 'bg-blue-600 border-blue-600 text-white'
                                  : 'border-slate-300 dark:border-slate-600'
                              }`}
                            >
                              {isSelected && <i className="fa-solid fa-check text-[9px]"></i>}
                            </span>
                            <span className="truncate">{comp.name}</span>
                          </div>
                        </button>
                      );
                    })}
                </div>

                {filteredCompanies.length > 8 && (
                  <button
                    type="button"
                    onClick={() => setShowMoreCompanies(!showMoreCompanies)}
                    className="text-left text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline pt-0.5 cursor-pointer"
                  >
                    {showMoreCompanies ? 'Show Less ∧' : `Show All (${filteredCompanies.length}) ∨`}
                  </button>
                )}
              </div>
            )}

          </div>

          {/* MAIN DATA TABLE (Right 9 cols on lg) */}
          <div ref={resultsRef} className="lg:col-span-9 flex flex-col gap-4 scroll-mt-24">
            {!isAuthenticated && displayedProblems.length === 0 ? (
              <EmptyState
                title="Sign in to explore Problem Bank"
                description="Log in with your Connect 2 Code account to browse coding problems, track your submissions, and practice algorithms."
                actionText="Sign In"
                onAction={() => dispatch(openAuthModal({ mode: 'login' }))}
                icon={<Lock className="w-12 h-12 text-blue-500" />}
              />
            ) : (
              <>
                {hasUnresolvedFilters ? (
                  <EmptyState
                    title="Some filters could not be resolved"
                    description="Results were not requested without the selected filters. Retry the reference data or clear the invalid filters."
                    actionText="Retry filter data"
                    onAction={handleFilterResolutionRetry}
                  />
                ) : (
                  <CodingQuestionTable
                    questions={displayedProblems}
                    companies={serverCompanies}
                    loading={isProblemsLoading}
                    error={error && displayedProblems.length === 0 ? error : null}
                    onRetry={() => setRetryAttempt((value) => value + 1)}
                    isSolved={(problem) => Boolean(solvedByProblemId[String(problem.id)])}
                    isBookmarked={(problem) => bookmarks.some((bookmark) => isBookmarkItem(bookmark, problem.id, 'PROBLEM'))}
                    onBookmark={(problem, event) => handleBookmarkToggle(String(problem.id), problem.title, problem.difficulty, problem.topic || problem.category, event)}
                  />
                )}


            {/* Pagination Controls (Reflects total matching filtered problems) */}
            {!isProblemsLoading &&
              !hasPendingFilterResolution &&
              !hasUnresolvedFilters &&
              totalPages > 0 &&
              totalMatching > 0 && (
              <div className="pt-2">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalElements={totalMatching}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}

      </div>

        </div>
      </section>

      {/* Floating Status Popup for Updating Results */}
      {loading && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 text-white text-xs font-semibold shadow-2xl border border-slate-700/60 backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 pointer-events-none"
        >
          <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0"></div>
          <span>Updating results…</span>
        </div>
      )}

      {/* Floating Error Notification with Retry when showing stale data */}
      {error && apiProblems.length > 0 && !loading && (
        <div
          role="alert"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-rose-950/95 text-rose-200 text-xs font-semibold shadow-2xl border border-rose-800/60 backdrop-blur-md"
        >
          <i className="fa-solid fa-circle-exclamation text-rose-400 text-sm shrink-0"></i>
          <span>Failed to refresh ({error}). Showing previous results.</span>
          <button
            type="button"
            onClick={() => setRetryAttempt((value) => value + 1)}
            className="ml-2 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

    </div>
  );
};

export default PracticePage;
