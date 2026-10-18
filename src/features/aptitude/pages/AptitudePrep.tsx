import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { toggleBookmarkItem } from '../../bookmarks/redux/bookmarkSlice';
import { openAuthModal } from '../../auth/redux/authSlice';
import { toast } from 'react-hot-toast';
import { mcqService } from '../../../services/mcqService';
import { referenceService, ReferenceItem } from '../../../services/referenceService';
import type { McqQuestion } from '../../../core/types/domain';
import {
  SynthesizedOption,
  cleanQuestionText,
  synthesizeMcqOptions,
} from '../utils/mcqUtils';
import { Skeleton, AptitudeQuestionSkeleton } from '../../../shared/components/ui/Skeleton';

export type AptitudeItem = McqQuestion;

export type AptitudeSubjectCode = 'APTITUDE' | 'REASONING' | 'VERBAL' | 'PSEUDOCODE';

export interface AptitudePrepProps {
  defaultCategory?: 'quantitative' | 'reasoning' | 'verbal' | 'logical' | 'pseudocode' | string;
}

interface QuestionTypeItem {
  id: number;
  name: string;
  code: string;
  count: number;
}

const SUBJECT_CONFIG: Record<
  AptitudeSubjectCode,
  {
    code: AptitudeSubjectCode;
    label: string;
    title: string;
    subtitle: string;
    icon: string;
    iconBg: string;
    iconColor: string;
    defaultId: number;
    urlParam: string;
  }
> = {
  APTITUDE: {
    code: 'APTITUDE',
    label: 'Quantitative',
    title: 'Quantitative',
    subtitle: 'Numbers, ratios, percentages and more',
    icon: 'fa-solid fa-calculator',
    iconBg: 'bg-blue-100 dark:bg-blue-900/60',
    iconColor: 'text-blue-600 dark:text-sky-400',
    defaultId: 30,
    urlParam: 'quantitative',
  },
  REASONING: {
    code: 'REASONING',
    label: 'Reasoning',
    title: 'Reasoning',
    subtitle: 'Logical thinking and problem solving',
    icon: 'fa-solid fa-brain',
    iconBg: 'bg-purple-100 dark:bg-purple-900/60',
    iconColor: 'text-purple-600 dark:text-purple-400',
    defaultId: 32,
    urlParam: 'reasoning',
  },
  VERBAL: {
    code: 'VERBAL',
    label: 'Verbal',
    title: 'Verbal',
    subtitle: 'Grammar, vocabulary and reading comprehension',
    icon: 'fa-solid fa-file-lines',
    iconBg: 'bg-cyan-100 dark:bg-cyan-900/60',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    defaultId: 33,
    urlParam: 'verbal',
  },
  PSEUDOCODE: {
    code: 'PSEUDOCODE',
    label: 'Pseudocode',
    title: 'Pseudocode',
    subtitle: 'Algorithms, logic, and code tracing',
    icon: 'fa-solid fa-code',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/60',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    defaultId: 31,
    urlParam: 'pseudocode',
  },
};

