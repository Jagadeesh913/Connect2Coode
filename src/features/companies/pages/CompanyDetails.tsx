import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchCompanyBySlug, fetchCompanyProblems } from '../redux/companySlice';
import { CompanyDetailsSkeleton, TableRowSkeleton } from '../../../shared/components/ui/Skeleton';
import { isBookmarkItem, toggleBookmarkItem } from '../../bookmarks/redux/bookmarkSlice';
import { openAuthModal } from '../../auth/redux/authSlice';
import { toast } from 'react-hot-toast';
import { CompanyBrandLogo } from '../components/CompanyBrandLogo';
import { mcqService } from '../../../services/mcqService';
import type { McqQuestion } from '../../../core/types/domain';
import {
  SynthesizedOption,
  cleanQuestionText,
  synthesizeMcqOptions,
} from '../../aptitude/utils/mcqUtils';
import { companyService } from '../../../services/companyService';
import type { CompanyExamItem } from '../types/companyExam';
import { CompanyExamCard } from '../components/CompanyExamCard';
import { RequestStatus } from '../../../shared/components/ui/RequestStatus';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { GraduationCap, Code2 } from 'lucide-react';
import { useReferenceGroup } from '../../references/hooks/useReferenceGroup';

type CompanySection = 'coding' | 'aptitude' | 'reasoning' | 'verbal' | 'pseudocode';

interface SectionConfig {
  id: CompanySection;
  label: string;
  icon: string;
  subjectCode: string | null;
  subjectName?: string;
  description: string;
}

const SECTIONS: SectionConfig[] = [
  {
    id: 'coding',
    label: 'Coding Problems',
    icon: 'fa-solid fa-code',
    subjectCode: null,
    description: 'Algorithmic and programming challenges',
  },
  {
    id: 'aptitude',
    label: 'Aptitude',
    icon: 'fa-solid fa-calculator',
    subjectCode: 'APTITUDE',
    subjectName: 'Quantitative Aptitude',
    description: 'Numbers, arithmetic, percentages and ratios',
  },
  {
    id: 'reasoning',
    label: 'Reasoning',
    icon: 'fa-solid fa-brain',
    subjectCode: 'REASONING',
    subjectName: 'Logical Reasoning',
    description: 'Patterns, deductions, series and problem solving',
  },
  {
    id: 'verbal',
    label: 'Verbal',
    icon: 'fa-solid fa-file-lines',
    subjectCode: 'VERBAL',
    subjectName: 'Verbal Ability',
    description: 'Grammar, vocabulary, and reading comprehension',
  },
  {
    id: 'pseudocode',
    label: 'Pseudocode',
    icon: 'fa-solid fa-laptop-code',
    subjectCode: 'PSEUDOCODE',
    subjectName: 'Pseudocode',
    description: 'Logic execution, loops, recursion, and tracing',
  },
];

