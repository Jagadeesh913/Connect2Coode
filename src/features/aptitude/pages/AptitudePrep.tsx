import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { toggleBookmarkItem } from '../../bookmarks/redux/bookmarkSlice';
import { openAuthModal } from '../../auth/redux/authSlice';
import { toast } from 'react-hot-toast';
import { mcqService } from '../../../services/mcqService';
import { referenceService, ReferenceItem } from '../../../services/referenceService';
import { companyService } from '../../../services/companyService';
import { CompanyBrandLogo } from '../../companies/components/CompanyBrandLogo';
import type { McqQuestion, Company } from '../../../core/types/domain';

export type AptitudeItem = McqQuestion;

export type AptitudeSubjectCode = 'APTITUDE' | 'PSEUDOCODE' | 'REASONING' | 'VERBAL';

export interface AptitudePrepProps {
  defaultCategory?: string;
}

const SUBJECT_CONFIG: Record<
  AptitudeSubjectCode,
  { label: string; title: string; subtitle: string; icon: string; defaultId: number }
> = {
  APTITUDE: {
    label: 'Quantitative',
    title: 'Quantitative Aptitude',
    subtitle: 'Numbers, arithmetic, percentages & ratios',
    icon: 'fa-solid fa-calculator',
    defaultId: 30,
  },
  PSEUDOCODE: {
    label: 'Pseudocode',
    title: 'Pseudocode',
    subtitle: 'Logic execution, loops, recursion & tracing',
    icon: 'fa-solid fa-code',
    defaultId: 31,
  },
  REASONING: {
    label: 'Reasoning',
    title: 'Logical Reasoning',
    subtitle: 'Patterns, deductions, series & problem solving',
    icon: 'fa-solid fa-brain',
    defaultId: 32,
  },
  VERBAL: {
    label: 'Verbal',
    title: 'Verbal Ability',
    subtitle: 'Grammar, vocabulary & comprehension',
    icon: 'fa-solid fa-file-lines',
    defaultId: 33,
  },
};