export const AptitudePrep: React.FC<AptitudePrepProps> = ({ defaultCategory }) => {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { bookmarks } = useAppSelector((state) => state.bookmarks);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Parse category from URL query param
  const parseSubjectCode = (raw: string | null | undefined): AptitudeSubjectCode => {
    if (!raw) return 'APTITUDE';
    const upper = raw.toUpperCase().trim();
    if (upper === 'REASONING' || upper === 'LOGICAL') return 'REASONING';
    if (upper === 'VERBAL') return 'VERBAL';
    if (upper === 'PSEUDOCODE' || upper === 'PSEUDO') return 'PSEUDOCODE';
    return 'APTITUDE';
  };

  const initialSubject = parseSubjectCode(searchParams.get('category') || defaultCategory);
  const [activeSubject, setActiveSubject] = useState<AptitudeSubjectCode>(initialSubject);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'default' | 'diff-asc' | 'diff-desc' | 'title-asc'>('default');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  // Question Type Accordion Open State
  const [isQuestionTypeOpen, setIsQuestionTypeOpen] = useState(true);

  // Data States
  const [questions, setQuestions] = useState<McqQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Reference Library Question Types for active category
  const [activeQuestionTypes, setActiveQuestionTypes] = useState<ReferenceItem[]>([]);

  // Subject ID mapping from reference library
  const [subjectRefMap, setSubjectRefMap] = useState<Record<AptitudeSubjectCode, number>>({
    APTITUDE: 30,
    REASONING: 32,
    VERBAL: 33,
    PSEUDOCODE: 31,
  });

  // Solve Modal State
  const [activeSolveQuestion, setActiveSolveQuestion] = useState<McqQuestion | null>(null);
  const [activeOptions, setActiveOptions] = useState<SynthesizedOption[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync category changes with URL query parameter
  const handleCategorySwitch = (code: AptitudeSubjectCode) => {
    setActiveSubject(code);
    setSearchParams({ category: SUBJECT_CONFIG[code].urlParam });
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedDifficulties([]);
    setSelectedTypes([]);
    setCurrentPage(1);
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load subject reference map on initial mount
  useEffect(() => {
    let isMounted = true;
    referenceService.getByGroupCode('SUBJECT').then((res) => {
      if (!isMounted) return;
      const rawSubjs = Array.isArray((res as any)?.data)
        ? (res as any).data
        : Array.isArray((res as any)?.data?.data)
        ? (res as any).data.data
        : Array.isArray(res)
        ? res
        : [];
      const map: Record<AptitudeSubjectCode, number> = {
        APTITUDE: 30,
        REASONING: 32,
        VERBAL: 33,
        PSEUDOCODE: 31,
      };
      rawSubjs.forEach((s: any) => {
        const code = String(s.refCode || '').toUpperCase().trim();
        if (code === 'APTITUDE' && typeof s.id === 'number') map.APTITUDE = s.id;
        if (code === 'REASONING' && typeof s.id === 'number') map.REASONING = s.id;
        if (code === 'VERBAL' && typeof s.id === 'number') map.VERBAL = s.id;
        if (code === 'PSEUDOCODE' && typeof s.id === 'number') map.PSEUDOCODE = s.id;
      });
      setSubjectRefMap(map);
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Load Question Types for the active category (APTITUDE, REASONING, VERBAL, PSEUDOCODE)
  useEffect(() => {
    let isMounted = true;
    referenceService.getByGroupCode(activeSubject).then((res) => {
      if (!isMounted) return;
      const items = Array.isArray((res as any)?.data)
        ? (res as any).data
        : Array.isArray((res as any)?.data?.data)
        ? (res as any).data.data
        : Array.isArray(res)
        ? res
        : [];
      setActiveQuestionTypes(items);
    }).catch((err) => {
      console.warn(`Could not load question types for ${activeSubject}:`, err);
    });

    return () => {
      isMounted = false;
    };
  }, [activeSubject]);

  // Map selected Question Types to reference item IDs
  const selectedTopicIds = useMemo(() => {
    if (selectedTypes.length === 0) return [];
    return activeQuestionTypes
      .filter((t) => selectedTypes.includes(t.refName || t.refCode || ''))
      .map((t) => Number(t.id))
      .filter((id) => !isNaN(id));
  }, [selectedTypes, activeQuestionTypes]);

  // Map selected Difficulties to DIFF IDs (Easy: 2, Medium: 3, Hard: 4)
  const selectedDifficultyIds = useMemo(() => {
    const ids: number[] = [];
    if (selectedDifficulties.includes('Easy')) ids.push(2);
    if (selectedDifficulties.includes('Medium')) ids.push(3);
    if (selectedDifficulties.includes('Hard')) ids.push(4);
    return ids;
  }, [selectedDifficulties]);

  // Fetch Questions from backend API
  const fetchQuestions = useCallback(async () => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    const activeSubjectId = subjectRefMap[activeSubject] ?? SUBJECT_CONFIG[activeSubject].defaultId;

    let sortField = 'id';
    let sortDir: 'ASC' | 'DESC' = 'ASC';
    if (sortBy === 'diff-asc') {
      sortField = 'difficultyRefCode';
      sortDir = 'ASC';
    } else if (sortBy === 'diff-desc') {
      sortField = 'difficultyRefCode';
      sortDir = 'DESC';
    } else if (sortBy === 'title-asc') {
      sortField = 'question';
      sortDir = 'ASC';
    }

    try {
      const response = await mcqService.getMcqList(
        {
          subject: [activeSubjectId],
          difficulty: selectedDifficultyIds,
          companies: [],
          topic: selectedTopicIds.length > 0 ? selectedTopicIds : null,
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

      const rawData: any = (response?.data as any)?.data || response?.data || response;
      const contentList: McqQuestion[] = Array.isArray(rawData?.content)
        ? rawData.content
        : Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.data)
        ? rawData.data
        : [];

      const total =
        typeof rawData?.totalElements === 'number'
          ? rawData.totalElements
          : typeof rawData?.total === 'number'
          ? rawData.total
          : contentList.length;

      const computedPages =
        typeof rawData?.totalPages === 'number' && rawData.totalPages > 0
          ? rawData.totalPages
          : Math.max(1, Math.ceil(total / pageSize));

      setQuestions(contentList);
      setTotalElements(total);
      setTotalPages(computedPages);
    } catch (err: any) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
      console.error('Error fetching questions for Aptitude:', err);
      setError('Unable to load questions. Please try again.');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [activeSubject, subjectRefMap, selectedDifficultyIds, selectedTopicIds, debouncedSearch, currentPage, sortBy]);

  useEffect(() => {
    fetchQuestions();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchQuestions]);

  // Compute question counts for active Question Types
  const availableQuestionTypes: QuestionTypeItem[] = useMemo(() => {
    const countMap: Record<string, number> = {};
    questions.forEach((q) => {
      const typeKey = q.topicRefName || q.topicRefCode;
      if (typeKey) {
        countMap[typeKey] = (countMap[typeKey] || 0) + 1;
      }
    });

    if (activeQuestionTypes.length > 0) {
      return activeQuestionTypes.map((t) => {
        const name = t.refName || t.refCode || '';
        const count = countMap[name] || countMap[t.refCode || ''] || 0;
        return {
          id: Number(t.id),
          name,
          code: t.refCode || '',
          count,
        };
      });
    }

    // Default question types for the category
    if (activeSubject === 'APTITUDE') {
      return [
        { id: 63, name: 'Percentages', code: 'PERCENTAGES', count: countMap['Percentages'] || 0 },
        { id: 80, name: 'Profit and Loss', code: 'PROFITLOSS', count: countMap['Profit and Loss'] || 0 },
        { id: 72, name: 'Ratio and Proportion', code: 'RATIOPROPORTION', count: countMap['Ratio and Proportion'] || 0 },
        { id: 76, name: 'Number System', code: 'NUMBERSYSTEM', count: countMap['Number System'] || 0 },
        { id: 79, name: 'Simple Interest', code: 'SIMPLEINTEREST', count: countMap['Simple Interest'] || 0 },
        { id: 62, name: 'Time and Work', code: 'TIMEWORK', count: countMap['Time and Work'] || 0 },
        { id: 71, name: 'Averages', code: 'AVERAGES', count: countMap['Averages'] || 0 },
      ];
    } else if (activeSubject === 'REASONING') {
      return [
        { id: 58, name: 'Ranking and Ordering', code: 'RANKINGORDERING', count: countMap['Ranking and Ordering'] || 0 },
        { id: 88, name: 'Blood Relations', code: 'BLOODRELATIONS', count: countMap['Blood Relations'] || 0 },
        { id: 75, name: 'Coding and Decoding', code: 'CODINGDECODING', count: countMap['Coding and Decoding'] || 0 },
        { id: 77, name: 'Seating Arrangements', code: 'SEATINGARRANGEMENT', count: countMap['Seating Arrangements'] || 0 },
        { id: 52, name: 'Syllogisms', code: 'SYLLOGISMS', count: countMap['Syllogisms'] || 0 },
        { id: 66, name: 'Direction Sense', code: 'DIRECTIONSENSE', count: countMap['Direction Sense'] || 0 },
        { id: 55, name: 'Number Series', code: 'NUMBERSERIES', count: countMap['Number Series'] || 0 },
      ];
    } else if (activeSubject === 'VERBAL') {
      return [
        { id: 81, name: 'Sentence Correction', code: 'SENTENCECORRECTION', count: countMap['Sentence Correction'] || 0 },
        { id: 49, name: 'Reading Comprehension', code: 'READINGCOMPREHENSION', count: countMap['Reading Comprehension'] || 0 },
        { id: 46, name: 'Synonyms and Antonyms', code: 'SYNONYMSANTONYMS', count: countMap['Synonyms and Antonyms'] || 0 },
        { id: 50, name: 'Para Jumbles', code: 'PARAJUMBLES', count: countMap['Para Jumbles'] || 0 },
        { id: 73, name: 'Vocabulary', code: 'VOCABULARY', count: countMap['Vocabulary'] || 0 },
        { id: 65, name: 'Grammar', code: 'GRAMMAR', count: countMap['Grammar'] || 0 },
      ];
    } else {
      return [
        { id: 56, name: 'Loops', code: 'LOOPS', count: countMap['Loops'] || 0 },
        { id: 54, name: 'Recursion', code: 'RECURSION', count: countMap['Recursion'] || 0 },
        { id: 43, name: 'Bitwise Operators', code: 'BITWISEOPERATORS', count: countMap['Bitwise Operators'] || 0 },
        { id: 78, name: 'Conditional Statements', code: 'CONDITIONALS', count: countMap['Conditional Statements'] || 0 },
        { id: 68, name: 'Arrays', code: 'ARRAYS', count: countMap['Arrays'] || 0 },
        { id: 87, name: 'Functions', code: 'FUNCTIONS', count: countMap['Functions'] || 0 },
      ];
    }
  }, [questions, activeQuestionTypes, activeSubject]);

  // Compute question counts for Easy, Medium, Hard
  const difficultyCounts = useMemo(() => {
    let easy = 0;
    let medium = 0;
    let hard = 0;
    questions.forEach((q) => {
      const code = String(q.difficultyRefCode || q.difficultyRefName || '').toUpperCase();
      if (code === 'EASY' || code === 'BASIC') easy++;
      else if (code === 'MEDIUM') medium++;
      else if (code === 'HARD') hard++;
    });
    return {
      Easy: easy,
      Medium: medium,
      Hard: hard,
      total: totalElements,
    };
  }, [questions, totalElements]);

  // Handlers for Filters
  const handleDifficultyToggle = (diff: string) => {
    setSelectedDifficulties((prev) =>
      prev.includes(diff) ? prev.filter((d) => d !== diff) : [...prev, diff]
    );
    setCurrentPage(1);
  };

  const handleTypeToggle = (typeName: string) => {
    setSelectedTypes((prev) =>
      prev.includes(typeName) ? prev.filter((t) => t !== typeName) : [...prev, typeName]
    );
    setCurrentPage(1);
  };

  const handleClearAll = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedDifficulties([]);
    setSelectedTypes([]);
    setSortBy('default');
    setCurrentPage(1);
  };

  // Bookmark Toggle
  const isItemBookmarked = (id: string | number) => {
    return Array.isArray(bookmarks) && bookmarks.some((b: any) => String(b.itemId) === String(id));
  };

  const handleBookmarkToggle = (item: McqQuestion, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      dispatch(openAuthModal({ mode: 'login' }));
      toast.error('Please sign in to bookmark questions');
      return;
    }
    const id = String(item.id);
    const currentlyBookmarked = isItemBookmarked(id);
    dispatch(
      toggleBookmarkItem({
        itemId: id,
        type: 'APTITUDE',
        title: cleanQuestionText(item.question) || `Question #${item.id}`,
        difficulty: item.difficultyRefName || item.difficultyRefCode || 'Medium',
        category: item.topicRefName || item.topicRefCode || 'General',
      })
    );
    if (currentlyBookmarked) {
      toast.success('Question removed from bookmarks');
    } else {
      toast.success('Question added to bookmarks');
    }
  };

  // Open Solve Modal
  const handleOpenSolveModal = (item: McqQuestion) => {
    const opts = synthesizeMcqOptions(item);
    setActiveSolveQuestion(item);
    setActiveOptions(opts);
    setSelectedAnswer(null);
    setIsSubmitted(false);
  };

  // Helper to normalize difficulty label
  const getDifficultyLabel = (q: McqQuestion): 'Easy' | 'Medium' | 'Hard' => {
    const raw = String(q.difficultyRefName || q.difficultyRefCode || '').toUpperCase();
    if (raw === 'HARD') return 'Hard';
    if (raw === 'MEDIUM') return 'Medium';
    return 'Easy';
  };

  // Active correct answer text
  const activeCorrectOption = useMemo(() => {
    return activeOptions.find((o) => o.isCorrect === true);
  }, [activeOptions]);

  return (
    <div className="w-full flex flex-col items-center pb-24 font-sans bg-[#FBFBFD] dark:bg-[#070A13] text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-200 overflow-x-hidden">
      
      {/* Ambient background glows matching Home and Practice page */}
      <div className="fixed top-24 -left-48 w-96 h-[400px] bg-purple-600/10 dark:bg-purple-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed top-40 -right-48 w-96 h-[500px] bg-indigo-600/10 dark:bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Main Content Container (Exact max-w-7xl matching Home & Practice page) */}
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

        {/* 2. CATEGORY SWITCHER CARDS (Quantitative, Reasoning, Verbal, Pseudocode) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-8">
          {(['APTITUDE', 'REASONING', 'VERBAL', 'PSEUDOCODE'] as const).map((code) => {
            const conf = SUBJECT_CONFIG[code];
            const isActive = activeSubject === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => handleCategorySwitch(code)}
                className={`rounded-2xl p-4 sm:p-5 text-left transition-all flex items-center justify-between cursor-pointer ${
                  isActive
                    ? 'border-2 border-blue-500 bg-white dark:bg-[#0D1322] shadow-md scale-[1.01]'
                    : 'border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0D1322] hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${conf.iconBg} ${conf.iconColor} flex items-center justify-center text-xl shrink-0 shadow-2xs`}>
                    <i className={conf.icon}></i>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">{conf.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{conf.subtitle}</p>
                  </div>
                </div>
                <i className={`fa-solid fa-chevron-right text-xs shrink-0 ${isActive ? 'text-blue-600 dark:text-sky-400 font-bold' : 'text-slate-400'}`}></i>
              </button>
            );
          })}
        </div>

        {/* 3. MAIN WORKSPACE: FILTERS SIDEBAR (LEFT) + QUESTIONS LIST (RIGHT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: FILTERS CARD */}
          <div className="lg:col-span-3 w-full bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-6">
            
            {/* Header: Filters + Clear All */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <i className="fa-solid fa-filter text-slate-600 dark:text-slate-400 text-xs"></i>
                <span>Filters</span>
              </div>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline cursor-pointer"
              >
                Clear All
              </button>
            </div>

            {/* Filter Group: Difficulty */}
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Difficulty
              </span>
              <div className="flex flex-col gap-2 pt-1">
                {(['Easy', 'Medium', 'Hard'] as const).map((diff) => {
                  const isChecked = selectedDifficulties.includes(diff);
                  const count = difficultyCounts[diff] || 0;
                  return (
                    <label
                      key={diff}
                      className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleDifficultyToggle(diff)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="flex items-center gap-1.5">
                        <span>{diff}</span>
                        {loading && count === 0 ? (
                          <span className="inline-block w-5 h-3 bg-slate-200 dark:bg-slate-700/80 rounded animate-pulse" />
                        ) : (
                          <span>({count})</span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Filter Group: Question Type (Collapsible Accordion) */}
            <div className="flex flex-col border-t border-slate-100 dark:border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setIsQuestionTypeOpen((prev) => !prev)}
                className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 cursor-pointer w-full text-left"
              >
                <span>Question Type</span>
                <i className={`fa-solid fa-chevron-down text-[10px] transition-transform ${isQuestionTypeOpen ? 'rotate-180' : ''}`}></i>
              </button>

              {isQuestionTypeOpen && (
                <div className="flex flex-col gap-2 pt-3 animate-fade-in max-h-64 overflow-y-auto pr-1">
                  {loading && availableQuestionTypes.length === 0 ? (
                    <div className="flex flex-col gap-2.5 py-1">
                      {[1, 2, 3, 4].map((idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Skeleton className="w-4 h-4 rounded" />
                          <Skeleton className={`h-3 ${idx % 2 === 0 ? 'w-24' : 'w-20'} rounded`} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    availableQuestionTypes.map((t) => {
                      const isChecked = selectedTypes.includes(t.name);
                      return (
                        <label
                          key={t.name}
                          className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors select-none"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTypeToggle(t.name)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="truncate">
                            {t.name} ({t.count})
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              )}
            </div>

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
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder={`Search ${SUBJECT_CONFIG[activeSubject].label} questions by title or keyword...`}
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setDebouncedSearch('');
                    }}
                    className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
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
                  <option value="default" className="bg-white dark:bg-[#0D1322] text-slate-800 dark:text-slate-200">Sort by</option>
                  <option value="diff-asc" className="bg-white dark:bg-[#0D1322] text-slate-800 dark:text-slate-200">Difficulty: Easy to Hard</option>
                  <option value="diff-desc" className="bg-white dark:bg-[#0D1322] text-slate-800 dark:text-slate-200">Difficulty: Hard to Easy</option>
                  <option value="title-asc" className="bg-white dark:bg-[#0D1322] text-slate-800 dark:text-slate-200">Title: A-Z</option>
                </select>
                <i className="fa-solid fa-chevron-down absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
              </div>
            </div>

            {/* Questions Counter */}
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1 pt-1 flex items-center justify-between min-h-[22px]">
              {loading && totalElements === 0 ? (
                <Skeleton className="h-4 w-32 rounded-md" />
              ) : (
                <span>{totalElements} Questions Found</span>
              )}
              {loading && (
                <span className="text-blue-500 flex items-center gap-1.5 font-medium">
                  <i className="fa-solid fa-spinner fa-spin text-xs"></i> Loading...
                </span>
              )}
            </div>

            {/* Questions List */}
            <div className="flex flex-col gap-3">
              {loading ? (
                <AptitudeQuestionSkeleton count={6} />
              ) : error ? (
                <div className="text-center py-12 bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6">
                  <i className="fa-solid fa-triangle-exclamation text-amber-500 text-3xl mb-3"></i>
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">{error}</h4>
                  <button
                    type="button"
                    onClick={fetchQuestions}
                    className="mt-3 px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6">
                  <i className="fa-solid fa-folder-open text-slate-300 dark:text-slate-700 text-4xl mb-3"></i>
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                    No questions found
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    Try adjusting your search or clearing your filters.
                  </p>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                questions.map((q) => {
                  const bookmarked = isItemBookmarked(q.id);
                  const diff = getDifficultyLabel(q);
                  const tags = [q.topicRefName, q.subjectRefName, q.companyName].filter(Boolean) as string[];

                  return (
                    <div
                      key={q.id}
                      className="bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      {/* Left Details: Title & Tags */}
                      <div className="flex flex-col items-start gap-2 flex-1 min-w-0 pr-2">
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                          {cleanQuestionText(q.question)}
                        </h4>

                        {/* Tag badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          {tags.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Right Details: Difficulty + Bookmark + Solve CTA */}
                      <div className="flex items-center gap-4 sm:gap-6 self-end sm:self-center shrink-0">
                        {/* Difficulty Indicator matching original design */}
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              diff === 'Easy'
                                ? 'bg-emerald-500'
                                : diff === 'Medium'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
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
                          <i className={`text-sm ${bookmarked ? 'fa-solid fa-bookmark text-amber-500' : 'fa-regular fa-bookmark'}`}></i>
                        </button>

                        {/* Solve Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenSolveModal(q)}
                          className="px-5 py-1.5 rounded-full border border-blue-500 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-sky-400 font-bold text-xs transition-all flex items-center gap-1.5 shadow-2xs hover:shadow-xs cursor-pointer active:translate-y-0.5"
                        >
                          <span>Solve</span>
                          <i className="fa-solid fa-arrow-right text-[10px]"></i>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Matching Reference Layout */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-6 pb-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1322] text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center text-xs transition-colors disabled:opacity-40 cursor-pointer"
                  aria-label="Previous Page"
                >
                  <i className="fa-solid fa-chevron-left text-[10px]"></i>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 2
                    );
                  })
                  .reduce<(number | string)[]>((acc, page, idx, arr) => {
                    if (idx > 0 && typeof arr[idx - 1] === 'number' && (page as number) - (arr[idx - 1] as number) > 1) {
                      acc.push('...');
                    }
                    acc.push(page);
                    return acc;
                  }, [])
                  .map((item, pIdx) => {
                    if (item === '...') {
                      return (
                        <span key={`ellipsis-${pIdx}`} className="text-slate-400 px-1 text-xs select-none">
                          ...
                        </span>
                      );
                    }
                    const pageNum = item as number;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition-colors cursor-pointer ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1322] text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1322] text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center text-xs transition-colors disabled:opacity-40 cursor-pointer"
                  aria-label="Next Page"
                >
                  <i className="fa-solid fa-chevron-right text-[10px]"></i>
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* 4. INTERACTIVE SOLVE QUESTION MODAL */}
      {activeSolveQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-sky-400">
                  {activeSolveQuestion.subjectRefName || SUBJECT_CONFIG[activeSubject].label}
                </span>
                {activeSolveQuestion.topicRefName && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {activeSolveQuestion.topicRefName}
                  </span>
                )}
                <span className="text-xs text-slate-400 font-medium">Question #{activeSolveQuestion.id}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    getDifficultyLabel(activeSolveQuestion) === 'Easy'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                      : getDifficultyLabel(activeSolveQuestion) === 'Medium'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
                  }`}
                >
                  {getDifficultyLabel(activeSolveQuestion)}
                </span>
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
                  className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto py-5 flex flex-col gap-5 pr-1">
              
              {/* Question Statement */}
              <div className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                {cleanQuestionText(activeSolveQuestion.question)}
              </div>

              {/* Company reference tag if available */}
              {activeSolveQuestion.companyName && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Frequently asked in:</span>
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40">
                    {activeSolveQuestion.companyName}
                  </span>
                </div>
              )}

              {/* Options Section */}
              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Select your answer:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeOptions.map((opt) => {
                    const isSelected = selectedAnswer === opt.optionText;
                    const isCorrect = isSubmitted && opt.isCorrect;
                    const isWrong = isSubmitted && isSelected && !opt.isCorrect;

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={isSubmitted}
                        onClick={() => setSelectedAnswer(opt.optionText)}
                        className={`p-3.5 rounded-2xl text-left border text-xs sm:text-sm font-semibold transition-all flex items-center gap-3 cursor-pointer ${
                          isCorrect
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                            : isWrong
                            ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-800 dark:text-rose-200'
                            : isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-800 dark:text-blue-200'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isCorrect
                              ? 'bg-emerald-500 text-white'
                              : isWrong
                              ? 'bg-rose-500 text-white'
                              : isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {opt.optionLabel}
                        </span>
                        <span>{opt.optionText}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Explanation & Feedback (When submitted) */}
              {isSubmitted && (
                <div
                  className={`p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed animate-fade-in ${
                    activeCorrectOption && selectedAnswer === activeCorrectOption.optionText
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                      : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold mb-1.5">
                    <i
                      className={`fa-solid ${
                        activeCorrectOption && selectedAnswer === activeCorrectOption.optionText
                          ? 'fa-circle-check text-emerald-600'
                          : 'fa-circle-exclamation text-amber-600'
                      }`}
                    ></i>
                    <span>
                      {activeCorrectOption && selectedAnswer === activeCorrectOption.optionText
                        ? 'Correct Answer! Great job.'
                        : `Incorrect. The correct answer is: ${activeCorrectOption ? `${activeCorrectOption.optionLabel}: ${activeCorrectOption.optionText}` : 'See explanation below'}`}
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
                    disabled={!selectedAnswer}
                    onClick={() => {
                      if (!selectedAnswer) return;
                      setIsSubmitted(true);
                      if (activeCorrectOption && selectedAnswer === activeCorrectOption.optionText) {
                        toast.success('Great job! Correct answer.');
                      } else {
                        toast.error('Incorrect. Check the explanation.');
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
                      } else {
                        setActiveSolveQuestion(null);
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

export default AptitudePrep;
