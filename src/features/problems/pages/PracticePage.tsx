import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchProblems, resetFilters } from '../redux/problemSlice';
import { isBookmarkItem, toggleBookmarkItem } from '../../bookmarks/redux/bookmarkSlice';
import { openAuthModal } from '../../auth/redux/authSlice';
import { TableRowSkeleton } from '../../../shared/components/ui/Skeleton';
import { Pagination } from '../../../shared/components/ui/Pagination';
import type { Problem, ReferenceItem, Company as CompanyItem } from '../../../core/types/domain';
import { fetchReferenceGroup } from '../../references/redux/referenceSlice';
import { fetchCompanies } from '../../companies/redux/companySlice';
import { CompanyCircleBadge } from '../../companies/components/CompanyBrandLogo';
import { toast } from 'react-hot-toast';
import { Lock } from 'lucide-react';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { PracticeHeroBanner } from '../components/PracticeHeroBanner';

const EMPTY_REFERENCES: ReferenceItem[] = [];
const EMPTY_COMPANIES: CompanyItem[] = [];

const getDifficultyRank = (diff?: string): number => {
  if (!diff) return 99;
  const d = diff.toLowerCase().trim();
  if (d.includes('basic') || d.includes('school')) return 1;
  if (d.includes('easy')) return 2;
  if (d.includes('medium')) return 3;
  if (d.includes('hard')) return 4;
  return 99;
};