export const AptitudePrep: React.FC<AptitudePrepProps> = ({ defaultCategory }) => {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { bookmarks } = useAppSelector((state) => state.bookmarks);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Normalize initial subject code from search params or prop
  const parseSubjectCode = (raw: string | null | undefined): AptitudeSubjectCode => {
    if (!raw) return 'APTITUDE';
    const upper = raw.toUpperCase().trim();
    if (upper === 'PSEUDOCODE' || upper === 'PSEUDO') return 'PSEUDOCODE';
    if (upper === 'REASONING' || upper === 'LOGICAL') return 'REASONING';
    if (upper === 'VERBAL') return 'VERBAL';
    if (upper === 'QUANTITATIVE' || upper === 'APTITUDE') return 'APTITUDE';
    return 'APTITUDE';
  };

  const initialSubject = parseSubjectCode(searchParams.get('category') || defaultCategory);
  const [activeSubject, setActiveSubject] = useState<AptitudeSubjectCode>(initialSubject);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedCompanies, setSelectedCompanies] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<'default' | 'diff-asc' | 'diff-desc' | 'id-desc'>('default');

  // Pagination State (1-indexed for UI, 0-indexed for Spring Boot API)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Data States
  const [questions, setQuestions] = useState<McqQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Reference Library Options (Subjects, Difficulties, Topics, Companies)
  const [subjectRefMap, setSubjectRefMap] = useState<Record<AptitudeSubjectCode, number>>({
    APTITUDE: 30,
    PSEUDOCODE: 31,
    REASONING: 32,
    VERBAL: 33,
  });
  const [difficulties, setDifficulties] = useState<ReferenceItem[]>([]);
  const [topics, setTopics] = useState<ReferenceItem[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  // Accordion open states
  const [isQuestionTypeOpen, setIsQuestionTypeOpen] = useState(true);
  const [isCompanyFilterOpen, setIsCompanyFilterOpen] = useState(false);

  // Solve Modal State
  const [activeSolveQuestion, setActiveSolveQuestion] = useState<McqQuestion | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [selectedOptionLabel, setSelectedOptionLabel] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [modalDetailsLoading, setModalDetailsLoading] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load Reference Library Options (Subjects, Difficulties, Topics, Companies)
  useEffect(() => {
    let isMounted = true;

    const loadReferences = async () => {
      try {
        const [subjRes, diffRes, topicRes, compRes] = await Promise.allSettled([
          referenceService.getByGroupCode('SUBJECT'),
          referenceService.getByGroupCode('DIFF'),
          referenceService.getByGroupCode('TOPIC'),
          companyService.getCompanies(),
        ]);

        if (!isMounted) return;

        if (subjRes.status === 'fulfilled' && subjRes.value?.data) {
          const rawSubjs = Array.isArray(subjRes.value.data) ? subjRes.value.data : [];
          const map: Record<AptitudeSubjectCode, number> = {
            APTITUDE: 30,
            PSEUDOCODE: 31,
            REASONING: 32,
            VERBAL: 33,
          };
          rawSubjs.forEach((s) => {
            const code = String(s.refCode || '').toUpperCase().trim();
            if (code === 'APTITUDE' && typeof s.id === 'number') map.APTITUDE = s.id;
            if (code === 'PSEUDOCODE' && typeof s.id === 'number') map.PSEUDOCODE = s.id;
            if (code === 'REASONING' && typeof s.id === 'number') map.REASONING = s.id;
            if (code === 'VERBAL' && typeof s.id === 'number') map.VERBAL = s.id;
          });
          setSubjectRefMap(map);
        }

        if (diffRes.status === 'fulfilled' && diffRes.value?.data) {
          const rawDiffs = Array.isArray(diffRes.value.data) ? diffRes.value.data : [];
          setDifficulties(rawDiffs);
        }

        if (topicRes.status === 'fulfilled' && topicRes.value?.data) {
          const rawTopics = Array.isArray(topicRes.value.data) ? topicRes.value.data : [];
          setTopics(rawTopics);
        }

        if (compRes.status === 'fulfilled' && compRes.value?.data) {
          const rawComps = Array.isArray(compRes.value.data) ? compRes.value.data : [];
          setCompanies(rawComps);
        }
      } catch (err) {
        console.warn('Error loading reference library filters for Aptitude:', err);
      }
    };

    loadReferences();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch MCQs dynamically from backend API
  const fetchQuestions = useCallback(async () => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    const activeSubjectId = subjectRefMap[activeSubject] ?? SUBJECT_CONFIG[activeSubject].defaultId;

    let sortField = 'createdAt';
    let sortDir: 'ASC' | 'DESC' = 'DESC';
    if (sortBy === 'diff-asc') {
      sortField = 'difficultyRefCode';
      sortDir = 'ASC';
    } else if (sortBy === 'diff-desc') {
      sortField = 'difficultyRefCode';
      sortDir = 'DESC';
    } else if (sortBy === 'id-desc') {
      sortField = 'id';
      sortDir = 'DESC';
    }

    try {
      const response = await mcqService.getMcqList(
        {
          subject: [activeSubjectId],
          difficulty: selectedDifficulties,
          companies: selectedCompanies,
          topic: selectedTopic || null,
          searchText: debouncedSearch,
          pageRequest: {
            pageNumber: Math.max(0, currentPage - 1),
            pageSize,
            sortBy: sortField,
            sortDirection: sortDir,
          },
        },
        controller.signal
      );

      if (controller.signal.aborted) return;

      const pageData = response.data;
      if (pageData && Array.isArray(pageData.content)) {
        setQuestions(pageData.content);
        setTotalElements(pageData.totalElements ?? pageData.content.length);
        setTotalPages(Math.max(1, pageData.totalPages ?? 1));
      } else {
        setQuestions([]);
        setTotalElements(0);
        setTotalPages(1);
      }
    } catch (err: any) {
      if (controller.signal.aborted) return;
      console.error('Failed to fetch MCQs:', err);
      setError(err?.message || 'Failed to load questions from server');
      setQuestions([]);
      setTotalElements(0);
      setTotalPages(1);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [
    activeSubject,
    subjectRefMap,
    selectedDifficulties,
    selectedCompanies,
    selectedTopic,
    debouncedSearch,
    currentPage,
    pageSize,
    sortBy,
  ]);

  // Trigger query whenever filter dependencies update
  useEffect(() => {
    fetchQuestions();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchQuestions]);

  // Handle category switch
  const handleSubjectSwitch = (subj: AptitudeSubjectCode) => {
    setActiveSubject(subj);
    setSearchParams({ category: subj });
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedDifficulties([]);
    setSelectedTopic('');
    setSelectedCompanies([]);
    setCurrentPage(1);
  };

  // Toggle filter selections
  const handleDifficultyToggle = (code: string) => {
    setSelectedDifficulties((prev) =>
      prev.includes(code) ? prev.filter((d) => d !== code) : [...prev, code]
    );
    setCurrentPage(1);
  };

  const handleCompanyToggle = (companyId: number) => {
    setSelectedCompanies((prev) =>
      prev.includes(companyId) ? prev.filter((id) => id !== companyId) : [...prev, companyId]
    );
    setCurrentPage(1);
  };

  const handleClearAll = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedDifficulties([]);
    setSelectedTopic('');
    setSelectedCompanies([]);
    setSortBy('default');
    setCurrentPage(1);
  };

  // Check if an item is bookmarked in Redux
  const isItemBookmarked = (id: string | number) => {
    return Array.isArray(bookmarks) && bookmarks.some((b: any) => String(b.itemId) === String(id));
  };

  // Handle bookmarking
  const handleBookmarkToggle = (item: McqQuestion, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please sign in to bookmark questions');
      dispatch(openAuthModal({ mode: 'login' }));
      return;
    }

    dispatch(
      toggleBookmarkItem({
        itemId: String(item.id),
        type: 'APTITUDE',
        title: item.question.slice(0, 100),
        difficulty: item.difficultyRefName || item.difficultyRefCode || 'Medium',
        category: item.subjectRefName || item.subjectRefCode || 'Aptitude',
      })
    );
  };

  // Open Solve Modal
  const handleOpenSolveModal = async (item: McqQuestion) => {
    setActiveSolveQuestion(item);
    setSelectedOptionId(null);
    setSelectedOptionLabel(null);
    setIsSubmitted(false);

    // If item doesn't have options populated, fetch full details via GET /api/v1/mcq/{id}
    if (!item.options || item.options.length === 0) {
      setModalDetailsLoading(true);
      try {
        const fullRes = await mcqService.getMcqById(item.id);
        if (fullRes?.data) {
          setActiveSolveQuestion(fullRes.data);
        }
      } catch (err) {
        console.warn('Could not fetch single MCQ details:', err);
      } finally {
        setModalDetailsLoading(false);
      }
    }
  };

  // Determine correct option in current modal
  const correctOption = useMemo(() => {
    if (!activeSolveQuestion?.options) return null;
    return activeSolveQuestion.options.find((o) => o.isCorrect === true);
  }, [activeSolveQuestion]);

  return (
    <div className="w-full flex flex-col items-center pb-24 font-sans bg-[#FBFBFD] dark:bg-[#070A13] text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-200 overflow-x-hidden">
      {/* Ambient background glows matching Home and Practice page */}
      <div className="fixed top-24 -left-48 w-96 h-[400px] bg-purple-600/10 dark:bg-purple-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed top-40 -right-48 w-96 h-[500px] bg-indigo-600/10 dark:bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Main Content Container (max-w-7xl matching Home & Practice page) */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        {/* 1. HERO BANNER SECTION (Retina 2x Banners with cache-busting) */}
        <section className="w-full pb-6">
          <div className="w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800/80 bg-slate-100 dark:bg-[#050D1D]">
            <img
              src="/aptitude_banner_light.png?v=2"
              alt="Aptitude Practice Banner"
              className="w-full h-auto block dark:hidden object-cover select-none pointer-events-none"
            />
            <img
              src="/aptitude_banner_dark.png?v=2"
              alt="Aptitude Practice Banner"
              className="w-full h-auto hidden dark:block object-cover select-none pointer-events-none"
            />
          </div>
        </section>

        {/* 2. FOUR SUBJECT SWITCHER CARDS (Quantitative, Pseudocode, Reasoning, Verbal) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-6">
          {(['APTITUDE', 'PSEUDOCODE', 'REASONING', 'VERBAL'] as const).map((code) => {
            const conf = SUBJECT_CONFIG[code];
            const isActive = activeSubject === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => handleSubjectSwitch(code)}
                className={`rounded-2xl p-4 sm:p-5 text-left transition-all flex items-center justify-between cursor-pointer group ${
                  isActive
                    ? 'border-2 border-blue-500 bg-white dark:bg-[#0D1322] shadow-md scale-[1.01]'
                    : 'border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0D1322] hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg shrink-0 shadow-2xs transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60 group-hover:text-blue-600'
                    }`}
                  >
                    <i className={conf.icon}></i>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug truncate">
                      {conf.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 truncate">
                      {conf.subtitle}
                    </p>
                  </div>
                </div>
                <i
                  className={`fa-solid fa-chevron-right text-xs shrink-0 ml-2 transition-transform ${
                    isActive ? 'text-blue-600 dark:text-sky-400 translate-x-0.5' : 'text-slate-400 group-hover:translate-x-0.5'
                  }`}
                ></i>
              </button>
            );
          })}
        </div>

        {/* 3. MAIN WORKSPACE: FILTERS SIDEBAR (LEFT) + QUESTIONS LIST (RIGHT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
          {/* LEFT COLUMN: FILTERS CARD */}
          <div className="lg:col-span-3 w-full bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-6">
            {/* Header: Filters + Clear All */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <i className="fa-solid fa-filter text-slate-600 dark:text-slate-400 text-xs"></i>
                <span>Filters</span>
              </div>
              {(selectedDifficulties.length > 0 ||
                selectedTopic ||
                selectedCompanies.length > 0 ||
                searchQuery) && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Filter Group: Difficulty */}
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Difficulty
              </span>
              <div className="flex flex-col gap-2 pt-1">
                {(difficulties.length > 0
                  ? difficulties
                  : [
                      { id: 1, refCode: 'BASIC', refName: 'Basic' },
                      { id: 2, refCode: 'EASY', refName: 'Easy' },
                      { id: 3, refCode: 'MEDIUM', refName: 'Medium' },
                      { id: 4, refCode: 'HARD', refName: 'Hard' },
                    ]
                ).map((diff) => {
                  const code = String(diff.refCode || '').toUpperCase();
                  const isChecked = selectedDifficulties.includes(code);
                  return (
                    <label
                      key={diff.refCode || diff.id}
                      className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleDifficultyToggle(code)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span>{diff.refName || diff.refCode}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Filter Group: Topic (Collapsible Accordion) */}
            <div className="flex flex-col border-t border-slate-100 dark:border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setIsQuestionTypeOpen((prev) => !prev)}
                className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 cursor-pointer w-full text-left"
              >
                <span>Topic</span>
                <i
                  className={`fa-solid fa-chevron-down text-[10px] transition-transform ${
                    isQuestionTypeOpen ? 'rotate-180' : ''
                  }`}
                ></i>
              </button>

              {isQuestionTypeOpen && (
                <div className="flex flex-col gap-2 pt-3 max-h-64 overflow-y-auto pr-1">
                  <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors select-none">
                    <input
                      type="radio"
                      name="topicSelection"
                      checked={selectedTopic === ''}
                      onChange={() => {
                        setSelectedTopic('');
                        setCurrentPage(1);
                      }}
                      className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>All Topics</span>
                  </label>
                  {topics.map((t) => {
                    const isSelected = selectedTopic === t.refCode;
                    return (
                      <label
                        key={t.refCode || t.id}
                        className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors select-none"
                      >
                        <input
                          type="radio"
                          name="topicSelection"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedTopic(t.refCode);
                            setCurrentPage(1);
                          }}
                          className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="truncate">{t.refName || t.refCode}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Filter Group: Target Companies */}
            {companies.length > 0 && (
              <div className="flex flex-col border-t border-slate-100 dark:border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCompanyFilterOpen((prev) => !prev)}
                  className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 cursor-pointer w-full text-left"
                >
                  <span>Company</span>
                  <i
                    className={`fa-solid fa-chevron-down text-[10px] transition-transform ${
                      isCompanyFilterOpen ? 'rotate-180' : ''
                    }`}
                  ></i>
                </button>

                {isCompanyFilterOpen && (
                  <div className="flex flex-col gap-2 pt-3 max-h-56 overflow-y-auto pr-1">
                    {companies.slice(0, 15).map((comp) => {
                      if (!comp.id) return null;
                      const numId = Number(comp.id);
                      const isChecked = selectedCompanies.includes(numId);
                      return (
                        <label
                          key={comp.id}
                          className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors select-none"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleCompanyToggle(numId)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="truncate">{comp.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: SEARCH, SORT & QUESTIONS LIST */}
          <div className="lg:col-span-9 w-full flex flex-col gap-4">
            {/* Top Bar: Search Input + Sort Dropdown */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              {/* Search Box */}
              <div className="relative flex-1 w-full bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-2xs">
                <i className="fa-solid fa-magnifying-glass text-slate-400 text-sm"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${SUBJECT_CONFIG[activeSubject].title} questions...`}
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="relative shrink-0 w-full sm:w-auto">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="w-full sm:w-auto appearance-none bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800 rounded-2xl pl-4 pr-10 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none hover:border-blue-500/50 focus:border-blue-500 transition-colors cursor-pointer shadow-2xs"
                >
                  <option value="default" className="bg-white dark:bg-[#0D1322] text-slate-800 dark:text-slate-200">
                    Sort by: Recent
                  </option>
                  <option value="id-desc" className="bg-white dark:bg-[#0D1322] text-slate-800 dark:text-slate-200">
                    Sort by: ID (High to Low)
                  </option>
                  <option value="diff-asc" className="bg-white dark:bg-[#0D1322] text-slate-800 dark:text-slate-200">
                    Difficulty: Easy to Hard
                  </option>
                  <option value="diff-desc" className="bg-white dark:bg-[#0D1322] text-slate-800 dark:text-slate-200">
                    Difficulty: Hard to Easy
                  </option>
                </select>
                <i className="fa-solid fa-chevron-down absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
              </div>
            </div>

            {/* Questions Counter */}
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 px-1 pt-1">
              <span>{loading ? 'Fetching questions...' : `${totalElements} Questions Found`}</span>
              {totalPages > 1 && (
                <span>
                  Page {currentPage} of {totalPages}
                </span>
              )}
            </div>

            {/* Questions List */}
            {loading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3, 4, 5].map((skeletonIdx) => (
                  <div
                    key={skeletonIdx}
                    className="bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-2xs animate-pulse flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex flex-col gap-2.5 w-full max-w-lg">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4"></div>
                      <div className="flex gap-2">
                        <div className="h-3.5 bg-slate-100 dark:bg-slate-850 rounded w-16"></div>
                        <div className="h-3.5 bg-slate-100 dark:bg-slate-850 rounded w-20"></div>
                      </div>
                    </div>
                    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-24"></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl p-8 text-center flex flex-col items-center gap-3">
                <i className="fa-solid fa-triangle-exclamation text-2xl text-rose-500"></i>
                <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">Error Loading Questions</h4>
                <p className="text-xs text-rose-700 dark:text-rose-300 max-w-md">{error}</p>
                <button
                  type="button"
                  onClick={() => fetchQuestions()}
                  className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : questions.length === 0 ? (
              <div className="bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-xl">
                  <i className="fa-solid fa-file-circle-question"></i>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">No questions found</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                  We couldn't find any questions matching your current filters in {SUBJECT_CONFIG[activeSubject].title}.
                </p>
                {(selectedDifficulties.length > 0 || selectedTopic || selectedCompanies.length > 0 || searchQuery) && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {questions.map((q) => {
                  const bookmarked = isItemBookmarked(q.id);
                  const diff = String(q.difficultyRefName || q.difficultyRefCode || 'Medium');
                  const isEasy = diff.toUpperCase().includes('EASY') || diff.toUpperCase().includes('BASIC');
                  const isHard = diff.toUpperCase().includes('HARD');

                  return (
                    <div
                      key={q.id}
                      className="bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      {/* Left Details: Question Text & Badges */}
                      <div className="flex flex-col items-start gap-2.5 min-w-0">
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                          {q.question}
                        </h4>

                        {/* Badges: Subject, Topic, Company */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Subject badge */}
                          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-400 border border-blue-200/50 dark:border-blue-900/50">
                            {q.subjectRefName || q.subjectRefCode || activeSubject}
                          </span>

                          {/* Topic badge */}
                          {(q.topicRefName || q.topicRefCode) && (
                            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {q.topicRefName || q.topicRefCode}
                            </span>
                          )}

                          {/* Target Company Tag with Logo */}
                          {q.companyName && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/40">
                              <CompanyBrandLogo name={q.companyName} className="w-3.5 h-3.5 inline-block" />
                              <span>{q.companyName}</span>
                            </span>
                          )}

                          {/* Options Count Tag */}
                          {Array.isArray(q.options) && q.options.length > 0 && (
                            <span className="text-[11px] text-slate-400 font-medium">
                              • {q.options.length} options
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Details: Difficulty + Bookmark + Solve CTA */}
                      <div className="flex items-center gap-4 sm:gap-6 self-end sm:self-center shrink-0">
                        {/* Difficulty Indicator */}
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isEasy ? 'bg-emerald-500' : isHard ? 'bg-rose-500' : 'bg-amber-500'
                            }`}
                          />
                          <span>{diff}</span>
                        </div>

                        {/* Bookmark Icon Button */}
                        <button
                          type="button"
                          onClick={(e) => handleBookmarkToggle(q, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                          title={bookmarked ? 'Remove Bookmark' : 'Add Bookmark'}
                        >
                          <i
                            className={`text-sm ${
                              bookmarked ? 'fa-solid fa-bookmark text-amber-500' : 'fa-regular fa-bookmark'
                            }`}
                          ></i>
                        </button>

                        {/* Solve Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenSolveModal(q)}
                          className="py-2 px-4 rounded-xl border border-blue-500 hover:border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 dark:text-blue-400 font-semibold text-xs transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Solve</span>
                          <i className="fa-solid fa-arrow-right text-[10px]"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-slate-800">
                <button
                  type="button"
                  disabled={currentPage <= 1 || loading}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <i className="fa-solid fa-chevron-left mr-1.5 text-[10px]"></i>
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                    let pageNum = idx + 1;
                    if (totalPages > 5 && currentPage > 3) {
                      pageNum = currentPage - 2 + idx;
                      if (pageNum > totalPages) pageNum = totalPages - (4 - idx);
                    }
                    const isCurrent = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={currentPage >= totalPages || loading}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <i className="fa-solid fa-chevron-right ml-1.5 text-[10px]"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. INTERACTIVE SOLVE QUESTION MODAL */}
      {activeSolveQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div
            className="w-full max-w-2xl bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-sky-400">
                  {activeSolveQuestion.subjectRefName || activeSolveQuestion.subjectRefCode || activeSubject}
                </span>
                {activeSolveQuestion.topicRefName && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {activeSolveQuestion.topicRefName}
                  </span>
                )}
                <span className="text-xs text-slate-400">Question #{activeSolveQuestion.id}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => handleBookmarkToggle(activeSolveQuestion, e)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                  title="Bookmark"
                >
                  <i
                    className={`text-sm ${
                      isItemBookmarked(activeSolveQuestion.id)
                        ? 'fa-solid fa-bookmark text-amber-500'
                        : 'fa-regular fa-bookmark'
                    }`}
                  ></i>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSolveQuestion(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white text-base cursor-pointer"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex flex-col gap-5">
              {/* Question Text */}
              <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                {activeSolveQuestion.question}
              </div>

              {/* Company reference if applicable */}
              {activeSolveQuestion.companyName && (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <CompanyBrandLogo name={activeSolveQuestion.companyName} className="w-4 h-4" />
                  <span>Frequently asked at {activeSolveQuestion.companyName}</span>
                </div>
              )}

              {/* Options */}
              {modalDetailsLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading options...</div>
              ) : activeSolveQuestion.options && activeSolveQuestion.options.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Select your answer:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activeSolveQuestion.options.map((opt, idx) => {
                      const optionLabel = opt.optionLabel || String.fromCharCode(65 + idx);
                      const isSelected = selectedOptionId ? selectedOptionId === opt.id : selectedOptionLabel === optionLabel;
                      const isOptionCorrect = opt.isCorrect === true;
                      const showGreen = isSubmitted && isOptionCorrect;
                      const showRed = isSubmitted && isSelected && !isOptionCorrect;

                      return (
                        <button
                          key={opt.id || idx}
                          type="button"
                          disabled={isSubmitted}
                          onClick={() => {
                            if (opt.id) setSelectedOptionId(opt.id);
                            setSelectedOptionLabel(optionLabel);
                          }}
                          className={`p-3.5 rounded-2xl text-left border text-xs sm:text-sm font-semibold transition-all flex items-center gap-3 cursor-pointer ${
                            showGreen
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                              : showRed
                              ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-800 dark:text-rose-200'
                              : isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-800 dark:text-blue-200'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              showGreen
                                ? 'bg-emerald-500 text-white'
                                : showRed
                                ? 'bg-rose-500 text-white'
                                : isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {optionLabel}
                          </span>
                          <span>{opt.optionText}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  This question does not list multiple choice options. Check the solution explanation below.
                </div>
              )}

              {/* Explanation & Feedback (When submitted) */}
              {isSubmitted && (
                <div
                  className={`p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed animate-fade-in ${
                    correctOption && (selectedOptionId === correctOption.id || selectedOptionLabel === correctOption.optionLabel)
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                      : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold mb-1.5">
                    <i
                      className={`fa-solid ${
                        correctOption && (selectedOptionId === correctOption.id || selectedOptionLabel === correctOption.optionLabel)
                          ? 'fa-circle-check text-emerald-600'
                          : 'fa-circle-exclamation text-amber-600'
                      }`}
                    ></i>
                    <span>
                      {correctOption && (selectedOptionId === correctOption.id || selectedOptionLabel === correctOption.optionLabel)
                        ? 'Correct Answer!'
                        : correctOption
                        ? `Incorrect. Correct answer is Option ${correctOption.optionLabel}: ${correctOption.optionText}`
                        : 'Answer Solution:'}
                    </span>
                  </div>
                  {activeSolveQuestion.explanation && (
                    <p className="mt-1 text-slate-700 dark:text-slate-300">
                      <span className="font-bold">Step-by-step Solution: </span>
                      {activeSolveQuestion.explanation}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setActiveSolveQuestion(null)}
                className="px-5 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {!isSubmitted ? (
                  <button
                    type="button"
                    disabled={!selectedOptionId && !selectedOptionLabel && (!activeSolveQuestion.options || activeSolveQuestion.options.length > 0)}
                    onClick={() => {
                      setIsSubmitted(true);
                      if (correctOption) {
                        const isSelectedCorrect =
                          selectedOptionId === correctOption.id ||
                          selectedOptionLabel === correctOption.optionLabel;
                        if (isSelectedCorrect) {
                          toast.success('Great job! Correct answer.');
                        } else {
                          toast.error('Incorrect. Check the explanation.');
                        }
                      }
                    }}
                    className="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const currentIndex = questions.findIndex((q) => q.id === activeSolveQuestion.id);
                      if (currentIndex !== -1 && currentIndex + 1 < questions.length) {
                        handleOpenSolveModal(questions[currentIndex + 1]);
                      } else if (questions.length > 0) {
                        handleOpenSolveModal(questions[0]);
                      }
                    }}
                    className="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Next Question</span>
                    <i className="fa-solid fa-arrow-right text-[10px]"></i>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