export const CompanyDetails: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const dispatch = useAppDispatch();
  const {
    selectedCompany,
    companyDetailRequestKey,
    companyProblems,
    detailsLoading,
    loading,
    companyProblemsLoading,
    detailError: companyError,
    problemsError,
  } = useAppSelector((state) => state.companies);
  const routeMatches = companyDetailRequestKey === slug?.trim().toLowerCase();
  const company = routeMatches ? selectedCompany : null;
  const isDetailsLoading = !routeMatches || (detailsLoading ?? loading);
  const { bookmarks } = useAppSelector((state) => state.bookmarks);
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const solvedByProblemId = useAppSelector((state) => state.progress.solvedByProblemId);
  const {
    items: subjectReferences,
    loading: subjectsLoading,
    error: subjectsError,
  } = useReferenceGroup('SUBJECT');

  // Section Selection (Coding, Aptitude, Reasoning, Verbal, Pseudocode)
  const [activeSection, setActiveSection] = useState<CompanySection>('coding');
  const [mcqsBySection, setMcqsBySection] = useState<Partial<Record<CompanySection, McqQuestion[]>>>({});
  const [mcqsLoading, setMcqsLoading] = useState<boolean>(false);
  const [mcqError, setMcqError] = useState<string | null>(null);
  const [mcqRetry, setMcqRetry] = useState(0);
  const [examsRetry, setExamsRetry] = useState(0);

  // Filters matching Image 1
  const [questionSearch, setQuestionSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [sortBy, setSortBy] = useState<'default' | 'difficulty-asc' | 'difficulty-desc'>('default');
  const [loadedCompanyKey, setLoadedCompanyKey] = useState<string | null>(null);

  // Solve Modal State for MCQs
  const [activeSolveMcq, setActiveSolveMcq] = useState<McqQuestion | null>(null);
  const [activeMcqOptions, setActiveMcqOptions] = useState<SynthesizedOption[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Tab State: Recruitment Exams (Default) vs Practice Questions
  const [activeTab, setActiveTab] = useState<'exams' | 'practice'>('exams');
  const [exams, setExams] = useState<CompanyExamItem[]>([]);
  const [examsLoading, setExamsLoading] = useState<boolean>(true);
  const [examsError, setExamsError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoadedCompanyKey(null);
    setMcqsLoading(true);
    setMcqsBySection({});
    const request = dispatch(fetchCompanyBySlug(slug));
    return () => {
      request.abort();
    };
  }, [dispatch, slug]);

  const companyId = company?.id;
  const companyName = company?.name;

  // Fetch Company Related Exams (API driven)
  useEffect(() => {
    const targetId = companyId ?? slug;
    if (targetId === undefined || targetId === null || targetId === '') return;
    const safeTargetId: string | number = targetId;

    let isMounted = true;
    const controller = new AbortController();

    async function loadCompanyExams() {
      setExamsLoading(true);
      setExamsError(null);
      try {
        const res = await companyService.getCompanyExamsList(
          safeTargetId,
          { pageNumber: 0, pageSize: 20, sortBy: 'year', sortDirection: 'DESC' },
          controller.signal
        );
        if (isMounted) {
          setExams(res.data.content || []);
        }
      } catch (err: any) {
        if (isMounted && err?.name !== 'CanceledError') {
          setExamsError(err?.message || 'Failed to fetch company exams');
          setExams([]);
        }
      } finally {
        if (isMounted) {
          setExamsLoading(false);
        }
      }
    }

    loadCompanyExams();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [companyId, slug, examsRetry]);

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

  // Load only the selected section; errors settle independently and are retryable.
  useEffect(() => {
    if (!companyId || activeSection === 'coding') return;
    const subjectCode = SECTIONS.find((section) => section.id === activeSection)?.subjectCode;
    const subjectId = subjectReferences.find(
      (subject) => String(subject.refCode).toUpperCase() === subjectCode
    )?.id;
    if (!subjectId) {
      setMcqsLoading(subjectsLoading);
      if (!subjectsLoading) {
        setMcqError(subjectsError || `Subject reference ${subjectCode || ''} is unavailable.`);
      }
      return;
    }
    const controller = new AbortController();
    setMcqsLoading(true);
    setMcqError(null);
    mcqService.getMcqList({
      subject: [Number(subjectId)], companies: [Number(companyId)],
      difficulty: [], topic: [], searchText: '',
      pageRequest: { pageNumber: 0, pageSize: 50, sortBy: 'id', sortDirection: 'ASC' },
    }, controller.signal).then((res) => {
      if (controller.signal.aborted) return;
      const pageData = res.data;
      if (!pageData || !Array.isArray(pageData.content)) {
        throw new Error('Unexpected company MCQ response format');
      }
      const list = pageData.content;
      setMcqsBySection((prev) => ({ ...prev, [activeSection]: list }));
    }).catch((err) => {
      if (!controller.signal.aborted) setMcqError(err?.message || 'Unable to load questions.');
    }).finally(() => {
      if (!controller.signal.aborted) setMcqsLoading(false);
    });
    return () => controller.abort();
  }, [companyId, activeSection, mcqRetry, subjectReferences, subjectsError, subjectsLoading]);

  const currentKey = company ? `${company.id ?? ''}-${company.name ?? ''}` : null;
  const isQuestionsLoading =
    isDetailsLoading ||
    companyProblemsLoading ||
    !company ||
    (currentKey !== null && loadedCompanyKey !== currentKey);

  // Coding Problems Filter
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
    }

    return list;
  }, [companyProblems, questionSearch, selectedDifficulty, sortBy]);

  // Helper for normalizing MCQ difficulty
  const getMcqDifficultyLabel = (q: McqQuestion): 'Easy' | 'Medium' | 'Hard' => {
    const raw = String(q.difficultyRefName || q.difficultyRefCode || '').toUpperCase();
    if (raw === 'HARD') return 'Hard';
    if (raw === 'MEDIUM') return 'Medium';
    return 'Easy';
  };

  // MCQ Filter for active section
  const isMcqSectionLoading = mcqsLoading && mcqsBySection[activeSection] === undefined;
  const currentMcqList = useMemo(
    () => mcqsBySection[activeSection] || [],
    [activeSection, mcqsBySection]
  );
  const filteredMcqs = useMemo(() => {
    let list = [...currentMcqList];

    if (questionSearch.trim()) {
      const q = questionSearch.toLowerCase().trim();
      list = list.filter(
        (m) =>
          cleanQuestionText(m.question).toLowerCase().includes(q) ||
          m.topicRefName?.toLowerCase().includes(q) ||
          m.subjectRefName?.toLowerCase().includes(q)
      );
    }

    if (selectedDifficulty !== 'All') {
      list = list.filter((m) => getMcqDifficultyLabel(m) === selectedDifficulty);
    }

    if (sortBy === 'difficulty-asc') {
      const rank: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3 };
      list.sort((a, b) => rank[getMcqDifficultyLabel(a)] - rank[getMcqDifficultyLabel(b)]);
    } else if (sortBy === 'difficulty-desc') {
      const rank: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3 };
      list.sort((a, b) => rank[getMcqDifficultyLabel(b)] - rank[getMcqDifficultyLabel(a)]);
    }

    return list;
  }, [currentMcqList, questionSearch, selectedDifficulty, sortBy]);

  const handleBookmarkToggle = (q: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please log in to bookmark questions');
      dispatch(openAuthModal({ mode: 'login' }));
      return;
    }
    const wasBookmarked = bookmarks.some((b) => isBookmarkItem(b, q.id, 'PROBLEM'));
    dispatch(
      toggleBookmarkItem({
        itemId: String(q.id),
        type: 'PROBLEM',
        title: q.title,
        difficulty: q.difficulty,
        category: q.topic || company?.name || '',
      })
    )
      .unwrap()
      .then(() => toast.success(wasBookmarked ? 'Bookmark removed' : 'Problem bookmarked!'))
      .catch((err: unknown) => toast.error(typeof err === 'string' ? err : 'Failed to update bookmark'));
  };

  const handleMcqBookmarkToggle = (q: McqQuestion, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please log in to bookmark questions');
      dispatch(openAuthModal({ mode: 'login' }));
      return;
    }
    const isBookmarked = bookmarks.some((b) => isBookmarkItem(b, q.id, 'APTITUDE'));
    dispatch(
      toggleBookmarkItem({
        itemId: String(q.id),
        type: 'APTITUDE',
        title: cleanQuestionText(q.question) || `Question #${q.id}`,
        difficulty: q.difficultyRefName || q.difficultyRefCode || 'Medium',
        category: q.topicRefName || q.topicRefCode || company?.name || 'Aptitude',
      })
    )
      .unwrap()
      .then(() => toast.success(isBookmarked ? 'Question removed from bookmarks' : 'Question added to bookmarks'))
      .catch((err: unknown) => toast.error(typeof err === 'string' ? err : 'Failed to update bookmark'));
  };

  const handleOpenSolveModal = (mcq: McqQuestion) => {
    const opts = synthesizeMcqOptions(mcq);
    setActiveSolveMcq(mcq);
    setActiveMcqOptions(opts);
    setSelectedAnswer(null);
    setIsSubmitted(false);
  };

  const activeCorrectOption = useMemo(() => {
    return activeMcqOptions.find((o) => o.isCorrect === true);
  }, [activeMcqOptions]);

  const currentSectionConfig = SECTIONS.find((s) => s.id === activeSection) || SECTIONS[0];

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
        <section className="bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden mb-6">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 relative z-10 w-full">
            {/* Big Company Logo Box */}
            <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl bg-white dark:bg-[#111A2E] border border-slate-200/80 dark:border-slate-700/80 p-3 flex items-center justify-center shrink-0 shadow-xs">
              <CompanyBrandLogo
                name={company.name}
                logo={company.logo}
                website={company.website}
                className="w-12 h-12 sm:w-14 sm:h-14"
              />
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

              {/* Stats Badges Row */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                {companyProblems.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-2xs">
                    <i className="fa-solid fa-code text-xs"></i>
                    <span>{companyProblems.length} {companyProblems.length === 1 ? 'Coding Problem' : 'Coding Problems'}</span>
                  </span>
                )}

                {company.industry && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-2xs">
                    <i className="fa-solid fa-briefcase text-xs"></i>
                    <span>{company.industry}</span>
                  </span>
                )}

                {company.website && (
                  <a
                    href={company.website}
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

        {/* 3. PRIMARY TAB SWITCHER: Recruitment Exams (Default) vs Practice Questions */}
        <div className="flex items-center gap-3 p-1.5 bg-slate-100 dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 rounded-2xl w-full sm:w-auto mb-6 max-w-md">
          <button
            type="button"
            onClick={() => setActiveTab('exams')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'exams'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Recruitment Exams</span>
            {exams.length > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab === 'exams'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {exams.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('practice')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'practice'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Practice Questions</span>
          </button>
        </div>

        {/* 4. RECRUITMENT EXAMS VIEW */}
        {activeTab === 'exams' && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Official Recruitment Exams &amp; Patterns
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Explore active hiring drives, syllabus, section timings, and role compensation for {company.name}
                </p>
              </div>
            </div>

            <RequestStatus pending={examsLoading} error={examsError} onRetry={() => setExamsRetry((value) => value + 1)} />
            {examsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-64 rounded-2xl bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-800 animate-pulse p-6"
                  />
                ))}
              </div>
            ) : examsError ? (
              <EmptyState title="Unable to load recruitment exams" description={examsError} actionText="Retry" onAction={() => setExamsRetry((value) => value + 1)} />
            ) : exams.length === 0 ? (
              <div className="my-8">
                <EmptyState
                  title={`No recruitment exams published yet for ${company.name}`}
                  description="There are currently no active placement exams listed for this company. You can practice curated coding and aptitude questions instead."
                  actionText="Practice Questions"
                  onAction={() => setActiveTab('practice')}
                  icon={<GraduationCap className="w-12 h-12 text-slate-400" />}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exams.map((exam) => (
                  <CompanyExamCard
                    key={exam.id}
                    exam={exam}
                    companyId={company.id ?? slug ?? ''}
                    companyName={company.name}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* 5. PRACTICE QUESTIONS VIEW */}
        {activeTab === 'practice' && (
          <>
            {/* Section Selection Buttons */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-3 mb-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          {SECTIONS.map((sec) => {
            const isActive = activeSection === sec.id;
            const count =
              sec.id === 'coding'
                ? (isQuestionsLoading ? null : companyProblems.length)
                : (mcqsBySection[sec.id] !== undefined ? mcqsBySection[sec.id]!.length : null);

            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => {
                  setActiveSection(sec.id);
                  setQuestionSearch('');
                  setSelectedDifficulty('All');
                  setSortBy('default');
                }}
                className={`flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-[1.02]'
                    : 'bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                }`}
              >
                <i className={`${sec.icon} ${isActive ? 'text-white' : 'text-slate-400'}`}></i>
                <span>{sec.label}</span>
                {count === null ? (
                  <span className="w-5 h-3.5 bg-slate-200 dark:bg-slate-700/80 animate-pulse rounded-full inline-block ml-1" />
                ) : (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 4. QUESTIONS SECTION CONTAINER */}
        <section className="bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
          
          {/* Search & Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
            
            {/* Search Input */}
            <div className="relative flex-1 w-full bg-slate-50 dark:bg-[#111A2E] border border-slate-200 dark:border-slate-700/80 rounded-2xl px-4 py-2.5">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs sm:text-sm"></i>
              <input
                type="text"
                placeholder={`Search ${currentSectionConfig.label} questions by title, tags or keywords...`}
                value={questionSearch}
                onChange={(e) => setQuestionSearch(e.target.value)}
                className="w-full bg-transparent pl-7 pr-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
              />
            </div>

            {/* Difficulty & Sort Dropdowns */}
            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
              {/* Difficulty Dropdown */}
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value as any)}
                  className="w-full sm:w-auto bg-slate-50 dark:bg-[#111A2E] border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-200 outline-none hover:border-blue-500 focus:border-blue-500 transition-colors cursor-pointer pr-9 appearance-none shadow-2xs"
                >
                  <option value="All" className="bg-white dark:bg-[#0D1322] text-slate-900 dark:text-slate-200">Difficulty: All</option>
                  <option value="Easy" className="bg-white dark:bg-[#0D1322] text-slate-900 dark:text-slate-200">Easy</option>
                  <option value="Medium" className="bg-white dark:bg-[#0D1322] text-slate-900 dark:text-slate-200">Medium</option>
                  <option value="Hard" className="bg-white dark:bg-[#0D1322] text-slate-900 dark:text-slate-200">Hard</option>
                </select>
                <i className="fa-solid fa-chevron-down text-[10px] text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
              </div>

              {/* Sort By Dropdown */}
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full sm:w-auto bg-slate-50 dark:bg-[#111A2E] border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-200 outline-none hover:border-blue-500 focus:border-blue-500 transition-colors cursor-pointer pr-9 appearance-none shadow-2xs"
                >
                  <option value="default" className="bg-white dark:bg-[#0D1322] text-slate-900 dark:text-slate-200">Sort by: Default</option>
                  <option value="difficulty-asc" className="bg-white dark:bg-[#0D1322] text-slate-900 dark:text-slate-200">Difficulty (Easy to Hard)</option>
                  <option value="difficulty-desc" className="bg-white dark:bg-[#0D1322] text-slate-900 dark:text-slate-200">Difficulty (Hard to Easy)</option>
                </select>
                <i className="fa-solid fa-chevron-down text-[10px] text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
              </div>
            </div>

          </div>

          {/* VIEW 1: CODING PROBLEMS TABLE */}
          {activeSection === 'coding' ? (
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left border-collapse min-w-[560px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-[#0A101D]">
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4">Title</th>
                    <th className="py-3.5 px-4 w-32">Difficulty</th>
                    <th className="py-3.5 px-4 w-28">Status</th>
                    <th className="py-3.5 px-2 w-10 text-center"></th>
                    <th className="py-3.5 px-4 w-24 text-right"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/80 text-xs sm:text-sm">
                  {isQuestionsLoading ? (
                    <TableRowSkeleton rows={8} />
                  ) : !isAuthenticated && companyProblems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-14 text-center text-slate-500 dark:text-slate-400">
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
                  ) : problemsError ? (
                    <tr><td colSpan={8}><RequestStatus error={problemsError} onRetry={() => dispatch(fetchCompanyProblems({ id: companyId ?? undefined, name: companyName }))} /></td></tr>
                  ) : filteredProblems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <i className="fa-solid fa-code text-2xl text-slate-300 dark:text-slate-600"></i>
                          <span className="font-semibold text-sm">No coding problems found</span>
                          <span className="text-xs text-slate-400">
                            {companyProblems.length === 0
                              ? 'Coding problems for this company will appear once added.'
                              : 'Try adjusting your search or difficulty filter.'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredProblems.map((problem, index) => {
                      const isSolved = Boolean(solvedByProblemId[problem.id]);
                      const isBookmarked = bookmarks.some((b) => isBookmarkItem(b, problem.id, 'PROBLEM'));
                      const diff = problem.difficulty?.toLowerCase();

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

                          {/* Status Pill */}
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
                              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl border border-blue-500 hover:border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white font-semibold text-xs transition-colors"
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
          ) : (
            /* VIEW 2: MCQ SECTIONS TABLE (Aptitude, Reasoning, Verbal, Pseudocode) */
            <>
            <RequestStatus
              pending={mcqsLoading && mcqsBySection[activeSection] !== undefined}
              error={mcqsBySection[activeSection] !== undefined ? mcqError : null}
              onRetry={() => setMcqRetry((value) => value + 1)}
              label={`Updating ${currentSectionConfig.label.toLowerCase()} questions…`}
            />
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left border-collapse min-w-[560px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-[#0A101D]">
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4">Question</th>
                    <th className="py-3.5 px-4 w-44">Topic</th>
                    <th className="py-3.5 px-4 w-32">Difficulty</th>
                    <th className="py-3.5 px-2 w-10 text-center"></th>
                    <th className="py-3.5 px-4 w-24 text-right"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/80 text-xs sm:text-sm">
                  {isMcqSectionLoading ? (
                    <TableRowSkeleton rows={6} showExamPlatform={false} showCompanies={false} />
                  ) : mcqError && mcqsBySection[activeSection] === undefined ? (
                    <tr><td colSpan={6}><RequestStatus error={mcqError} onRetry={() => setMcqRetry((value) => value + 1)} /></td></tr>
                  ) : filteredMcqs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <i className={`${currentSectionConfig.icon} text-2xl text-slate-300 dark:text-slate-600`}></i>
                          <span className="font-semibold text-sm">No {currentSectionConfig.label} questions found</span>
                          <span className="text-xs text-slate-400">
                            Try adjusting your search or difficulty filter.
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredMcqs.map((mcq, index) => {
                      const isBookmarked = bookmarks.some((b) => isBookmarkItem(b, mcq.id, 'APTITUDE'));
                      const diff = getMcqDifficultyLabel(mcq);

                      return (
                        <tr
                          key={mcq.id}
                          className="hover:bg-slate-50 dark:hover:bg-[#111A2E]/60 transition-colors"
                        >
                          {/* # Index */}
                          <td className="py-3.5 px-4 text-center font-mono text-xs font-semibold text-slate-400">
                            {index + 1}
                          </td>

                          {/* Question text */}
                          <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                            <button
                              type="button"
                              onClick={() => handleOpenSolveModal(mcq)}
                              className="hover:text-blue-600 dark:hover:text-blue-400 text-left transition-colors cursor-pointer line-clamp-2"
                            >
                              {cleanQuestionText(mcq.question)}
                            </button>
                          </td>

                          {/* Topic / Question Type */}
                          <td className="py-3.5 px-4">
                            {mcq.topicRefName || mcq.topicRefCode ? (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                                {mcq.topicRefName || mcq.topicRefCode}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>

                          {/* Difficulty with colored dot */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  diff === 'Easy'
                                    ? 'bg-emerald-500'
                                    : diff === 'Hard'
                                    ? 'bg-rose-500'
                                    : 'bg-amber-500'
                                }`}
                              ></span>
                              <span
                                className={`font-medium ${
                                  diff === 'Easy'
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : diff === 'Hard'
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-amber-600 dark:text-amber-400'
                                }`}
                              >
                                {diff}
                              </span>
                            </div>
                          </td>

                          {/* Bookmark Button */}
                          <td className="py-3.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={(e) => handleMcqBookmarkToggle(mcq, e)}
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
                            <button
                              type="button"
                              onClick={() => handleOpenSolveModal(mcq)}
                              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl border border-blue-500 hover:border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white font-semibold text-xs transition-colors cursor-pointer"
                            >
                              <span>Solve</span>
                              <i className="fa-solid fa-arrow-right text-[10px]"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            </>
          )}

        </section>
          </>
        )}

      </div>

      {/* 5. INTERACTIVE SOLVE MODAL FOR MCQS */}
      {activeSolveMcq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-7 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-sky-400">
                  {activeSolveMcq.subjectRefName || currentSectionConfig.label}
                </span>
                {activeSolveMcq.topicRefName && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {activeSolveMcq.topicRefName}
                  </span>
                )}
                <span className="text-xs text-slate-400 font-medium">Question #{activeSolveMcq.id}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    getMcqDifficultyLabel(activeSolveMcq) === 'Easy'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                      : getMcqDifficultyLabel(activeSolveMcq) === 'Medium'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
                  }`}
                >
                  {getMcqDifficultyLabel(activeSolveMcq)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => handleMcqBookmarkToggle(activeSolveMcq, e)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                  title="Bookmark"
                >
                  <i
                    className={`text-sm ${
                      bookmarks.some((b) => isBookmarkItem(b, activeSolveMcq.id, 'APTITUDE'))
                        ? 'fa-solid fa-bookmark text-amber-500'
                        : 'fa-regular fa-bookmark'
                    }`}
                  ></i>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSolveMcq(null)}
                  className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto py-5 flex flex-col gap-5 pr-1">
              
              {/* Question Statement */}
              <div className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 leading-relaxed bg-slate-50 dark:bg-[#111A2E] p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                {cleanQuestionText(activeSolveMcq.question)}
              </div>

              {/* Company reference badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Frequently asked in:</span>
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40">
                  {company.name}
                </span>
              </div>

              {/* Options Section */}
              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Select your answer:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeMcqOptions.map((opt) => {
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
                            : 'bg-white dark:bg-[#111A2E] border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-slate-600 text-slate-800 dark:text-slate-200'
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
                  {activeSolveMcq.explanation && (
                    <p className="mt-1 text-slate-700 dark:text-slate-300">
                      <span className="font-bold">Step-by-step Solution: </span>
                      {activeSolveMcq.explanation}
                    </p>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setActiveSolveMcq(null)}
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
                      const currentIndex = filteredMcqs.findIndex((q) => q.id === activeSolveMcq.id);
                      if (currentIndex !== -1 && currentIndex + 1 < filteredMcqs.length) {
                        handleOpenSolveModal(filteredMcqs[currentIndex + 1]);
                      } else {
                        setActiveSolveMcq(null);
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

export default CompanyDetails;