const parseListParam = (val: string | null): string[] => {
  if (!val) return [];
  return val
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

export const PracticePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { problems: apiProblems, listLoading: loading, listError: error } = useAppSelector((state) => state.problems);
  const { bookmarks } = useAppSelector((state) => state.bookmarks);
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { solvedByProblemId } = useAppSelector((state) => state.progress);
  const referenceGroups = useAppSelector((state) => state.references.groups);
  const serverCompanies = useAppSelector((state) => state.companies.companies);

  const [searchParams, setSearchParams] = useSearchParams();
  const rawLimit = searchParams.get('limit') || searchParams.get('pageSize');
  const allowedPageSizes = [10, 25, 50, 100];
  const parsedLimit = Number(rawLimit);
  const pageSize = allowedPageSizes.includes(parsedLimit) ? parsedLimit : 25;

  // URL state persistence (applied filters - arrays supporting multiple selections)
  const searchInputParam = searchParams.get('q') || '';
  const selectedTopics = useMemo(() => parseListParam(searchParams.get('topic')), [searchParams]);
  const selectedDifficulties = useMemo(() => parseListParam(searchParams.get('difficulty')), [searchParams]);
  const selectedCompanies = useMemo(() => parseListParam(searchParams.get('company')), [searchParams]);
  const selectedPlatforms = useMemo(() => parseListParam(searchParams.get('platform')), [searchParams]);
  const selectedStatus = searchParams.get('status') || '';
  const selectedSort = searchParams.get('sort') || '';
  const rawPage = searchParams.get('page');
  const parsedPage = Number(rawPage || '1');
  const currentPage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  // Draft filters staged until user clicks "Apply Filters"
  const [draftDifficulties, setDraftDifficulties] = useState<string[]>(selectedDifficulties);
  const [draftTopics, setDraftTopics] = useState<string[]>(selectedTopics);
  const [draftCompanies, setDraftCompanies] = useState<string[]>(selectedCompanies);
  const [draftPlatforms, setDraftPlatforms] = useState<string[]>(selectedPlatforms);
  const [searchInput, setSearchInput] = useState(searchInputParam);

  // In-filter search inputs
  const [topicFilterSearch, setTopicFilterSearch] = useState('');
  const [companyFilterSearch, setCompanyFilterSearch] = useState('');
  const [platformFilterSearch, setPlatformFilterSearch] = useState('');
  const [showMoreTopics, setShowMoreTopics] = useState(false);
  const [showMoreCompanies, setShowMoreCompanies] = useState(false);
  const [showMorePlatforms, setShowMorePlatforms] = useState(false);
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
    setDraftPlatforms(selectedPlatforms);
  }, [selectedPlatforms]);

  useEffect(() => {
    setSearchInput(searchInputParam);
  }, [searchInputParam]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    count += selectedDifficulties.length;
    count += selectedTopics.length;
    count += selectedCompanies.length;
    count += selectedPlatforms.length;
    if (searchInputParam.trim()) count++;
    if (selectedStatus) count++;
    if (selectedSort) count++;
    return count;
  }, [
    selectedDifficulties,
    selectedTopics,
    selectedCompanies,
    selectedPlatforms,
    searchInputParam,
    selectedStatus,
    selectedSort,
  ]);

  const draftFilterCount = useMemo(() => {
    let count = 0;
    count += draftDifficulties.length;
    count += draftTopics.length;
    count += draftCompanies.length;
    count += draftPlatforms.length;
    if (searchInput.trim()) count++;
    return count;
  }, [draftDifficulties, draftTopics, draftCompanies, draftPlatforms, searchInput]);

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
    if (
      draftPlatforms.length !== selectedPlatforms.length ||
      !draftPlatforms.every((p) => selectedPlatforms.includes(p))
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
    draftPlatforms,
    selectedPlatforms,
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

  // Reference groups from API
  const apiDifficulties: ReferenceItem[] = referenceGroups.DIFF ?? EMPTY_REFERENCES;
  const apiTopics: ReferenceItem[] = referenceGroups.TOPIC ?? EMPTY_REFERENCES;
  const apiPlatforms: ReferenceItem[] = referenceGroups.QPF ?? EMPTY_REFERENCES;
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
      if (!isNaN(Number(val))) ids.add(Number(val));
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
      if (!isNaN(Number(val))) ids.add(Number(val));
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
      if (!isNaN(Number(val))) ids.add(Number(val));
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

  const resolvedPlatformIds = useMemo(() => {
    const ids = new Set<number>();
    selectedPlatforms.forEach((val) => {
      if (!isNaN(Number(val))) ids.add(Number(val));
      const found = apiPlatforms.find(
        (p) =>
          p.refName.toLowerCase() === val.toLowerCase() ||
          p.refCode?.toLowerCase() === val.toLowerCase() ||
          String(p.id) === val
      );
      if (found?.id !== undefined && !isNaN(Number(found.id))) ids.add(Number(found.id));
    });
    return ids;
  }, [selectedPlatforms, apiPlatforms]);

  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);

  // Load catalog reference data from APIs once
  useEffect(() => {
    dispatch(fetchReferenceGroup('DIFF'));
    dispatch(fetchReferenceGroup('TOPIC'));
    dispatch(fetchReferenceGroup('QPF'));
    dispatch(fetchCompanies(undefined));
  }, [dispatch]);

  const [retryAttempt, setRetryAttempt] = useState(0);

  // Load the full problems catalog so filtering operates across all items without being pre-sliced by pagination
  useLayoutEffect(() => {
    let active = true;
    if (!isAuthenticated) {
      setHasFetchedOnce(true);
      return;
    }

    const request = dispatch(
      fetchProblems({
        page: 1,
        limit: 100,
      })
    );

    request
      .unwrap()
      .catch(() => {})
      .finally(() => {
        if (active) setHasFetchedOnce(true);
      });

    return () => {
      active = false;
      request.abort();
    };
  }, [dispatch, isAuthenticated, retryAttempt]);

  const isProblemsLoading = (loading || !hasFetchedOnce) && apiProblems.length === 0;

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

  const handlePlatformClick = (platVal: string) => {
    setDraftPlatforms((prev) => {
      const isAlready = prev.some((p) => p.toLowerCase() === platVal.toLowerCase());
      return isAlready
        ? prev.filter((p) => p.toLowerCase() !== platVal.toLowerCase())
        : [...prev, platVal];
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

  const handleClearPlatformDraft = () => {
    setDraftPlatforms([]);
  };

  // APPLY FILTERS: Commits all staged filters to URL and triggers backend API call
  const handleApplyFilters = () => {
    const trimmed = searchInput.trim();
    updatePracticeParams({
      q: trimmed || null,
      difficulty: draftDifficulties.length > 0 ? draftDifficulties.join(',') : null,
      topic: draftTopics.length > 0 ? draftTopics.join(',') : null,
      company: draftCompanies.length > 0 ? draftCompanies.join(',') : null,
      platform: draftPlatforms.length > 0 ? draftPlatforms.join(',') : null,
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
    setDraftPlatforms([]);
    setSearchInput('');
    setSearchParams(new URLSearchParams(), { replace: true, preventScrollReset: true });
    dispatch(resetFilters());
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

  const removeAppliedPlatform = (val: string) => {
    const next = selectedPlatforms.filter((p) => p.toLowerCase() !== val.toLowerCase());
    setDraftPlatforms(next);
    updatePracticeParams({
      platform: next.length > 0 ? next.join(',') : null,
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

  // Filter platforms for sidebar search
  const filteredPlatforms = useMemo(() => {
    if (!platformFilterSearch.trim()) return apiPlatforms;
    return apiPlatforms.filter(
      (p) =>
        p.refName.toLowerCase().includes(platformFilterSearch.toLowerCase()) ||
        p.refCode?.toLowerCase().includes(platformFilterSearch.toLowerCase())
    );
  }, [apiPlatforms, platformFilterSearch]);

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

  // Filter problems across all criteria without prior pagination restrictions (production standard)
  const filteredProblems = useMemo(() => {
    let list = apiProblems;

    // 1. Search Query filter
    if (searchInputParam.trim()) {
      const q = searchInputParam.trim().toLowerCase();
      list = list.filter((p) => {
        const title = (p.title || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const topic = (p.topic || '').toLowerCase();
        const diff = (p.difficulty || '').toLowerCase();
        return title.includes(q) || desc.includes(q) || topic.includes(q) || diff.includes(q);
      });
    }

    // 2. Difficulty filter (matches if problem matches ANY selected difficulty)
    if (selectedDifficulties.length > 0) {
      list = list.filter((p) => {
        const pDiffId = p.difficultyId !== undefined ? Number(p.difficultyId) : undefined;
        if (pDiffId !== undefined && resolvedDifficultyIds.has(pDiffId)) return true;
        const diffName = (p.difficulty || '').toLowerCase().trim();
        return selectedDifficulties.some((target) => {
          const targetItem = apiDifficulties.find(
            (d) =>
              String(d.id) === target ||
              d.refName.toLowerCase() === target.toLowerCase() ||
              d.refCode?.toLowerCase() === target.toLowerCase()
          );
          const targetName = (targetItem?.refName || target).toLowerCase().trim();
          const targetCode = (targetItem?.refCode || '').toLowerCase().trim();
          return diffName === targetName || (targetCode && diffName === targetCode);
        });
      });
    }

    // 3. Topic filter (matches if problem matches ANY selected topic)
    if (selectedTopics.length > 0) {
      list = list.filter((p) => {
        const pTopicId = p.topicId !== undefined ? Number(p.topicId) : undefined;
        if (pTopicId !== undefined && resolvedTopicIds.has(pTopicId)) return true;
        const topicName = (p.topic || '').toLowerCase().trim();
        return selectedTopics.some((target) => {
          const targetItem = apiTopics.find(
            (t) =>
              String(t.id) === target ||
              t.refName.toLowerCase() === target.toLowerCase() ||
              t.refCode?.toLowerCase() === target.toLowerCase()
          );
          const targetName = (targetItem?.refName || target).toLowerCase().trim();
          return topicName === targetName;
        });
      });
    }

    // 4. Company filter (matches if problem matches ANY selected company)
    if (selectedCompanies.length > 0) {
      list = list.filter((p) => {
        if (!Array.isArray(p.companies) || p.companies.length === 0) return false;
        return selectedCompanies.some((selComp) => {
          const targetComp = (
            apiCompanies.find(
              (c) =>
                String(c.id) === selComp ||
                c.name.toLowerCase() === selComp.toLowerCase() ||
                c.slug?.toLowerCase() === selComp.toLowerCase()
            )?.name || selComp
          ).toLowerCase().trim();

          return p.companies.some((c: any) => {
            if (c?.id !== undefined && resolvedCompanyIds.has(Number(c.id))) {
              return true;
            }
            const compStr = (typeof c === 'string' ? c : c?.name || String(c?.id || '')).toLowerCase().trim();
            return compStr === targetComp || compStr.includes(targetComp);
          });
        });
      });
    }

    // 5. Platform filter (matches if problem matches ANY selected platform)
    if (selectedPlatforms.length > 0) {
      list = list.filter((prob) => {
        const code = (prob.qpfRefCode || '').toUpperCase().trim();
        const name = (
          prob.questionPlatform ||
          prob.qpfRefName ||
          prob.examPlatform ||
          prob.platformName ||
          ''
        ).toLowerCase().trim();

        return selectedPlatforms.some((selPlat) => {
          const selectedItem = apiPlatforms.find(
            (p) =>
              resolvedPlatformIds.has(p.id) ||
              String(p.id) === selPlat ||
              p.refCode.toLowerCase() === selPlat.toLowerCase() ||
              p.refName.toLowerCase() === selPlat.toLowerCase()
          );
          const targetCode = (selectedItem?.refCode || selPlat).toUpperCase().trim();
          const targetName = (selectedItem?.refName || '').toLowerCase().trim();

          if (code && code === targetCode) return true;
          if (targetName && name.includes(targetName)) return true;
          if (targetCode === 'GFG' && name.includes('geeks')) return true;
          if (targetCode === 'LEETCODE' && name.includes('leetcode')) return true;
          if (targetCode === 'HACKERRANK' && name.includes('hackerrank')) return true;
          if (targetCode === 'METTL' && name.includes('mettl')) return true;
          if (targetCode === 'TCSION' && (name.includes('tcs') || name.includes('ion'))) return true;
          if (targetCode === 'AON' && name.includes('aon')) return true;
          return false;
        });
      });
    }

    // 6. Status filter
    if (selectedStatus === 'solved') {
      list = list.filter((prob) => Boolean(solvedByProblemId[String(prob.id)]));
    } else if (selectedStatus === 'bookmarked') {
      list = list.filter((prob) => bookmarks.some((b) => isBookmarkItem(b, prob.id, 'PROBLEM')));
    }

    // 7. Sort filter
    if (selectedSort === 'easy-to-hard') {
      list = [...list].sort(
        (a, b) => getDifficultyRank(a.difficulty) - getDifficultyRank(b.difficulty)
      );
    } else if (selectedSort === 'hard-to-easy') {
      list = [...list].sort(
        (a, b) => getDifficultyRank(b.difficulty) - getDifficultyRank(a.difficulty)
      );
    }

    return list;
  }, [
    apiProblems,
    searchInputParam,
    selectedDifficulties,
    resolvedDifficultyIds,
    apiDifficulties,
    selectedTopics,
    resolvedTopicIds,
    apiTopics,
    selectedCompanies,
    resolvedCompanyIds,
    apiCompanies,
    selectedPlatforms,
    resolvedPlatformIds,
    apiPlatforms,
    selectedStatus,
    solvedByProblemId,
    bookmarks,
    selectedSort,
  ]);

  const totalMatching = filteredProblems.length;
  const totalPages = Math.max(1, Math.ceil(totalMatching / pageSize));

  // Reset page to 1 if current page is out of range
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      updatePracticeParams({ page: '1' });
    }
  }, [currentPage, totalPages, updatePracticeParams]);

  // Paginate AFTER filtering across the entire dataset (production standard)
  const displayedProblems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredProblems.slice(startIndex, startIndex + pageSize);
  }, [filteredProblems, currentPage, pageSize]);

  // Company lookup map for retrieving authentic logos and websites
  const companyMap = useMemo(() => {
    const map = new Map<string, CompanyItem>();
    serverCompanies.forEach((c) => {
      if (c.name) map.set(c.name.toLowerCase().trim(), c);
      if (c.slug) map.set(c.slug.toLowerCase().trim(), c);
    });
    return map;
  }, [serverCompanies]);

  // Difficulty color styling for the question number (#)
  const getDifficultyNumberColor = (difficulty: string) => {
    if (!difficulty) return 'text-slate-400 dark:text-slate-500';
    const d = difficulty.toLowerCase().trim();
    if (d.includes('easy')) {
      return 'text-emerald-600 dark:text-emerald-400 font-bold';
    }
    if (d.includes('medium')) {
      return 'text-amber-500 dark:text-orange-400 font-bold';
    }
    if (d.includes('hard')) {
      return 'text-rose-600 dark:text-rose-400 font-bold';
    }
    if (d.includes('basic') || d.includes('school')) {
      return 'text-sky-500 dark:text-sky-400 font-bold';
    }
    return 'text-slate-500 dark:text-slate-400 font-bold';
  };

  const getPlatformBadge = (prob: Problem) => {
    const rawPlatform =
      prob.questionPlatform ||
      prob.qpfRefName ||
      prob.examPlatform ||
      prob.platformName ||
      prob.qpfRefCode;

    const pLower = (rawPlatform || 'Unspecified').toLowerCase();
    let badgeColor =
      'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60';
    let displayName = rawPlatform || 'Unspecified';
    let iconClass = 'fa-solid fa-laptop-code';

    if (pLower.includes('leetcode')) {
      badgeColor =
        'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/60';
      displayName = 'LeetCode';
      iconClass = 'fa-solid fa-code';
    } else if (pLower.includes('hackerrank')) {
      badgeColor =
        'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/60';
      displayName = 'HackerRank';
      iconClass = 'fa-solid fa-code';
    } else if (pLower.includes('geeks') || pLower.includes('gfg')) {
      badgeColor =
        'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-200/80 dark:border-green-800/60';
      displayName = 'GeeksforGeeks';
      iconClass = 'fa-solid fa-code';
    } else if (pLower.includes('tcs') || pLower.includes('ion')) {
      badgeColor =
        'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60';
      displayName = 'TCS iON';
      iconClass = 'fa-solid fa-laptop-code';
    } else if (pLower.includes('aon')) {
      badgeColor =
        'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/60';
      displayName = 'AON';
      iconClass = 'fa-solid fa-shield-halved';
    } else if (pLower.includes('mettl')) {
      badgeColor =
        'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60';
      displayName = 'Mettl';
      iconClass = 'fa-solid fa-laptop-file';
    } else if (pLower.includes('connect')) {
      badgeColor =
        'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60';
      displayName = 'Connect 2 Code';
      iconClass = 'fa-solid fa-code';
    }

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${badgeColor}`}
      >
        <i className={`${iconClass} text-[10px]`}></i>
        <span className="truncate max-w-[130px]">{displayName}</span>
      </span>
    );
  };

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

          {/* Quick Filters Beside Search: Status, Sort, Problems Per Page */}
          <div className="flex items-center gap-2.5 w-full lg:w-auto flex-wrap sm:flex-nowrap shrink-0">
            {/* 1. Status Dropdown */}
            <div className="relative flex-1 sm:flex-initial shrink-0 min-w-[120px]">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  updatePracticeParams({ status: e.target.value || null, page: '1' });
                }}
                className="w-full appearance-none bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 rounded-2xl pl-4 pr-10 py-3 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none hover:border-blue-500/50 focus:border-blue-500 transition-colors cursor-pointer shadow-2xs"
                aria-label="Filter by status"
              >
                <option value="" className="bg-white dark:bg-[#0D1322] text-slate-800 dark:text-slate-200">
                  Status
                </option>
                <option value="solved" className="bg-white dark:bg-[#0D1322] text-slate-800 dark:text-slate-200">
                  Solved
                </option>
                <option value="bookmarked" className="bg-white dark:bg-[#0D1322] text-slate-800 dark:text-slate-200">
                  Bookmarked
                </option>
              </select>
              <i className="fa-solid fa-chevron-down absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
            </div>

            {/* 2. Sort Dropdown */}
            <div className="relative flex-1 sm:flex-initial shrink-0 min-w-[140px]">
              <select
                value={selectedSort}
                onChange={(e) => {
                  updatePracticeParams({ sort: e.target.value || null, page: '1' });
                }}
                className="w-full appearance-none bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 rounded-2xl pl-4 pr-10 py-3 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none hover:border-blue-500/50 focus:border-blue-500 transition-colors cursor-pointer shadow-2xs"
                aria-label="Sort problems"
              >
                <option value="" className="bg-white dark:bg-[#0D1322] text-slate-800 dark:text-slate-200">
                  Sort
                </option>
                <option value="easy-to-hard" className="bg-white dark:bg-[#0D1322] text-slate-800 dark:text-slate-200">
                  Easy to Hard
                </option>
                <option value="hard-to-easy" className="bg-white dark:bg-[#0D1322] text-slate-800 dark:text-slate-200">
                  Hard to Easy
                </option>
              </select>
              <i className="fa-solid fa-chevron-down absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
            </div>

            {/* 3. Problems Per Page Dropdown */}
            <div className="relative flex-1 sm:flex-initial shrink-0 min-w-[115px]">
              <select
                value={pageSize}
                onChange={(e) => {
                  updatePracticeParams({ limit: e.target.value, page: '1' });
                }}
                className="w-full appearance-none bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 rounded-2xl pl-4 pr-10 py-3 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none hover:border-blue-500/50 focus:border-blue-500 transition-colors cursor-pointer shadow-2xs"
                aria-label="Problems per page"
              >
                <option value="10" className="bg-white dark:bg-[#0D1322] text-slate-800 dark:text-slate-200">
                  10 / page
                </option>
                <option value="25" className="bg-white dark:bg-[#0D1322] text-slate-800 dark:text-slate-200">
                  25 / page
                </option>
                <option value="50" className="bg-white dark:bg-[#0D1322] text-slate-800 dark:text-slate-200">
                  50 / page
                </option>
                <option value="100" className="bg-white dark:bg-[#0D1322] text-slate-800 dark:text-slate-200">
                  100 / page
                </option>
              </select>
              <i className="fa-solid fa-chevron-down absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
            </div>
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

            {selectedStatus && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 shadow-2xs">
                <span>{selectedStatus === 'solved' ? 'Solved' : 'Bookmarked'}</span>
                <button
                  type="button"
                  onClick={() => updatePracticeParams({ status: null, page: '1' })}
                  className="hover:text-rose-500 transition-colors cursor-pointer"
                  title="Remove status filter"
                >
                  <i className="fa-solid fa-xmark text-[10px]"></i>
                </button>
              </span>
            )}

            {selectedSort && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 shadow-2xs">
                <span>{selectedSort === 'easy-to-hard' ? 'Easy to Hard' : 'Hard to Easy'}</span>
                <button
                  type="button"
                  onClick={() => updatePracticeParams({ sort: null, page: '1' })}
                  className="hover:text-rose-500 transition-colors cursor-pointer"
                  title="Remove sort"
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

            {selectedPlatforms.map((val) => {
              const label =
                apiPlatforms.find(
                  (p) =>
                    String(p.id) === val ||
                    p.refName.toLowerCase() === val.toLowerCase() ||
                    p.refCode.toLowerCase() === val.toLowerCase()
                )?.refName || val;
              return (
                <span
                  key={`plat-${val}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs"
                >
                  <span>{label}</span>
                  <button
                    type="button"
                    onClick={() => removeAppliedPlatform(val)}
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

            {/* Question Platforms Section from QPF API */}
            {apiPlatforms.length > 0 && (
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Platforms</span>
                  {draftPlatforms.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearPlatformDraft}
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
                    placeholder="Search platforms..."
                    value={platformFilterSearch}
                    onChange={(e) => setPlatformFilterSearch(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-7 pr-2.5 py-1 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto no-scrollbar">
                  {filteredPlatforms
                    .slice(0, showMorePlatforms ? filteredPlatforms.length : 6)
                    .map((plat) => {
                      const isSelected = draftPlatforms.some(
                        (p) =>
                          p === String(plat.id) ||
                          p.toLowerCase() === plat.refCode.toLowerCase() ||
                          p.toLowerCase() === plat.refName.toLowerCase()
                      );
                      return (
                        <button
                          type="button"
                          key={plat.id}
                          onClick={() => handlePlatformClick(String(plat.id))}
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
                            <span className="truncate">{plat.refName}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 ml-1 shrink-0">
                            {plat.refCode}
                          </span>
                        </button>
                      );
                    })}
                </div>

                {filteredPlatforms.length > 6 && (
                  <button
                    type="button"
                    onClick={() => setShowMorePlatforms(!showMorePlatforms)}
                    className="text-left text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline pt-0.5 cursor-pointer"
                  >
                    {showMorePlatforms ? 'Show Less ∧' : `Show All (${filteredPlatforms.length}) ∨`}
                  </button>
                )}
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
                <div className="bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                    <table className="w-full text-left border-collapse min-w-[640px]">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/30">
                          <th className="py-3 px-4 w-16 text-center shrink-0">#</th>
                          <th className="py-3 px-4 min-w-[200px]">Title</th>
                          <th className="py-3 px-4 w-28 whitespace-nowrap">Platform</th>
                          <th className="py-3 px-4 w-28 whitespace-nowrap">Companies</th>
                          <th className="py-3 px-2 w-10 text-center shrink-0"></th>
                          <th className="py-3 px-4 w-28 text-right whitespace-nowrap">Action</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                        {isProblemsLoading ? (
                          <TableRowSkeleton rows={Math.min(pageSize, 25)} showTopic={false} showDifficulty={false} />
                        ) : error && displayedProblems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <i className="fa-solid fa-triangle-exclamation text-amber-500 text-2xl mb-1"></i>
                            <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                              Unable to load problems
                            </span>
                            <span className="text-xs text-slate-400 max-w-md">{error}</span>
                            <button
                              type="button"
                              onClick={() => setRetryAttempt((value) => value + 1)}
                              className="mt-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
                            >
                              Retry
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : displayedProblems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <i className="fa-solid fa-code text-2xl text-slate-300 dark:text-slate-600"></i>
                            <span className="font-medium text-sm">No problems found</span>
                            <span className="text-xs text-slate-400">Try adjusting your filters or search term</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      displayedProblems.map((prob) => {
                        const isBookmarked = bookmarks.some((b) => isBookmarkItem(b, prob.id, 'PROBLEM'));
                        const isSolved = Boolean(solvedByProblemId[String(prob.id)]);
                        const questionId = prob.questionId || prob.id;

                        return (
                          <tr
                            key={prob.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            {/* 1. Question ID (Colored by difficulty) */}
                            <td
                              className={`py-3 px-4 text-center font-mono text-xs font-semibold shrink-0 ${getDifficultyNumberColor(prob.difficulty)}`}
                              title={`Question ID: ${questionId} • Difficulty: ${prob.difficulty || 'Unknown'}`}
                            >
                              {questionId}
                            </td>

                            {/* 2. Title */}
                            <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white min-w-[200px] text-sm">
                              <Link
                                to={`/problems/${prob.slug || prob.id}`}
                                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-block leading-snug"
                              >
                                {prob.title}
                              </Link>
                            </td>

                            {/* 3. Platform */}
                            <td className="py-3 px-4">
                              {getPlatformBadge(prob)}
                            </td>

                            {/* 4. Companies (Display only 2 company icons) */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              {prob.companies && prob.companies.length > 0 ? (
                                <div
                                  className="flex items-center gap-1.5 flex-nowrap"
                                  title={
                                    prob.companies.length > 2
                                      ? `Companies: ${prob.companies.join(', ')}`
                                      : undefined
                                  }
                                >
                                  {prob.companies.slice(0, 2).map((compName, cIdx) => {
                                    const compData = companyMap.get(compName.toLowerCase().trim());
                                    return (
                                      <CompanyCircleBadge
                                        key={cIdx}
                                        name={compName}
                                        logoUrl={compData?.logo}
                                        website={compData?.website}
                                      />
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-xs">—</span>
                              )}
                            </td>

                            {/* 5. Bookmark Ribbon */}
                            <td className="py-3 px-2 text-center">
                              <button
                                type="button"
                                onClick={(e) =>
                                  handleBookmarkToggle(
                                    String(prob.id),
                                    prob.title,
                                    prob.difficulty,
                                    prob.topic || prob.category,
                                    e
                                  )
                                }
                                aria-label="Bookmark problem"
                                className={`p-1 rounded-md transition-colors cursor-pointer ${
                                  isBookmarked
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                              >
                                <i className={`fa-${isBookmarked ? 'solid' : 'regular'} fa-bookmark text-xs`}></i>
                              </button>
                            </td>

                            {/* 6. Action (Solved vs Solve) */}
                            <td className="py-3 px-4 text-right">
                              {isSolved ? (
                                <Link
                                  to={`/problems/${prob.slug || prob.id}`}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors no-underline shadow-2xs"
                                  title="Solved - Click to review or solve again"
                                >
                                  <i className="fa-solid fa-check text-[9px]"></i>
                                  <span>Solved</span>
                                </Link>
                              ) : (
                                <Link
                                  to={`/problems/${prob.slug || prob.id}`}
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors border border-blue-200 dark:border-blue-800/60 no-underline shadow-2xs"
                                >
                                  <span>Solve</span>
                                  <i className="fa-solid fa-arrow-right text-[9px]"></i>
                                </Link>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls (Reflects total matching filtered problems) */}
            {!isProblemsLoading && totalPages > 0 && totalMatching > 0 && (
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
