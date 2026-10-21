import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { mcqService } from '../../../services/mcqService';
import { referenceService, ReferenceItem } from '../../../services/referenceService';
import type { McqQuestion } from '../../../core/types/domain';
import {
  cleanQuestionText,
  synthesizeMcqOptions,
} from '../utils/mcqUtils';
import { RequestStatus } from '../../../shared/components/ui/RequestStatus';
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

interface AptitudeQuestionCardProps {
  question: McqQuestion;
  index: number;
}

const AptitudeQuestionCard: React.FC<AptitudeQuestionCardProps> = ({ question, index }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  const options = useMemo(() => synthesizeMcqOptions(question), [question]);
  const correctOption = useMemo(() => options.find((o) => o.isCorrect === true), [options]);

  const rawDiff = String(question.difficultyRefName || question.difficultyRefCode || '').toUpperCase();
  const diffLabel: 'Easy' | 'Medium' | 'Hard' =
    rawDiff === 'HARD' ? 'Hard' : rawDiff === 'MEDIUM' ? 'Medium' : 'Easy';

  const tags = [question.topicRefName, question.subjectRefName].filter(Boolean) as string[];

  const handleSelectOption = (optionText: string) => {
    if (isSubmitted) return;
    setSelectedAnswer(optionText);
  };

  const handleCheckAnswer = () => {
    if (!selectedAnswer) return;
    setIsSubmitted(true);
    if (correctOption && selectedAnswer === correctOption.optionText) {
      toast.success('Great job! Correct answer.');
    } else {
      toast.error('Incorrect. Check the explanation.');
      setShowExplanation(true);
    }
  };

  const handleReset = () => {
    setSelectedAnswer(null);
    setIsSubmitted(false);
    setShowExplanation(false);
  };

  const isUserCorrect = isSubmitted && correctOption && selectedAnswer === correctOption.optionText;
  const isUserIncorrect = isSubmitted && (!correctOption || selectedAnswer !== correctOption?.optionText);

  return (
    <div className="bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700/80 transition-all flex flex-col gap-4">
      {/* Top Header Row: Question number, tags & difficulty */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-400 border border-blue-200/60 dark:border-blue-800/50">
            Q{index}
          </span>
          {tags.map((tag, tIdx) => (
            <span
              key={tIdx}
              className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300"
            >
              {tag}
            </span>
          ))}
          {question.companyName && (
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40">
              {question.companyName}
            </span>
          )}
        </div>

        {/* Difficulty Badge */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span
            className={`w-2 h-2 rounded-full ${
              diffLabel === 'Easy'
                ? 'bg-emerald-500'
                : diffLabel === 'Medium'
                ? 'bg-amber-500'
                : 'bg-rose-500'
            }`}
          />
          <span>{diffLabel}</span>
        </div>
      </div>

      {/* Question Text */}
      <div className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
        {cleanQuestionText(question.question)}
      </div>

      {/* Options Grid */}
      <div className="flex flex-col gap-2 pt-1">
        {options.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {options.map((opt) => {
              const isSelected = selectedAnswer === opt.optionText;
              const isThisCorrect = isSubmitted && opt.isCorrect;
              const isThisWrong = isSubmitted && isSelected && !opt.isCorrect;
              const isOtherOption = isSubmitted && !isSelected && !opt.isCorrect;

              let cardStyles =
                'bg-slate-50/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-slate-800/60';
              let badgeStyles =
                'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700';

              if (isThisCorrect) {
                cardStyles =
                  'bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-500/50';
                badgeStyles = 'bg-emerald-500 text-white border-emerald-500';
              } else if (isThisWrong) {
                cardStyles =
                  'bg-rose-50/90 dark:bg-rose-950/50 border-rose-500 text-rose-900 dark:text-rose-100 ring-1 ring-rose-500/50';
                badgeStyles = 'bg-rose-500 text-white border-rose-500';
              } else if (isSelected) {
                cardStyles =
                  'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-900 dark:text-blue-100 ring-1 ring-blue-500/50 shadow-2xs';
                badgeStyles = 'bg-blue-600 text-white border-blue-600';
              } else if (isOtherOption) {
                cardStyles =
                  'bg-slate-50/40 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-800/50 text-slate-400 dark:text-slate-500 opacity-60';
                badgeStyles =
                  'bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border-slate-200/50 dark:border-slate-800/50';
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isSubmitted}
                  onClick={() => handleSelectOption(opt.optionText)}
                  className={`p-3.5 rounded-xl text-left border text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-3 cursor-pointer disabled:cursor-default ${cardStyles}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${badgeStyles}`}
                    >
                      {opt.optionLabel}
                    </span>
                    <span className="leading-snug break-words">{opt.optionText}</span>
                  </div>
                  {isThisCorrect && (
                    <i className="fa-solid fa-check text-emerald-600 dark:text-emerald-400 text-sm font-bold shrink-0"></i>
                  )}
                  {isThisWrong && (
                    <i className="fa-solid fa-xmark text-rose-600 dark:text-rose-400 text-sm font-bold shrink-0"></i>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-3.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-slate-500 dark:text-slate-400 text-xs italic">
            Multiple-choice options have not yet been configured for this question.
          </div>
        )}
      </div>

      {/* Action Row & Feedback */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 flex-wrap gap-2.5">
        <div className="flex items-center gap-3">
          {isUserCorrect && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <i className="fa-solid fa-circle-check"></i>
              <span>Correct!</span>
            </span>
          )}
          {isUserIncorrect && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
              <i className="fa-solid fa-circle-xmark"></i>
              <span>
                Incorrect. Correct is Option {correctOption?.optionLabel || 'shown'}.
              </span>
            </span>
          )}
          {!isSubmitted && (
            <span className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400">
              {selectedAnswer ? 'Click "Check Answer" to verify' : 'Select an option to check answer'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Solution toggle */}
          <button
            type="button"
            onClick={() => setShowExplanation(!showExplanation)}
            className="text-xs font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-sky-400 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <i className="fa-regular fa-lightbulb text-amber-500"></i>
            <span>{showExplanation ? 'Hide Solution' : 'View Solution'}</span>
            <i className={`fa-solid fa-chevron-${showExplanation ? 'up' : 'down'} text-[9px]`}></i>
          </button>

          {!isSubmitted ? (
            <button
              type="button"
              disabled={!selectedAnswer}
              onClick={handleCheckAnswer}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-bold text-xs transition-all shadow-2xs hover:shadow-xs cursor-pointer disabled:cursor-not-allowed active:scale-95"
            >
              Check Answer
            </button>
          ) : (
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
            >
              Try Again
            </button>
          )}
        </div>
      </div>

      {/* Explanation accordion */}
      {showExplanation && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm leading-relaxed animate-fade-in">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 mb-1">
            <i className="fa-solid fa-circle-info text-blue-500"></i>
            <span>
              Correct Answer:{' '}
              {correctOption ? `Option ${correctOption.optionLabel}: ${correctOption.optionText}` : 'N/A'}
            </span>
          </div>
          {question.explanation ? (
            <p className="mt-1 text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-700 dark:text-slate-200">Explanation: </span>
              {question.explanation}
            </p>
          ) : (
            <p className="mt-1 text-slate-600 dark:text-slate-400 italic">
              No detailed explanation provided for this question.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export const AptitudePrep: React.FC<AptitudePrepProps> = ({ defaultCategory }) => {
  const [searchParams, setSearchParams] = useSearchParams();

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

  // Search & Filter State (Draft vs Applied Architecture)
  const [draftSearch, setDraftSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [draftDifficulties, setDraftDifficulties] = useState<string[]>([]);
  const [appliedDifficulties, setAppliedDifficulties] = useState<string[]>([]);
  const [draftTopicIds, setDraftTopicIds] = useState<number[]>([]);
  const [appliedTopicIds, setAppliedTopicIds] = useState<number[]>([]);
  const [topicSearch, setTopicSearch] = useState<string>('');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const [sortBy, setSortBy] = useState<'default' | 'diff-asc' | 'diff-desc' | 'title-asc'>('default');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  // Question Type Accordion Open State
  const [isQuestionTypeOpen, setIsQuestionTypeOpen] = useState(true);

  // Data States
  const [committedPage, setCommittedPage] = useState(1);
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

  const abortControllerRef = useRef<AbortController | null>(null);

  // Detect unapplied changes between draft and applied filters
  const hasUnappliedChanges = useMemo(() => {
    if (draftSearch.trim() !== appliedSearch.trim()) return true;
    if (draftDifficulties.length !== appliedDifficulties.length) return true;
    if (!draftDifficulties.every((d) => appliedDifficulties.includes(d))) return true;
    if (draftTopicIds.length !== appliedTopicIds.length) return true;
    if (!draftTopicIds.every((id) => appliedTopicIds.includes(id))) return true;
    return false;
  }, [draftSearch, appliedSearch, draftDifficulties, appliedDifficulties, draftTopicIds, appliedTopicIds]);

  const draftFilterCount = useMemo(() => {
    return draftDifficulties.length + draftTopicIds.length + (draftSearch.trim() ? 1 : 0);
  }, [draftDifficulties, draftTopicIds, draftSearch]);

  const activeFilterCount = useMemo(() => {
    return appliedDifficulties.length + appliedTopicIds.length + (appliedSearch.trim() ? 1 : 0);
  }, [appliedDifficulties, appliedTopicIds, appliedSearch]);

  // Sync category changes with URL query parameter & reset all filters
  const handleCategorySwitch = (code: AptitudeSubjectCode) => {
    abortControllerRef.current?.abort();
    setQuestions([]);
    setTotalElements(0);
    setLoading(true);
    setError(null);
    setActiveSubject(code);
    setSearchParams({ category: SUBJECT_CONFIG[code].urlParam });
    setDraftSearch('');
    setAppliedSearch('');
    setDraftDifficulties([]);
    setAppliedDifficulties([]);
    setDraftTopicIds([]);
    setAppliedTopicIds([]);
    setTopicSearch('');
    setCurrentPage(1);
    if (isMobileFilterOpen) setIsMobileFilterOpen(false);
  };

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

  const [topicsLoading, setTopicsLoading] = useState(true);
  const [topicsError, setTopicsError] = useState<string | null>(null);
  const [topicsRetry, setTopicsRetry] = useState(0);

  // Load Question Types for the active category (APTITUDE, REASONING, VERBAL, PSEUDOCODE)
  useEffect(() => {
    let isMounted = true;
    setActiveQuestionTypes([]);
    setTopicsLoading(true);
    setTopicsError(null);
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
    }).catch(() => {
      if (isMounted) setTopicsError("Unable to load topic filters.");
    }).finally(() => {
      if (isMounted) setTopicsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [activeSubject, topicsRetry]);

  // Complete category topics with verified database IDs
  const allCategoryTopics: QuestionTypeItem[] = useMemo(() => {
    if (activeQuestionTypes.length > 0) {
      return activeQuestionTypes.map((t) => ({
        id: Number(t.id),
        name: t.refName || t.refCode || '',
        code: t.refCode || '',
        count: 0,
      }));
    }

    return [];
  }, [activeQuestionTypes]);

  // Filter topics by topicSearch input
  const availableQuestionTypes = useMemo(() => {
    if (!topicSearch.trim()) return allCategoryTopics;
    const q = topicSearch.toLowerCase().trim();
    return allCategoryTopics.filter(
      (t) => t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q)
    );
  }, [allCategoryTopics, topicSearch]);

  // Map applied Difficulties to backend DIFF IDs:
  // In the DB: 1=BASIC, 2=EASY, 3=MEDIUM, 4=HARD
  const selectedDifficultyIds = useMemo(() => {
    const ids: number[] = [];
    if (appliedDifficulties.includes('Easy')) {
      ids.push(1, 2);
    }
    if (appliedDifficulties.includes('Medium')) {
      ids.push(3);
    }
    if (appliedDifficulties.includes('Hard')) {
      ids.push(4);
    }
    return ids;
  }, [appliedDifficulties]);

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
          topic: appliedTopicIds.length > 0 ? appliedTopicIds : null,
          searchText: appliedSearch.trim(),
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
      setCommittedPage(currentPage);
      setTotalElements(total);
      setTotalPages(computedPages);
    } catch (err: any) {
      if (controller.signal.aborted || err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
      console.error('Error fetching questions for Aptitude:', err);
      setError('Unable to load questions. Please try again.');

    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [activeSubject, subjectRefMap, selectedDifficultyIds, appliedTopicIds, appliedSearch, currentPage, sortBy]);

  useEffect(() => {
    fetchQuestions();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchQuestions]);

  // Handlers for Filters
  const handleDifficultyToggle = (diff: string) => {
    setDraftDifficulties((prev) =>
      prev.includes(diff) ? prev.filter((d) => d !== diff) : [...prev, diff]
    );
  };

  const handleTopicToggle = (topicId: number) => {
    setDraftTopicIds((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]
    );
  };

  // APPLY FILTERS: Commits all staged draft filters and triggers backend API call
  const handleApplyFilters = () => {
    setAppliedDifficulties([...draftDifficulties]);
    setAppliedTopicIds([...draftTopicIds]);
    setAppliedSearch(draftSearch.trim());
    setCurrentPage(1);
    if (isMobileFilterOpen) {
      setIsMobileFilterOpen(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleApplyFilters();
  };

  const handleClearAll = () => {
    setDraftDifficulties([]);
    setDraftTopicIds([]);
    setDraftSearch('');
    setAppliedDifficulties([]);
    setAppliedTopicIds([]);
    setAppliedSearch('');
    setTopicSearch('');
    setSortBy('default');
    setCurrentPage(1);
  };

  const removeAppliedDifficulty = (diff: string) => {
    setDraftDifficulties((prev) => prev.filter((d) => d !== diff));
    setAppliedDifficulties((prev) => prev.filter((d) => d !== diff));
    setCurrentPage(1);
  };

  const removeAppliedTopic = (id: number) => {
    setDraftTopicIds((prev) => prev.filter((t) => t !== id));
    setAppliedTopicIds((prev) => prev.filter((t) => t !== id));
    setCurrentPage(1);
  };

  const removeAppliedSearch = () => {
    setDraftSearch('');
    setAppliedSearch('');
    setCurrentPage(1);
  };

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

        {/* Mobile Filter Toggle Button Bar (lg:hidden matching Problems page) */}
        <div className="lg:hidden flex items-center justify-between bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 mb-6 shadow-xs">
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen((prev) => !prev)}
            className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-sky-400">
              <i className="fa-solid fa-sliders text-xs"></i>
            </div>
            <span>Filter Questions</span>
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
              onClick={handleClearAll}
              className="text-xs font-semibold text-rose-500 dark:text-rose-400 hover:underline cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>

        {/* 3. MAIN WORKSPACE: FILTERS SIDEBAR (LEFT) + QUESTIONS LIST (RIGHT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: FILTERS CARD */}
          <div className={`${isMobileFilterOpen ? 'flex' : 'hidden'} lg:flex lg:col-span-3 w-full bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex-col gap-5`}>
            
            {/* APPLY FILTERS BUTTON AT THE VERY TOP OF THE FILTERS DIV (matching Problems page) */}
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
                {draftFilterCount > 0 && (
                  <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                    {draftFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Header: Filters Title + Clear All */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-sliders text-blue-600 dark:text-sky-400 text-sm"></i>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Filters</h3>
                {draftFilterCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-sky-400">
                    {draftFilterCount}
                  </span>
                )}
              </div>
              {(draftFilterCount > 0 || activeFilterCount > 0) && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs font-semibold text-rose-500 dark:text-rose-400 hover:underline cursor-pointer"
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
                {(['Easy', 'Medium', 'Hard'] as const).map((diff) => {
                  const isChecked = draftDifficulties.includes(diff);
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
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Filter Group: Question Type (Collapsible Accordion with Search) */}
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
                <div className="flex flex-col gap-2 pt-3 animate-fade-in">
                  {/* Topic search filter input */}
                  <div className="relative mb-1">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400"></i>
                    <input
                      type="text"
                      value={topicSearch}
                      onChange={(e) => setTopicSearch(e.target.value)}
                      placeholder="Search topics..."
                      className="w-full text-xs pl-7 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-500 transition-colors"
                    />
                    {topicSearch && (
                      <button
                        type="button"
                        onClick={() => setTopicSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px] cursor-pointer"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    )}
                  </div>

                  {/* Topics List with Max Height */}
                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                    {availableQuestionTypes.length === 0 ? (
                      <div className="text-xs text-slate-400 py-2 text-center">
                        No matching topics
                      </div>
                    ) : (
                      availableQuestionTypes.map((t) => {
                        const isChecked = draftTopicIds.includes(t.id);
                        return (
                          <label
                            key={t.id}
                            className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors select-none"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTopicToggle(t.id)}
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="truncate">{t.name}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: SEARCH, SORT, ACTIVE FILTERS & QUESTIONS LIST */}
          <div className="lg:col-span-9 w-full flex flex-col gap-4">
            
            {/* Top Bar: Search Input + Sort Dropdown */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              {/* Search Form */}
              <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800 rounded-2xl pl-4 pr-2.5 py-2 flex items-center gap-2.5 shadow-2xs focus-within:border-blue-500 transition-colors">
                <i className="fa-solid fa-magnifying-glass text-slate-400 text-sm"></i>
                <input
                  type="text"
                  value={draftSearch}
                  onChange={(e) => setDraftSearch(e.target.value)}
                  placeholder={`Search ${SUBJECT_CONFIG[activeSubject].label} questions by keyword...`}
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                />
                {draftSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setDraftSearch('');
                      if (appliedSearch) {
                        setAppliedSearch('');
                        setCurrentPage(1);
                      }
                    }}
                    className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer p-1"
                    title="Clear search"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer shrink-0"
                >
                  Search
                </button>
              </form>

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

            {/* Active Filter Pills Bar */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1 pb-1 animate-fade-in">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mr-1">
                  <i className="fa-solid fa-sliders text-[11px] text-blue-500"></i> Active Filters:
                </span>
                {appliedSearch && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-sky-300 border border-blue-200/60 dark:border-blue-800/60 shadow-2xs">
                    <span>Search: "{appliedSearch}"</span>
                    <button
                      type="button"
                      onClick={removeAppliedSearch}
                      className="hover:text-rose-500 transition-colors cursor-pointer"
                      title="Remove search"
                    >
                      <i className="fa-solid fa-xmark text-[10px]"></i>
                    </button>
                  </span>
                )}
                {appliedDifficulties.map((diff) => (
                  <span
                    key={diff}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs"
                  >
                    <span>{diff}</span>
                    <button
                      type="button"
                      onClick={() => removeAppliedDifficulty(diff)}
                      className="hover:text-rose-500 transition-colors cursor-pointer"
                      title={`Remove ${diff}`}
                    >
                      <i className="fa-solid fa-xmark text-[10px]"></i>
                    </button>
                  </span>
                ))}
                {appliedTopicIds.map((id) => {
                  const topicObj = allCategoryTopics.find((t) => t.id === id);
                  const name = topicObj?.name || `Topic #${id}`;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs"
                    >
                      <span>{name}</span>
                      <button
                        type="button"
                        onClick={() => removeAppliedTopic(id)}
                        className="hover:text-rose-500 transition-colors cursor-pointer"
                        title={`Remove ${name}`}
                      >
                        <i className="fa-solid fa-xmark text-[10px]"></i>
                      </button>
                    </span>
                  );
                })}
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs font-bold text-rose-500 dark:text-rose-400 hover:underline cursor-pointer ml-1"
                >
                  Clear All
                </button>
              </div>
            )}

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
              <RequestStatus pending={topicsLoading} error={topicsError} onRetry={() => setTopicsRetry((value) => value + 1)} label="Loading topic filters…" />
              <RequestStatus pending={loading} error={questions.length && error ? `${error} Showing previous results.` : null} onRetry={fetchQuestions} />
              {loading && questions.length === 0 ? (
                <AptitudeQuestionSkeleton count={6} />
              ) : error && questions.length === 0 ? (
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
                questions.map((q, idx) => (
                  <AptitudeQuestionCard
                    key={q.id}
                    question={q}
                    index={(committedPage - 1) * pageSize + idx + 1}
                  />
                ))
              )}
            </div>

            {/* Pagination Matching Reference Layout */}
            {totalPages > 1 && (
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



    </div>
  );
};

export default AptitudePrep;
